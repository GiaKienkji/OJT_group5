using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using SOMS.Application.Common.Security;
using SOMS.Application.Modules.Academic;
using SOMS.Domain.Entities;
using SOMS.Infrastructure.Data;

namespace SOMS.Api.Controllers;

[Route("api/academic/subjects")]
public sealed class AcademicSubjectsController(SomsDbContext db, TimeProvider clock) : AcademicControllerBase(db, clock)
{
    private const string Permission = PermissionCodes.SubjectsManage;

    [HttpGet("context")]
    public async Task<IActionResult> Context(CancellationToken ct)
    {
        var schools = await GetSchools(Permission, ct);
        return schools.Count == 0 ? Forbid() : Ok(schools);
    }

    [HttpGet]
    public async Task<IActionResult> List(Guid? schoolId, string? search, bool? isActive,
        int page = 1, int pageSize = 25, CancellationToken ct = default)
    {
        var (school, error) = await ResolveSchool(schoolId, Permission, ct);
        if (error != null) return error;
        if (page is < 1 or > 100000 || pageSize is < 1 or > 100 || search?.Length > 200)
            return Problem(statusCode: 400, title: "Bộ lọc hoặc thông số phân trang không hợp lệ.");

        var subjects = Db.Set<Subject>().Where(row => row.SchoolId == school);
        if (isActive.HasValue)
            subjects = subjects.Where(row => row.IsActive == isActive);
        var term = search?.Trim();
        if (!string.IsNullOrEmpty(term))
        {
            var pattern = SearchPattern(term);
            subjects = subjects.Where(row => EF.Functions.ILike(EF.Functions.Collate(row.Code, "und-x-icu"), pattern, "\\")
                || EF.Functions.ILike(EF.Functions.Collate(row.Name, "und-x-icu"), pattern, "\\"));
        }

        var total = await subjects.CountAsync(ct);
        var items = await subjects.OrderBy(row => row.Code).ThenBy(row => row.Id)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(row => new SubjectRow(row.Id, row.Code, row.Name, row.IsActive, row.Revision)).ToListAsync(ct);
        return Ok(new SubjectPage(items, total, page, pageSize));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetSubject(Guid id, Guid? schoolId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchool(schoolId, Permission, ct);
        if (error != null) return error;
        var subject = await Db.Set<Subject>().AsNoTracking().SingleOrDefaultAsync(row => row.Id == id && row.SchoolId == school, ct);
        return subject == null ? NotFound() : Ok(ToRow(subject));
    }

    [HttpPost]
    public Task<IActionResult> Create(SubjectInput input, Guid? schoolId, CancellationToken ct) =>
        Save(null, input, schoolId, ct);

    [HttpPut("{id:guid}")]
    public Task<IActionResult> Update(Guid id, SubjectInput input, Guid? schoolId, CancellationToken ct) =>
        Save(id, input, schoolId, ct);

    private async Task<IActionResult> Save(Guid? id, SubjectInput input, Guid? schoolId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchool(schoolId, Permission, ct);
        if (error != null) return error;
        var subject = id.HasValue
            ? await Db.Set<Subject>().SingleOrDefaultAsync(row => row.Id == id && row.SchoolId == school, ct)
            : new Subject { Id = Guid.NewGuid(), SchoolId = school };
        if (subject == null) return NotFound();
        if (id.HasValue && subject.Revision != input.Revision)
            return Problem(statusCode: 409, title: "Môn học đã thay đổi. Hãy tải lại dữ liệu.");

        if (string.IsNullOrWhiteSpace(input.Code))
            ModelState.AddModelError("code", "Nhập mã môn học.");
        if (string.IsNullOrWhiteSpace(input.Name))
            ModelState.AddModelError("name", "Nhập tên môn học.");
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        var code = input.Code.Trim().ToUpperInvariant();
        if (await Db.Set<Subject>().AnyAsync(row => row.SchoolId == school && row.Id != subject.Id
            && row.Code.ToUpper() == code, ct))
            return Problem(statusCode: 409, title: "Mã môn học đã tồn tại trong trường.");

        subject.Code = code;
        subject.Name = input.Name.Trim();
        subject.IsActive = input.IsActive;
        if (!id.HasValue) Db.Add(subject);

        try
        {
            await Db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            return Problem(statusCode: 409, title: "Môn học đã thay đổi. Hãy tải lại dữ liệu.");
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException
            { SqlState: PostgresErrorCodes.UniqueViolation, ConstraintName: "subjects_school_id_code_key" })
        {
            return Problem(statusCode: 409, title: "Mã môn học đã tồn tại trong trường.");
        }

        return id.HasValue ? Ok(ToRow(subject))
            : CreatedAtAction(nameof(GetSubject), new { id = subject.Id, schoolId = school }, ToRow(subject));
    }

    private static SubjectRow ToRow(Subject subject) => new(subject.Id, subject.Code, subject.Name, subject.IsActive, subject.Revision);
}
