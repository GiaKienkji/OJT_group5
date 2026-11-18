using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SOMS.Application.Common.Security;
using SOMS.Application.Modules.Academic;
using SOMS.Domain.Entities;
using SOMS.Infrastructure.Data;

namespace SOMS.Api.Controllers;

public sealed partial class AcademicTimetablesController
{
    [HttpPost("timetables/{id:guid}/submit")]
    public Task<IActionResult> Submit(Guid id, RevisionInput input, Guid? schoolId, CancellationToken ct) =>
        ChangeVersion(id, input.Revision, "submit", null, schoolId, ct);

    [HttpPost("timetables/{id:guid}/approve")]
    public Task<IActionResult> Approve(Guid id, RevisionInput input, Guid? schoolId, CancellationToken ct) =>
        ChangeVersion(id, input.Revision, "approve", null, schoolId, ct);

    [HttpPost("timetables/{id:guid}/reject")]
    public Task<IActionResult> Reject(Guid id, RevisionInput input, Guid? schoolId, CancellationToken ct) =>
        ChangeVersion(id, input.Revision, "reject", null, schoolId, ct);

    [HttpPost("timetables/{id:guid}/publish")]
    public Task<IActionResult> Publish(Guid id, TimetablePublishInput input, Guid? schoolId, CancellationToken ct) =>
        ChangeVersion(id, input.Revision, "publish", input.EffectiveFrom, schoolId, ct);

    private async Task<IActionResult> ChangeVersion(Guid id, uint? revision, string action, DateOnly? effectiveFrom,
        Guid? schoolId, CancellationToken ct)
    {
        var permission = action switch
        {
            "submit" => Draft,
            "publish" => PermissionCodes.TimetablesPublish,
            _ => PermissionCodes.TimetablesApprove
        };
        var (school, error) = await ResolveSchool(schoolId, permission, ct);
        if (error != null) return error;
        return await InTransaction(async () =>
        {
            await LockSchoolSchedule(school, ct);
            var version = await FindVersion(school, id, ct);
            if (version == null) return NotFound();
            var requiredStatus = action == "submit" ? "draft" : "pending_approval";
            if (version.Status != requiredStatus || version.Revision != revision)
                return Problem(statusCode: 409, title: "Phiên bản hoặc trạng thái đã thay đổi. Hãy tải lại.");
            var semester = await Db.Set<Semester>().SingleAsync(row => row.Id == version.SemesterId, ct);
            if (semester.Status == "closed")
                return Problem(statusCode: 409, title: "Học kỳ đã đóng.");

            var actor = ActorId!.Value;
            if (action is "approve" or "reject" && (version.CreatedBy == actor || version.SubmittedBy == actor))
                return Forbid();
            if (action == "publish" && version.ApprovedRevision != version.ContentRevision)
                return Problem(statusCode: 409, title: "Nội dung phiên bản này chưa được duyệt.");
            if (action is "submit" or "approve" or "publish")
            {
                var result = await ValidateVersion(school, version, ct);
                if (!result.Valid)
                    return Conflict(new ProblemDetails
                    {
                        Status = 409, Title = "Thời khóa biểu chưa hợp lệ.",
                        Detail = string.Join(" ", result.Errors ?? []),
                        Extensions = { ["conflicts"] = result.Conflicts }
                    });
            }

            switch (action)
            {
                case "submit":
                    await Db.Database.ExecuteSqlInterpolatedAsync($"""
                        UPDATE public.timetable_versions SET status = 'pending_approval', submitted_by = {actor},
                            approved_revision = NULL, approved_by = NULL, approved_at = NULL WHERE id = {id}
                        """, ct);
                    break;
                case "approve":
                    if (version.ApprovedRevision.HasValue)
                        return Problem(statusCode: 409, title: "Phiên bản đã có quyết định duyệt.");
                    await Db.Database.ExecuteSqlInterpolatedAsync($"""
                        UPDATE public.timetable_versions SET approved_revision = content_revision,
                            approved_by = {actor}, approved_at = {UtcNow} WHERE id = {id}
                        """, ct);
                    break;
                case "reject":
                    await Db.Database.ExecuteSqlInterpolatedAsync($"""
                        UPDATE public.timetable_versions SET status = 'draft', submitted_by = NULL,
                            approved_revision = NULL, approved_by = NULL, approved_at = NULL WHERE id = {id}
                        """, ct);
                    break;
                case "publish":
                    var previous = (await Versions(school, semester.Id, null).ToListAsync(ct))
                        .SingleOrDefault(item => item.Status == "published");
                    var today = await SchoolToday(school, ct);
                    var suggested = previous?.EffectiveFrom is DateOnly previousFrom && previousFrom <= today
                        ? today.AddDays(1) : today;
                    if (previous?.EffectiveFrom > suggested) suggested = previous.EffectiveFrom.Value;
                    if (suggested < semester.StartDate) suggested = semester.StartDate;
                    var starts = effectiveFrom ?? suggested;
                    if (starts < today || starts < semester.StartDate || starts > semester.EndDate || starts < previous?.EffectiveFrom)
                        return Problem(statusCode: 400, title: "Ngày hiệu lực phải từ hôm nay, trong học kỳ và sau mốc bản hiện tại.");

                    var scheduleConflict = await CheckPublishedEvents(school, version.Id, previous?.Id, starts, semester.EndDate, ct);
                    if (scheduleConflict != null) return scheduleConflict;
                    if (previous != null)
                    {
                        await Db.Database.ExecuteSqlInterpolatedAsync($"""
                            UPDATE public.timetable_versions SET status = 'archived', effective_until = {starts}
                            WHERE id = {previous.Id}
                            """, ct);
                    }
                    await Db.Database.ExecuteSqlInterpolatedAsync($"""
                        UPDATE public.timetable_versions SET status = 'published', published_at = {UtcNow},
                            effective_from = {starts}, effective_until = NULL WHERE id = {id}
                        """, ct);
                    break;
            }

            var changed = (await FindVersion(school, id, ct))!;
            var before = JsonSerializer.Serialize(new { version.Status, version.ContentRevision, version.ApprovedBy, version.EffectiveFrom });
            var after = JsonSerializer.Serialize(new { action, changed.Status, changed.ContentRevision, changed.ApprovedBy, changed.EffectiveFrom });
            await Db.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO public.audit_logs (school_id, actor_id, table_name, row_id, operation, before_data, after_data)
                VALUES ({school}, {actor}, 'timetable_versions', {id.ToString()}, 'UPDATE',
                        CAST({before} AS jsonb), CAST({after} AS jsonb))
                """, ct);
            return Ok(await GetDetail(school, changed, ct));
        }, ct);
    }

    private async Task<IActionResult?> CheckPublishedEvents(Guid school, Guid id, Guid? previous, DateOnly from,
        DateOnly to, CancellationToken ct)
    {
        if (previous is Guid previousId && (await Db.Database.SqlQuery<bool>($"""
            SELECT EXISTS (
                SELECT 1 FROM public.substitutions s JOIN public.timetable_slots sl ON sl.id = s.original_slot_id
                WHERE sl.version_id = {previousId} AND s.on_date >= {from} AND s.status IN ('confirmed', 'completed')
            )
            """).ToListAsync(ct)).Single())
            return Problem(statusCode: 409, title: "Khoảng hiệu lực mới đã có ca dạy thay. Hãy xử lý ca dạy thay trước.");

        var exams = await Schedule.Exams(school, from, to, ct);
        if (exams.Count == 0) return null;
        var slots = await Slots(school, id).ToListAsync(ct);
        foreach (var exam in exams)
        {
            var timezone = TimeZoneInfo.FindSystemTimeZoneById(exam.Timezone);
            var date = exam.OnDate;
            var weekday = date.DayOfWeek == DayOfWeek.Sunday ? 7 : (int)date.DayOfWeek;
            foreach (var slot in slots.Where(item => item.Weekday == weekday && (item.ClassId == exam.ClassId || item.RoomId == exam.RoomId)))
            {
                var begins = TimeZoneInfo.ConvertTimeToUtc(date.ToDateTime(slot.StartsAt), timezone);
                var ends = TimeZoneInfo.ConvertTimeToUtc(date.ToDateTime(slot.EndsAt), timezone);
                if (AcademicScheduleStore.Overlaps(begins, ends, exam))
                    return Problem(statusCode: 409, title: "Lịch mới trùng ca kiểm tra đã công bố.",
                        detail: $"{exam.ClassCode} · {exam.SubjectName} · {exam.OnDate:dd/MM/yyyy}");
            }
        }

        return null;
    }

    private async Task<TimetableCheck> ValidateVersion(Guid school, TimetableRow version, CancellationToken ct)
    {
        var items = await Slots(school, version.Id).ToListAsync(ct);
        var options = await LoadOptions(school, version.SemesterId, ct);
        var actual = (await Db.Database.SqlQuery<long>($"""
            SELECT count(*) FROM public.timetable_slots WHERE version_id = {version.Id}
            """).ToListAsync(ct)).Single();

        var errors = new List<string>();
        if (items.Count != actual)
            errors.Add("Lịch chứa ô có tham chiếu ngoài phạm vi hoặc sai học kỳ.");
        if (items.Count == 0)
            errors.Add("Thời khóa biểu cần có ít nhất một ô lịch.");
        if (items.Any(slot => MakeSlot(options, new TimetableSlotInput(slot.TeachingAssignmentId, slot.RoomId, slot.PeriodId,
            slot.Weekday, version.Revision), slot.Id) == null))
            errors.Add("Lịch chứa phân công đã ngừng, phòng không khả dụng hoặc sức chứa thấp hơn sĩ số.");
        var counts = items.GroupBy(item => item.TeachingAssignmentId).ToDictionary(group => group.Key, group => group.Count());
        foreach (var assignment in options.Assignments)
        {
            var count = counts.GetValueOrDefault(assignment.Id);
            if (count != assignment.WeeklyPeriods)
                errors.Add($"{assignment.ClassCode} · {assignment.SubjectName} · {assignment.TeacherName} có {count}/{assignment.WeeklyPeriods} tiết.");
        }
        var conflicts = items.SelectMany(slot => FindConflicts(slot, items)).Distinct().ToList();
        return new TimetableCheck(conflicts.Count == 0 && errors.Count == 0, conflicts, errors);
    }
}
