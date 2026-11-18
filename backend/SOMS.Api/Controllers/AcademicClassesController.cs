using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using SOMS.Application.Common.Security;
using SOMS.Application.Modules.Academic;
using SOMS.Domain.Entities;
using SOMS.Infrastructure.Data;

namespace SOMS.Api.Controllers;

[Route("api/academic")]
public class AcademicClassesController(SomsDbContext db, TimeProvider clock) : AcademicControllerBase(db, clock)
{
    [HttpGet("context")]
    public async Task<IActionResult> Context(CancellationToken ct)
    {
        var schools = await GetSchools(PermissionCodes.AcademicManage, ct);
        return schools.Count == 0 ? Forbid() : Ok(schools);
    }

    [HttpGet("academic-years")]
    public async Task<IActionResult> AcademicYears(Guid? schoolId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchool(schoolId, PermissionCodes.ClassesManage, ct);
        if (error != null) return error;
        return Ok(await Db.Set<AcademicYear>().Where(row => row.SchoolId == school)
            .OrderByDescending(row => row.Name)
            .Select(row => new AcademicYearOption(row.Id, row.Name, row.Status)).ToListAsync(ct));
    }

    [HttpGet("semesters")]
    public async Task<IActionResult> Semesters(Guid? schoolId, Guid? academicYearId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchool(schoolId, PermissionCodes.ClassesManage, ct);
        if (error != null) return error;

        var semesters = from semester in Db.Set<Semester>()
                        join year in Db.Set<AcademicYear>() on semester.AcademicYearId equals year.Id
                        where year.SchoolId == school && (academicYearId == null || year.Id == academicYearId)
                        orderby semester.StartDate, semester.Ordinal, semester.Id
                        select new SemesterOption(semester.Id, semester.AcademicYearId, semester.Name, semester.Ordinal,
                            semester.StartDate, semester.EndDate, semester.Status);
        return Ok(await semesters.ToListAsync(ct));
    }

    [HttpGet("grade-levels")]
    public async Task<IActionResult> GradeLevels(Guid? schoolId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchool(schoolId, PermissionCodes.ClassesManage, ct);
        if (error != null) return error;
        return Ok(await Db.Set<GradeLevel>().Where(row => row.SchoolId == school)
            .OrderBy(row => row.GradeNumber)
            .Select(row => new GradeLevelOption(row.Id, row.GradeNumber)).ToListAsync(ct));
    }

    private IQueryable<SchoolClass> SchoolClasses(Guid school) =>
        Db.Set<SchoolClass>().Where(row => row.SchoolId == school
            && Db.Set<AcademicYear>().Any(year => year.Id == row.AcademicYearId && year.SchoolId == school)
            && Db.Set<GradeLevel>().Any(grade => grade.Id == row.GradeLevelId && grade.SchoolId == school));

    private IQueryable<ClassRow> ClassRows(IQueryable<SchoolClass> classes) =>
        from row in classes
        join year in Db.Set<AcademicYear>() on row.AcademicYearId equals year.Id
        join grade in Db.Set<GradeLevel>() on row.GradeLevelId equals grade.Id
        orderby row.Code, row.Id
        select new ClassRow(row.Id, row.Code, row.Name, year.Id, year.Name,
            grade.Id, grade.GradeNumber, row.Capacity, row.Status, row.Revision);

    [HttpGet("classes/context")]
    public async Task<IActionResult> ClassContext(CancellationToken ct)
    {
        var schools = await GetSchools(PermissionCodes.ClassesManage, ct);
        return schools.Count == 0 ? Forbid() : Ok(schools);
    }

    [HttpGet("classes")]
    public async Task<IActionResult> Classes(Guid? schoolId, Guid? academicYearId, string? search, int page = 1,
        int pageSize = 25, CancellationToken ct = default)
    {
        var (school, error) = await ResolveSchool(schoolId, PermissionCodes.ClassesManage, ct);
        if (error != null) return error;
        if (page is < 1 or > 100000 || pageSize is < 1 or > 100)
            return Problem(statusCode: 400, title: "Thông số phân trang không hợp lệ.");
        var query = SchoolClasses(school);
        if (academicYearId.HasValue)
            query = query.Where(row => row.AcademicYearId == academicYearId);
        var term = search?.Trim();
        if (!string.IsNullOrEmpty(term))
        {
            if (term.Length > 200)
                return Problem(statusCode: 400, title: "Từ khóa không được vượt quá 200 ký tự.");
            var pattern = SearchPattern(term);
            query = query.Where(row => EF.Functions.ILike(EF.Functions.Collate(row.Code, "und-x-icu"), pattern, "\\")
                || EF.Functions.ILike(EF.Functions.Collate(row.Name, "und-x-icu"), pattern, "\\"));
        }
        var total = await query.CountAsync(ct);
        var items = await ClassRows(query.OrderBy(row => row.Code).ThenBy(row => row.Id)
            .Skip((page - 1) * pageSize).Take(pageSize)).ToListAsync(ct);
        return Ok(new ClassPage(items, total, page, pageSize));
    }

    [HttpGet("classes/{id:guid}")]
    public async Task<IActionResult> GetClass(Guid id, Guid? schoolId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchool(schoolId, PermissionCodes.ClassesManage, ct);
        if (error != null) return error;
        var row = await ClassRows(SchoolClasses(school).Where(row => row.Id == id)).SingleOrDefaultAsync(ct);
        return row == null ? NotFound() : Ok(row);
    }

    [HttpPost("classes")]
    public Task<IActionResult> Create(ClassInput input, Guid? schoolId, CancellationToken ct) =>
        Save(null, input, schoolId, ct);

    [HttpPut("classes/{id:guid}")]
    public Task<IActionResult> Update(Guid id, ClassInput input, Guid? schoolId, CancellationToken ct) =>
        InTransaction(() => Save(id, input, schoolId, ct), ct);

    [HttpPost("classes/{id:guid}/archive")]
    public Task<IActionResult> Archive(Guid id, RevisionInput input, Guid? schoolId, CancellationToken ct) =>
        InTransaction(async () =>
        {
            var (school, error) = await ResolveSchool(schoolId, PermissionCodes.ClassesManage, ct);
            if (error != null) return error;
            if (await LockClasses(school, [id], ct) == 0) return NotFound();
            var row = await SchoolClasses(school).SingleOrDefaultAsync(item => item.Id == id, ct);
            if (row == null) return NotFound();
            if (row.Revision != input.Revision)
                return Problem(statusCode: 409, title: "Lớp đã thay đổi. Hãy tải lại dữ liệu.");
            if (row.HomeroomStaffId != null || await ActiveEnrollments(id).AnyAsync(ct)
                || await Db.Set<TeachingAssignment>().AnyAsync(item => item.ClassId == id && item.Status != "inactive", ct))
                return Problem(statusCode: 409, title: "Lớp còn ghi danh hoặc phân công đang mở.");
            row.Status = "archived";
            await Db.SaveChangesAsync(ct);
            return Ok(await ClassRows(SchoolClasses(school).Where(item => item.Id == id)).SingleAsync(ct));
        }, ct);

    private async Task<IActionResult> Save(Guid? id, ClassInput input, Guid? schoolId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchool(schoolId, PermissionCodes.ClassesManage, ct);
        if (error != null) return error;

        if (id is Guid classId && await LockClasses(school, [classId], ct) == 0)
            return NotFound();

        var row = id.HasValue
            ? await Db.Set<SchoolClass>().SingleOrDefaultAsync(item => item.Id == id && item.SchoolId == school, ct)
            : new SchoolClass { Id = Guid.NewGuid(), SchoolId = school, Status = "active" };
        if (row == null) return NotFound();
        if (id.HasValue && row.Revision != input.Revision)
            return Problem(statusCode: 409, title: "Lớp đã thay đổi. Hãy tải lại dữ liệu.");

        if (string.IsNullOrWhiteSpace(input.Code))
            ModelState.AddModelError("code", "Nhập mã lớp.");
        if (string.IsNullOrWhiteSpace(input.Name))
            ModelState.AddModelError("name", "Nhập tên lớp.");
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        var year = await Db.Set<AcademicYear>().SingleOrDefaultAsync(
            item => item.Id == input.AcademicYearId && item.SchoolId == school, ct);
        var grade = await Db.Set<GradeLevel>().SingleOrDefaultAsync(
            item => item.Id == input.GradeLevelId && item.SchoolId == school, ct);
        if (year == null) ModelState.AddModelError("academicYearId", "Chọn năm học của trường.");
        if (grade == null) ModelState.AddModelError("gradeLevelId", "Chọn khối của trường.");
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        if (id.HasValue)
        {
            if (row.Status != "active")
                return Problem(statusCode: 409, title: "Lớp đã lưu trữ.");
            if ((row.AcademicYearId != input.AcademicYearId || row.GradeLevelId != input.GradeLevelId)
                && (await Db.Set<ClassEnrollment>().AnyAsync(item => item.ClassId == row.Id, ct)
                    || await Db.Set<ClassSubject>().AnyAsync(item => item.ClassId == row.Id, ct)
                    || await Db.Set<TeachingAssignment>().AnyAsync(item => item.ClassId == row.Id, ct)
                    || await Db.Set<HomeroomAssignment>().AnyAsync(item => item.ClassId == row.Id, ct)))
                return Problem(statusCode: 409, title: "Không thể đổi năm học hoặc khối của lớp đã có ghi danh hoặc phân công.");
            if (input.Capacity is int capacity && await ActiveEnrollments(row.Id).CountAsync(ct) > capacity)
                return Problem(statusCode: 409, title: "Sức chứa thấp hơn sĩ số hiện tại.");
        }

        var code = input.Code.Trim().ToUpperInvariant();
        if (await Db.Set<SchoolClass>().AnyAsync(item => item.SchoolId == school
            && item.AcademicYearId == year!.Id && item.Id != row.Id && item.Code.ToUpper() == code, ct))
            return Problem(statusCode: 409, title: "Mã lớp đã tồn tại trong năm học.");

        row.Code = code;
        row.Name = input.Name.Trim();
        row.AcademicYearId = year!.Id;
        row.GradeLevelId = grade!.Id;
        row.Capacity = input.Capacity;
        if (!id.HasValue) Db.Add(row);

        try
        {
            await Db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            return Problem(statusCode: 409, title: "Lớp đã thay đổi. Hãy tải lại dữ liệu.");
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException
            { SqlState: PostgresErrorCodes.UniqueViolation or PostgresErrorCodes.ForeignKeyViolation })
        {
            return Problem(statusCode: 409, title: "Mã lớp hoặc danh mục đã thay đổi. Hãy tải lại dữ liệu.");
        }

        var result = new ClassRow(row.Id, row.Code, row.Name, year.Id, year.Name, grade.Id,
            grade.GradeNumber, row.Capacity, row.Status, row.Revision);
        return id.HasValue ? Ok(result) : CreatedAtAction(nameof(GetClass), new { id = row.Id, schoolId = school }, result);
    }
}
