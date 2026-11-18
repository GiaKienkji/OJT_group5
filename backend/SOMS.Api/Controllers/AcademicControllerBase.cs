using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.EntityFrameworkCore;
using SOMS.Application.Modules.Academic;
using SOMS.Domain.Entities;
using SOMS.Infrastructure.Data;

namespace SOMS.Api.Controllers;

[ApiController]
[Authorize]
public abstract class AcademicControllerBase(SomsDbContext db, TimeProvider clock) : ControllerBase
{
    protected SomsDbContext Db { get; } = db;
    protected DateTimeOffset UtcNow => clock.GetUtcNow();

    protected Guid? ActorId => Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
        ? id : null;

    protected async Task<DateOnly> SchoolToday(Guid schoolId, CancellationToken ct)
    {
        var timezone = await Db.Schools.Where(school => school.Id == schoolId)
            .Select(school => school.Timezone).SingleAsync(ct);
        return LocalDate(clock.GetUtcNow(), timezone);
    }

    private static DateOnly LocalDate(DateTimeOffset utc, string timezone) =>
        DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeBySystemTimeZoneId(utc, timezone).DateTime);

    protected static string SearchPattern(string term) =>
        "%" + term.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_") + "%";

    protected Task<List<AcademicSchool>> GetSchools(string permission, CancellationToken ct) =>
        GetSchools([permission], ct);

    protected async Task<List<AcademicSchool>> GetSchools(string[] permissions, CancellationToken ct)
    {
        if (ActorId is not Guid userId)
            return [];

        var memberships = await (
            from membership in Db.SchoolMemberships
            join grant in Db.RolePermissions on membership.RoleCode equals grant.RoleCode
            where membership.UserId == userId && membership.Status == "active"
                && membership.School.Status == "active"
                && permissions.Contains(grant.PermissionCode)
            orderby membership.School.Name, membership.SchoolId
            select new
            {
                membership.SchoolId, membership.School.Name, membership.School.Timezone,
                membership.ValidFrom, membership.ValidTo
            }).ToListAsync(ct);
        var now = clock.GetUtcNow();
        return memberships.Where(membership =>
        {
            var today = LocalDate(now, membership.Timezone);
            return (membership.ValidFrom == null || membership.ValidFrom <= today)
                && (membership.ValidTo == null || membership.ValidTo >= today);
        }).Select(membership => new AcademicSchool(membership.SchoolId, membership.Name)).Distinct().ToList();
    }

    protected Task<(Guid School, IActionResult? Error)> ResolveSchool(Guid? requested, string permission, CancellationToken ct) =>
        ResolveSchoolForAny(requested, [permission], ct);

    protected async Task<(Guid School, IActionResult? Error)> ResolveSchoolForAny(Guid? requested, string[] permissions, CancellationToken ct)
    {
        var schools = await GetSchools(permissions, ct);
        if (schools.Count == 0 || requested.HasValue && schools.All(school => school.Id != requested))
            return (Guid.Empty, Forbid());
        if (requested == null && schools.Count > 1)
            return (Guid.Empty, Problem(statusCode: 400, title: "Hãy chọn trường."));
        return (requested ?? schools[0].Id, null);
    }

    protected IQueryable<ClassEnrollment> ActiveEnrollments(Guid classId) =>
        Db.Set<ClassEnrollment>().Where(row => row.ClassId == classId && row.Status == "active");

    protected async Task LockSchoolSchedule(Guid schoolId, CancellationToken ct)
    {
        await Db.Database.SqlQuery<Guid>($"""
            SELECT id FROM public.schools WHERE id = {schoolId} FOR NO KEY UPDATE
            """).ToListAsync(ct);
    }

    protected async Task<int> LockClasses(Guid schoolId, Guid[] classIds, CancellationToken ct)
    {
        var ids = await Db.Database.SqlQuery<Guid>($"""
            SELECT id FROM public.classes
            WHERE school_id = {schoolId} AND id = ANY({classIds})
            ORDER BY id FOR UPDATE
            """).ToListAsync(ct);
        return ids.Count;
    }

    protected async Task<bool> LockStudent(Guid schoolId, Guid studentId, CancellationToken ct)
    {
        var ids = await Db.Database.SqlQuery<Guid>($"""
            SELECT id FROM public.students WHERE school_id = {schoolId} AND id = {studentId} FOR UPDATE
            """).ToListAsync(ct);
        return ids.Count == 1;
    }

    protected Task<IActionResult> InTransaction(Func<Task<IActionResult>> operation, CancellationToken ct) =>
        Db.Database.CreateExecutionStrategy().ExecuteAsync(async cancellationToken =>
        {
            Db.ChangeTracker.Clear();
            await using var transaction = await Db.Database.BeginTransactionAsync(cancellationToken);
            var result = await operation();
            if (result is not IStatusCodeActionResult { StatusCode: >= 400 })
                await transaction.CommitAsync(cancellationToken);
            return result;
        }, ct);
}
