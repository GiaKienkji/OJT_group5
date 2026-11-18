using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SOMS.Application.Modules.Academic;
using SOMS.Infrastructure.Data;

namespace SOMS.Api.Controllers;

public sealed partial class AcademicEventsController
{
    [HttpGet("substitutions/sessions")]
    public async Task<IActionResult> Sessions(DateOnly onDate, Guid? schoolId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchool(schoolId, Scheduling, ct);
        if (error != null) return error;
        if (onDate == default) return Problem(statusCode: 400, title: "Chọn ngày cần dạy thay.");
        return Ok(await schedule.Lessons(school, onDate, onDate, ct));
    }

    [HttpGet("substitutions")]
    public async Task<IActionResult> Substitutions(DateOnly onDate, Guid? schoolId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchool(schoolId, Scheduling, ct);
        if (error != null) return error;
        if (onDate == default) return Problem(statusCode: 400, title: "Chọn ngày cần dạy thay.");
        return Ok(await SubstitutionRows(school, onDate, null).ToListAsync(ct));
    }

    [HttpGet("sessions/{id:guid}/substitute-candidates")]
    public async Task<IActionResult> Candidates(Guid id, DateOnly onDate, Guid? schoolId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchool(schoolId, Scheduling, ct);
        if (error != null) return error;
        if (onDate == default) return Problem(statusCode: 400, title: "Chọn ngày cần dạy thay.");
        var events = await schedule.Between(school, onDate, onDate, ct);
        var lesson = events.SingleOrDefault(item => item.Kind == "lesson" && item.Id == id);
        if (lesson == null) return NotFound();
        if (await LessonLocked(lesson, ct))
            return Problem(statusCode: 409, title: "Ca đã bắt đầu hoặc đã chốt điểm danh.");
        var teachers = await TeachersOn(school, onDate, ct);
        return Ok(teachers.Where(teacher => teacher.Id != lesson.OriginalStaffId && IsFree(teacher.Id, lesson, events)).ToList());
    }

    [HttpPost("substitutions")]
    public async Task<IActionResult> AssignSubstitute(SubstitutionInput input, Guid? schoolId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchool(schoolId, Scheduling, ct);
        if (error != null) return error;
        if (input.OnDate == default) return Problem(statusCode: 400, title: "Chọn ngày cần dạy thay.");
        return await InTransaction(async () =>
        {
            await LockSchoolSchedule(school, ct);
            var events = await schedule.Between(school, input.OnDate, input.OnDate, ct);
            var lesson = events.SingleOrDefault(item => item.Kind == "lesson" && item.Id == input.SlotId);
            if (lesson == null) return NotFound();
            if (await LessonLocked(lesson, ct))
                return Problem(statusCode: 409, title: "Ca đã bắt đầu hoặc đã chốt điểm danh.");
            var teachers = await TeachersOn(school, input.OnDate, ct);
            if (input.StaffId == lesson.OriginalStaffId || teachers.All(item => item.Id != input.StaffId))
                return Problem(statusCode: 400, title: "Chọn một giáo viên khác đang làm việc và không nghỉ phép.");
            if (!IsFree(input.StaffId, lesson, events))
                return Problem(statusCode: 409, title: "Giáo viên thay có lịch trùng giờ.");

            var id = Guid.NewGuid();
            var changes = await Db.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO public.substitutions (id, original_slot_id, on_date, substitute_staff_id, confirmed_by, status)
                VALUES ({id}, {input.SlotId}, {input.OnDate}, {input.StaffId}, {ActorId!.Value}, 'confirmed')
                ON CONFLICT (original_slot_id, on_date) DO UPDATE
                    SET substitute_staff_id = EXCLUDED.substitute_staff_id, confirmed_by = EXCLUDED.confirmed_by, status = 'confirmed'
                    WHERE substitutions.status IN ('cancelled', 'proposed')
                """, ct);
            if (changes == 0) return Problem(statusCode: 409, title: "Ca đã có giáo viên dạy thay. Hủy phân công cũ trước khi đổi.");
            var saved = (await SubstitutionRows(school, input.OnDate, null).ToListAsync(ct)).Single(item => item.SlotId == lesson.Id);
            await Audit(school, "substitutions", saved.Id, "UPDATE", new { saved.Status, saved.StaffId, saved.SlotId, saved.OnDate }, ct);
            return Ok(saved);
        }, ct);
    }

    [HttpPost("substitutions/{id:guid}/cancel")]
    public async Task<IActionResult> CancelSubstitute(Guid id, Guid? schoolId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchool(schoolId, Scheduling, ct);
        if (error != null) return error;
        return await InTransaction(async () =>
        {
            await LockSchoolSchedule(school, ct);
            var substitution = (await SubstitutionRows(school, null, id).ToListAsync(ct)).SingleOrDefault();
            if (substitution == null) return NotFound();
            var events = await schedule.Between(school, substitution.OnDate, substitution.OnDate, ct);
            var lesson = events.SingleOrDefault(item => item.Kind == "lesson" && item.Id == substitution.SlotId);
            if (substitution.Status != "confirmed" || lesson == null || await LessonLocked(lesson, ct))
                return Problem(statusCode: 409, title: "Ca dạy thay đã kết thúc, bị khóa hoặc không còn hiệu lực.");
            var teachers = await TeachersOn(school, substitution.OnDate, ct);
            if (lesson.OriginalStaffId is not Guid original || teachers.All(item => item.Id != original) || !IsFree(original, lesson, events))
                return Problem(statusCode: 409, title: "Chưa thể trả ca cho giáo viên gốc vì đang nghỉ, không đủ điều kiện hoặc trùng lịch.");
            await Db.Database.ExecuteSqlInterpolatedAsync($"""
                UPDATE public.substitutions SET status = 'cancelled' WHERE id = {id}
                """, ct);
            await Audit(school, "substitutions", id, "UPDATE", new { status = "cancelled", original }, ct);
            return Ok(substitution with { Status = "cancelled" });
        }, ct);
    }

    private async Task<bool> LessonLocked(ScheduleOccurrence lesson, CancellationToken ct)
    {
        if (lesson.StartsAt <= UtcNow) return true;
        return (await Db.Database.SqlQuery<bool>($"""
            SELECT EXISTS (
                SELECT 1 FROM public.attendance_sessions a
                JOIN public.timetable_slots sl ON sl.id = {lesson.Id}
                WHERE a.session_date = {lesson.OnDate} AND a.status = 'finalized'
                  AND (a.slot_id = sl.id OR (a.slot_id IS NULL AND a.teaching_assignment_id = sl.teaching_assignment_id))
            )
            """).ToListAsync(ct)).Single();
    }

    private Task<List<TeacherOption>> TeachersOn(Guid school, DateOnly date, CancellationToken ct) =>
        Db.Database.SqlQuery<TeacherOption>($"""
            SELECT st.id AS "Id", st.employee_code AS "Code", st.full_name AS "FullName"
            FROM public.staff st
            WHERE st.school_id = {school} AND st.kind = 'teacher' AND st.employment_status = 'active'
              AND (st.started_on IS NULL OR st.started_on <= {date}) AND (st.ended_on IS NULL OR st.ended_on >= {date})
              AND NOT EXISTS (
                SELECT 1 FROM public.workflow_requests w WHERE w.school_id = {school}
                  AND w.staff_id = st.id AND w.request_type = 'teacher_leave' AND w.status IN ('approved', 'completed')
                  AND w.starts_on <= {date} AND (w.ends_on IS NULL OR w.ends_on >= {date})
              )
            ORDER BY st.full_name, st.id
            """).ToListAsync(ct);

    private static bool IsFree(Guid teacher, ScheduleOccurrence lesson, IEnumerable<ScheduleOccurrence> events) =>
        !events.Any(item => item.Id != lesson.Id && item.StaffId == teacher
            && AcademicScheduleStore.Overlaps(lesson.StartsAt, lesson.EndsAt, item));

    private IQueryable<SubstitutionRow> SubstitutionRows(Guid school, DateOnly? date, Guid? id) =>
        Db.Database.SqlQuery<SubstitutionRow>($"""
            SELECT s.id AS "Id", sl.id AS "SlotId", s.on_date AS "OnDate", t.id AS "StaffId",
                t.full_name AS "TeacherName", c.code AS "ClassCode", sb.name AS "SubjectName", s.status AS "Status"
            FROM public.substitutions s
            JOIN public.timetable_slots sl ON sl.id = s.original_slot_id
            JOIN public.timetable_versions v ON v.id = sl.version_id
            JOIN public.teaching_assignments a ON a.id = sl.teaching_assignment_id AND a.semester_id = v.semester_id
            JOIN public.classes c ON c.id = a.class_id AND c.school_id = {school}
            JOIN public.semesters se ON se.id = v.semester_id AND se.academic_year_id = c.academic_year_id
            JOIN public.academic_years y ON y.id = se.academic_year_id AND y.school_id = {school}
            JOIN public.subjects sb ON sb.id = a.subject_id AND sb.school_id = {school}
            JOIN public.staff t ON t.id = s.substitute_staff_id AND t.school_id = {school}
            WHERE (s.on_date = CAST({date} AS date) OR CAST({date} AS date) IS NULL)
              AND (s.id = CAST({id} AS uuid) OR CAST({id} AS uuid) IS NULL)
            ORDER BY s.on_date, c.code, s.id
            """);
}
