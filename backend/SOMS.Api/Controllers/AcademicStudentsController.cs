using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using SOMS.Application.Common.Security;
using SOMS.Application.Modules.Academic;
using SOMS.Domain.Entities;
using SOMS.Infrastructure.Data;

namespace SOMS.Api.Controllers;

[Route("api/academic/students")]
public sealed class AcademicStudentsController(SomsDbContext db, TimeProvider clock) : AcademicControllerBase(db, clock)
{
    private const string Permission = PermissionCodes.StudentsManage;

    [HttpGet("context")]
    public async Task<IActionResult> Context(CancellationToken ct)
    {
        var schools = await GetSchools(Permission, ct);
        return schools.Count == 0 ? Forbid() : Ok(schools);
    }

    [HttpGet]
    public async Task<IActionResult> List(Guid? schoolId, string? search, string? status, int page = 1,
        int pageSize = 25, CancellationToken ct = default)
    {
        var (school, error) = await ResolveSchool(schoolId, Permission, ct);
        if (error != null) return error;
        if (page is < 1 or > 100000 || pageSize is < 1 or > 100 || search?.Length > 200)
            return Problem(statusCode: 400, title: "Bộ lọc hoặc thông số phân trang không hợp lệ.");

        var students = Db.Set<Student>().AsNoTracking().Where(student => student.SchoolId == school);
        if (status is not null and not ("enrolled" or "transferred" or "graduated" or "withdrawn"))
            return Problem(statusCode: 400, title: "Trạng thái học sinh không hợp lệ.");
        if (status != null)
            students = students.Where(student => student.Status == status);
        var term = search?.Trim();
        if (!string.IsNullOrEmpty(term))
        {
            var pattern = SearchPattern(term);
            students = students.Where(student => EF.Functions.ILike(EF.Functions.Collate(student.StudentCode, "und-x-icu"), pattern, "\\")
                || EF.Functions.ILike(EF.Functions.Collate(student.FullName, "und-x-icu"), pattern, "\\"));
        }

        var total = await students.CountAsync(ct);
        var rows = await students.OrderBy(student => student.StudentCode).ThenBy(student => student.Id)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(student => new StudentRow(student.Id, student.StudentCode, student.FullName,
                student.DateOfBirth, student.AdmittedOn, student.Status, student.Revision, student.UserId)).ToListAsync(ct);
        return Ok(new StudentPage(rows, total, page, pageSize));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetStudent(Guid id, Guid? schoolId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchool(schoolId, Permission, ct);
        if (error != null) return error;
        var student = await Db.Set<Student>().AsNoTracking()
            .SingleOrDefaultAsync(row => row.Id == id && row.SchoolId == school, ct);
        return student == null ? NotFound() : Ok(ToRow(student));
    }

    [HttpGet("profile-options")]
    public async Task<IActionResult> ProfileOptions(Guid? schoolId, string? search, CancellationToken ct)
    {
        var (school, error) = await ResolveSchool(schoolId, Permission, ct);
        if (error != null) return error;
        var term = search?.Trim();
        if (term is null || term.Length is < 2 or > 200)
            return Problem(statusCode: 400, title: "Nhập từ 2 đến 200 ký tự để tìm tài khoản.");

        var pattern = SearchPattern(term);
        var profiles = EligibleProfiles(school, await SchoolToday(school, ct))
            .Where(profile => EF.Functions.ILike(EF.Functions.Collate(profile.FullName, "und-x-icu"), pattern, "\\"));
        return Ok(await profiles.OrderBy(profile => profile.FullName).ThenBy(profile => profile.Id)
            .Select(profile => new StudentProfileOption(profile.Id, profile.FullName)).Take(25).ToListAsync(ct));
    }

    [HttpPut("{id:guid}/profile")]
    public async Task<IActionResult> SetProfile(Guid id, StudentProfileLink input, Guid? schoolId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchool(schoolId, Permission, ct);
        if (error != null) return error;
        var student = await Db.Set<Student>().SingleOrDefaultAsync(row => row.Id == id && row.SchoolId == school, ct);
        if (student == null) return NotFound();
        if (student.Revision != input.Revision)
            return Problem(statusCode: 409, title: "Hồ sơ đã thay đổi. Hãy tải lại dữ liệu.");

        if (input.UserId is Guid profileId && !await EligibleProfiles(school, await SchoolToday(school, ct))
            .AnyAsync(profile => profile.Id == profileId, ct))
            return Problem(statusCode: 400, title: "Chọn tài khoản học sinh còn hiệu lực của trường.");

        student.UserId = input.UserId;
        try
        {
            await Db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            return Problem(statusCode: 409, title: "Hồ sơ đã thay đổi. Hãy tải lại dữ liệu.");
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException
            { SqlState: PostgresErrorCodes.UniqueViolation, ConstraintName: "students_user_id_key" })
        {
            return Problem(statusCode: 409, title: "Tài khoản đã liên kết với hồ sơ học sinh.");
        }

        return Ok(ToRow(student));
    }

    private IQueryable<Profile> EligibleProfiles(Guid school, DateOnly today) =>
        Db.Set<Profile>().Where(profile => profile.Status == "active"
            && Db.SchoolMemberships.Any(membership => membership.UserId == profile.Id && membership.SchoolId == school
                && membership.RoleCode == "student" && membership.Status == "active"
                && (membership.ValidFrom == null || membership.ValidFrom <= today)
                && (membership.ValidTo == null || membership.ValidTo >= today)));

    [HttpPost]
    public Task<IActionResult> Create(StudentInput input, Guid? schoolId, CancellationToken ct) =>
        Save(null, input, schoolId, ct);

    [HttpPut("{id:guid}")]
    public Task<IActionResult> Update(Guid id, StudentInput input, Guid? schoolId, CancellationToken ct) =>
        Save(id, input, schoolId, ct);

    [HttpPost("{id:guid}/archive")]
    public Task<IActionResult> Archive(Guid id, RevisionInput input, Guid? schoolId, CancellationToken ct) =>
        InTransaction(async () =>
        {
            var (school, error) = await ResolveSchool(schoolId, Permission, ct);
            if (error != null) return error;
            if (!await LockStudent(school, id, ct)) return NotFound();

            var student = await Db.Set<Student>().SingleAsync(row => row.Id == id, ct);
            if (student.Revision != input.Revision)
                return Problem(statusCode: 409, title: "Hồ sơ đã thay đổi. Hãy tải lại dữ liệu.");
            if (student.Status == "withdrawn")
                return Ok(ToRow(student));
            if (student.Status != "enrolled" || await Db.Set<ClassEnrollment>()
                .AnyAsync(row => row.StudentId == id && row.Status == "active", ct))
                return Problem(statusCode: 409, title: "Hồ sơ không đang học hoặc còn ghi danh hoạt động.");

            student.Status = "withdrawn";
            await Db.SaveChangesAsync(ct);
            return Ok(ToRow(student));
        }, ct);

    private async Task<IActionResult> Save(Guid? id, StudentInput input, Guid? schoolId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchool(schoolId, Permission, ct);
        if (error != null) return error;

        var student = id.HasValue
            ? await Db.Set<Student>().SingleOrDefaultAsync(row => row.Id == id && row.SchoolId == school, ct)
            : new Student { Id = Guid.NewGuid(), SchoolId = school };
        if (student == null) return NotFound();
        if (id.HasValue && student.Revision != input.Revision)
            return Problem(statusCode: 409, title: "Hồ sơ đã thay đổi. Hãy tải lại dữ liệu.");

        var today = await SchoolToday(school, ct);
        if (string.IsNullOrWhiteSpace(input.StudentCode))
            ModelState.AddModelError("studentCode", "Nhập mã học sinh.");
        if (string.IsNullOrWhiteSpace(input.FullName))
            ModelState.AddModelError("fullName", "Nhập họ tên.");
        if (input.DateOfBirth > today)
            ModelState.AddModelError("dateOfBirth", "Ngày sinh không được nằm trong tương lai.");
        if (input.AdmittedOn < input.DateOfBirth)
            ModelState.AddModelError("admittedOn", "Ngày nhập học phải từ ngày sinh trở đi.");
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        var code = input.StudentCode.Trim().ToUpperInvariant();
        if (await Db.Set<Student>().AnyAsync(row => row.SchoolId == school && row.Id != student.Id
            && row.StudentCode.ToUpper() == code, ct))
            return Problem(statusCode: 409, title: "Mã học sinh đã tồn tại trong trường.");

        student.StudentCode = code;
        student.FullName = input.FullName.Trim();
        student.DateOfBirth = input.DateOfBirth;
        student.AdmittedOn = input.AdmittedOn;
        if (!id.HasValue) Db.Add(student);

        try
        {
            await Db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            return Problem(statusCode: 409, title: "Hồ sơ đã thay đổi. Hãy tải lại dữ liệu.");
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException
            { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            return Problem(statusCode: 409, title: "Mã học sinh đã tồn tại trong trường.");
        }

        return id.HasValue ? Ok(ToRow(student))
            : CreatedAtAction(nameof(GetStudent), new { id = student.Id, schoolId = school }, ToRow(student));
    }

    private static StudentRow ToRow(Student student) => new(student.Id, student.StudentCode, student.FullName,
        student.DateOfBirth, student.AdmittedOn, student.Status, student.Revision, student.UserId);
}
