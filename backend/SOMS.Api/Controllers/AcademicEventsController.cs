using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SOMS.Application.Common.Security;
using SOMS.Application.Modules.Academic;
using SOMS.Infrastructure.Data;

namespace SOMS.Api.Controllers;

[Route("api/academic")]
public sealed partial class AcademicEventsController(SomsDbContext db, TimeProvider clock, AcademicScheduleStore schedule)
    : AcademicControllerBase(db, clock)
{
    private const string Scheduling = PermissionCodes.SchedulingManage;
    private const string Exams = PermissionCodes.ExamsManage;

    [HttpGet("events/context")]
    public async Task<IActionResult> Context(CancellationToken ct)
    {
        var schools = await GetSchools([Scheduling, Exams], ct);
        if (schools.Count == 0) return Forbid();
        var options = new List<ScheduleSchool>();
        foreach (var school in schools)
            options.Add(new(school.Id, school.Name, await SchoolToday(school.Id, ct)));
        return Ok(options);
    }

    private Task<string> Timezone(Guid school, CancellationToken ct) =>
        Db.Schools.Where(row => row.Id == school).Select(row => row.Timezone).SingleAsync(ct);

    private Task Audit(Guid school, string table, Guid rowId, string operation, object data, CancellationToken ct)
    {
        var json = JsonSerializer.Serialize(data);
        return Db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO public.audit_logs (school_id, actor_id, table_name, row_id, operation, after_data)
            VALUES ({school}, {ActorId!.Value}, {table}, {rowId.ToString()}, {operation}, CAST({json} AS jsonb))
            """, ct);
    }

    private ObjectResult ConflictWith(ScheduleOccurrence conflict) =>
        Problem(statusCode: 409, title: "Trùng lịch đã công bố.",
            detail: $"{conflict.ClassCode} · {conflict.SubjectName} · {conflict.StartsAt:u}");
}
