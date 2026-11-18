using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using SOMS.Application.Common.Security;
using SOMS.Application.Modules.Academic;
using SOMS.Domain.Entities;
using SOMS.Infrastructure.Data;

namespace SOMS.Api.Controllers;

[Route("api/academic")]
public sealed class AcademicEnrollmentsController(SomsDbContext db, TimeProvider clock) : AcademicControllerBase(db, clock)
{
    private const string Permission = PermissionCodes.ClassesManage;

    [HttpGet("classes/{classId:guid}/enrollments")]
    public async Task<IActionResult> Roster(Guid classId, Guid? schoolId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchool(schoolId, Permission, ct);
        if (error != null) return error;
        if (!await Db.Set<SchoolClass>().AnyAsync(row => row.Id == classId && row.SchoolId == school, ct))
            return NotFound();

        var items = await (from enrollment in Db.Set<ClassEnrollment>()
                           join student in Db.Set<Student>() on enrollment.StudentId equals student.Id
                           where enrollment.ClassId == classId && student.SchoolId == school
                           orderby enrollment.Status != "active", student.StudentCode, enrollment.EnrolledOn, enrollment.Id
                           select new EnrollmentRow(enrollment.Id, student.Id, student.StudentCode, student.FullName,
                               enrollment.EnrolledOn, enrollment.LeftOn, enrollment.Status)).ToListAsync(ct);
        return Ok(new ClassRoster(items, items.Count(item => item.Status == "active")));
    }

    [HttpGet("classes/{classId:guid}/enrollment-candidates")]
    public async Task<IActionResult> Candidates(Guid classId, Guid? schoolId, string? search, CancellationToken ct)
    {
        var (school, error) = await ResolveSchool(schoolId, Permission, ct);
        if (error != null) return error;
        if (!await Db.Set<SchoolClass>().AnyAsync(row => row.Id == classId && row.SchoolId == school, ct))
            return NotFound();

        var term = search?.Trim() ?? "";
        if (term.Length > 200)
            return Problem(statusCode: 400, title: "Từ khóa không được vượt quá 200 ký tự.");

        var students = Db.Set<Student>().Where(student => student.SchoolId == school && student.Status == "enrolled"
            && !Db.Set<ClassEnrollment>().Any(row => row.StudentId == student.Id && row.Status == "active"));
        if (term.Length != 0)
        {
            var pattern = SearchPattern(term);
            students = students.Where(student => EF.Functions.ILike(EF.Functions.Collate(student.StudentCode, "und-x-icu"), pattern, "\\")
                || EF.Functions.ILike(EF.Functions.Collate(student.FullName, "und-x-icu"), pattern, "\\"));
        }
        return Ok(await students.OrderBy(student => student.StudentCode).ThenBy(student => student.Id)
            .Take(25).Select(student => new EnrollmentStudent(student.Id, student.StudentCode, student.FullName))
            .ToListAsync(ct));
    }

    [HttpGet("classes/{classId:guid}/transfer-destinations")]
    public async Task<IActionResult> Destinations(Guid classId, Guid? schoolId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchool(schoolId, Permission, ct);
        if (error != null) return error;
        if (!await CanTransfer(school, ct)) return Forbid();
        var source = await Db.Set<SchoolClass>().SingleOrDefaultAsync(row => row.Id == classId && row.SchoolId == school, ct);
        if (source == null) return NotFound();

        return Ok(await Db.Set<SchoolClass>().Where(row => row.Id != classId && row.SchoolId == school
            && row.AcademicYearId == source.AcademicYearId && row.GradeLevelId == source.GradeLevelId && row.Status == "active")
            .OrderBy(row => row.Code).ThenBy(row => row.Id)
            .Select(row => new TransferClass(row.Id, row.Code, row.Name)).ToListAsync(ct));
    }

    [HttpPost("classes/{classId:guid}/enrollments")]
    public async Task<IActionResult> Enroll(Guid classId, EnrollmentInput input, Guid? schoolId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchool(schoolId, Permission, ct);
        if (error != null) return error;
        return await InTransaction(() => Write(school, classId, input.StudentId, null, ct), ct);
    }

    [HttpPost("enrollments/{id:guid}/transfer")]
    public async Task<IActionResult> Transfer(Guid id, TransferInput input, Guid? schoolId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchool(schoolId, Permission, ct);
        if (error != null) return error;
        if (!await CanTransfer(school, ct)) return Forbid();

        var source = await (from enrollment in Db.Set<ClassEnrollment>()
                            join row in Db.Set<SchoolClass>() on enrollment.ClassId equals row.Id
                            join student in Db.Set<Student>() on enrollment.StudentId equals student.Id
                            where enrollment.Id == id && row.SchoolId == school && student.SchoolId == school
                            select enrollment).AsNoTracking().SingleOrDefaultAsync(ct);
        if (source == null) return NotFound();
        if (source.ClassId == input.ClassId)
            return Problem(statusCode: 400, title: "Chọn lớp đích khác lớp hiện tại.");

        return await InTransaction(() => Write(school, input.ClassId, source.StudentId, source, ct), ct);
    }

    private async Task<bool> CanTransfer(Guid school, CancellationToken ct) =>
        (await GetSchools(PermissionCodes.StudentsManage, ct)).Any(item => item.Id == school);

    private async Task<IActionResult> Write(Guid school, Guid targetId, Guid studentId, ClassEnrollment? source, CancellationToken ct)
    {
        var classIds = source == null ? new[] { targetId } : new[] { targetId, source.ClassId };
        if (await LockClasses(school, classIds, ct) != classIds.Length || !await LockStudent(school, studentId, ct))
            return NotFound();

        var classes = await Db.Set<SchoolClass>().Where(row => classIds.Contains(row.Id)).ToDictionaryAsync(row => row.Id, ct);
        var target = classes[targetId];
        var student = await Db.Set<Student>().SingleAsync(row => row.Id == studentId, ct);
        if (target.Status != "active" || student.Status != "enrolled")
            return Problem(statusCode: 409, title: "Lớp hoặc hồ sơ học sinh không còn hoạt động.");
        if (source != null)
        {
            var original = classes[source.ClassId];
            if (original.AcademicYearId != target.AcademicYearId || original.GradeLevelId != target.GradeLevelId)
                return Problem(statusCode: 400, title: "Lớp đích phải cùng năm học và khối.");
        }

        var today = await SchoolToday(school, ct);
        var yearIsCurrent = await Db.Set<AcademicYear>().AnyAsync(row => row.Id == target.AcademicYearId
            && row.SchoolId == school && row.Status == "active" && row.StartDate <= today && row.EndDate >= today, ct);
        var gradeBelongsToSchool = await Db.Set<GradeLevel>().AnyAsync(row => row.Id == target.GradeLevelId
            && row.SchoolId == school, ct);
        if (!yearIsCurrent || !gradeBelongsToSchool)
            return Problem(statusCode: 409, title: "Năm học hoặc khối của lớp không hợp lệ cho ngày ghi danh.");

        var history = Db.Set<ClassEnrollment>().Where(row => row.StudentId == studentId);
        var current = await history.SingleOrDefaultAsync(row => row.Status == "active", ct);
        if (source == null ? current != null : current?.Id != source.Id || current.EnrolledOn > today)
            return Problem(statusCode: 409, title: "Ghi danh hiện tại đã thay đổi. Hãy tải lại dữ liệu.");

        var currentId = current?.Id ?? Guid.Empty;
        if (await history.AnyAsync(row => row.Id != currentId
            && (row.LeftOn == null || row.LeftOn > today || row.ClassId == targetId && row.EnrolledOn == today), ct))
            return Problem(statusCode: 409, title: "Ngày ghi danh trùng với lịch sử của học sinh.");
        if (target.Capacity is int capacity && await ActiveEnrollments(targetId).CountAsync(ct) >= capacity)
            return Problem(statusCode: 409, title: "Lớp đã đủ sĩ số.");

        var enrollment = new ClassEnrollment { Id = Guid.NewGuid(), ClassId = targetId, StudentId = studentId, EnrolledOn = today };
        try
        {
            if (current != null)
            {
                current.Status = "moved";
                current.LeftOn = today;
                await Db.SaveChangesAsync(ct);
            }

            Db.Add(enrollment);
            await Db.SaveChangesAsync(ct);
            if (current != null)
            {
                var before = JsonSerializer.Serialize(new { class_id = current.ClassId, status = "active" });
                var after = JsonSerializer.Serialize(new { class_id = targetId, enrollment_id = enrollment.Id, effective_on = today });
                await Db.Database.ExecuteSqlInterpolatedAsync($"""
                    INSERT INTO public.audit_logs (school_id, actor_id, table_name, row_id, operation, before_data, after_data)
                    VALUES ({school}, {ActorId!.Value}, 'class_enrollments', {current.Id.ToString()}, 'UPDATE',
                            CAST({before} AS jsonb), CAST({after} AS jsonb))
                    """, ct);
            }
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            return Problem(statusCode: 409, title: "Ghi danh đã thay đổi. Hãy tải lại dữ liệu.");
        }

        var result = new EnrollmentRow(enrollment.Id, student.Id, student.StudentCode, student.FullName, today, null, enrollment.Status);
        return CreatedAtAction(nameof(Roster), new { classId = targetId, schoolId = school }, result);
    }
}
