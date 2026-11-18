using Microsoft.EntityFrameworkCore;
using SOMS.Application.Modules.Academic;

namespace SOMS.Infrastructure.Data;

public sealed class AcademicScheduleStore(SomsDbContext db)
{
    public Task<List<ScheduleOccurrence>> Lessons(Guid school, DateOnly from, DateOnly to, CancellationToken ct) =>
        db.Database.SqlQuery<ScheduleOccurrence>($"""
            SELECT 'lesson' AS "Kind", sl.id AS "Id", v.id AS "VersionId", v.content_revision AS "ContentRevision",
                days.on_date::date AS "OnDate", sc.timezone AS "Timezone", se.id AS "SemesterId", c.id AS "ClassId", c.code AS "ClassCode",
                sb.id AS "SubjectId", sb.name AS "SubjectName", COALESCE(teacher.id, st.id) AS "StaffId",
                COALESCE(teacher.full_name, st.full_name) AS "TeacherName", st.id AS "OriginalStaffId",
                r.id AS "RoomId", r.code AS "RoomCode",
                (days.on_date::date + p.starts_at) AT TIME ZONE sc.timezone AS "StartsAt",
                (days.on_date::date + p.ends_at) AT TIME ZONE sc.timezone AS "EndsAt",
                sb.code AS "SubjectCode", p.period_no AS "PeriodNo", p.shift AS "Shift", se.name AS "SemesterName", y.name AS "AcademicYearName"
            FROM generate_series(CAST({from} AS date)::timestamp, CAST({to} AS date)::timestamp, interval '1 day') AS days(on_date)
            JOIN public.timetable_versions v ON v.status IN ('published', 'archived')
                AND days.on_date::date >= v.effective_from
                AND (v.effective_until IS NULL OR days.on_date::date < v.effective_until)
            JOIN public.semesters se ON se.id = v.semester_id AND days.on_date::date BETWEEN se.start_date AND se.end_date
            JOIN public.academic_years y ON y.id = se.academic_year_id
            JOIN public.schools sc ON sc.id = y.school_id
            JOIN public.timetable_slots sl ON sl.version_id = v.id AND sl.weekday = EXTRACT(ISODOW FROM days.on_date)
            JOIN public.teaching_assignments a ON a.id = sl.teaching_assignment_id AND a.semester_id = se.id
            JOIN public.classes c ON c.id = a.class_id AND c.school_id = sc.id AND c.academic_year_id = y.id
            JOIN public.subjects sb ON sb.id = a.subject_id AND sb.school_id = sc.id
            JOIN public.staff st ON st.id = a.staff_id AND st.school_id = sc.id
            JOIN public.rooms r ON r.id = sl.room_id AND r.school_id = sc.id
            JOIN public.period_definitions p ON p.id = sl.period_id AND p.school_id = sc.id
            LEFT JOIN public.substitutions su ON su.original_slot_id = sl.id AND su.on_date = days.on_date::date
                AND su.status IN ('confirmed', 'completed')
            LEFT JOIN public.staff teacher ON teacher.id = su.substitute_staff_id AND teacher.school_id = sc.id
            WHERE sc.id = {school}
            ORDER BY "StartsAt", c.code, sl.id
            """).ToListAsync(ct);

    public Task<List<ScheduleOccurrence>> Exams(Guid school, DateOnly from, DateOnly to, CancellationToken ct) =>
        db.Database.SqlQuery<ScheduleOccurrence>($"""
            SELECT 'exam' AS "Kind", e.id AS "Id", NULL::uuid AS "VersionId", NULL::bigint AS "ContentRevision",
                (e.starts_at AT TIME ZONE sc.timezone)::date AS "OnDate", sc.timezone AS "Timezone", se.id AS "SemesterId",
                c.id AS "ClassId", c.code AS "ClassCode", sb.id AS "SubjectId", sb.name AS "SubjectName",
                NULL::uuid AS "StaffId", NULL::text AS "TeacherName", NULL::uuid AS "OriginalStaffId",
                r.id AS "RoomId", r.code AS "RoomCode", e.starts_at AS "StartsAt", e.ends_at AS "EndsAt",
                sb.code AS "SubjectCode", NULL::smallint AS "PeriodNo", NULL::text AS "Shift", se.name AS "SemesterName", y.name AS "AcademicYearName"
            FROM public.exam_schedules e
            JOIN public.classes c ON c.id = e.class_id
            JOIN public.schools sc ON sc.id = c.school_id
            JOIN public.semesters se ON se.id = e.semester_id AND se.academic_year_id = c.academic_year_id
            JOIN public.academic_years y ON y.id = se.academic_year_id AND y.school_id = sc.id
            JOIN public.subjects sb ON sb.id = e.subject_id AND sb.school_id = sc.id
            LEFT JOIN public.rooms r ON r.id = e.room_id AND r.school_id = sc.id
            WHERE sc.id = {school} AND e.status = 'published'
              AND (e.starts_at AT TIME ZONE sc.timezone)::date <= {to}
              AND (e.ends_at AT TIME ZONE sc.timezone) > CAST({from} AS date)::timestamp
              AND (e.room_id IS NULL OR r.id IS NOT NULL)
            ORDER BY e.starts_at, e.id
            """).ToListAsync(ct);

    public async Task<List<ScheduleOccurrence>> Between(Guid school, DateOnly from, DateOnly to, CancellationToken ct)
    {
        var lessons = await Lessons(school, from, to, ct);
        var exams = await Exams(school, from, to, ct);
        return lessons.Concat(exams).OrderBy(item => item.StartsAt).ThenBy(item => item.Id).ToList();
    }

    public async Task<StudentScheduleSchool?> StudentSchool(Guid user, DateTimeOffset now, CancellationToken ct) =>
        (await db.Database.SqlQuery<StudentScheduleSchool>($"""
            SELECT sc.id AS "Id", ({now} AT TIME ZONE sc.timezone)::date AS "Today"
            FROM public.students st JOIN public.schools sc ON sc.id = st.school_id
            WHERE st.user_id = {user} AND sc.status = 'active' AND EXISTS (
                SELECT 1 FROM public.school_memberships m
                JOIN public.role_permissions rp ON rp.role_code = m.role_code
                WHERE m.user_id = {user} AND m.school_id = sc.id AND m.status = 'active'
                  AND rp.permission_code = 'student_timetable.view'
                  AND (m.valid_from IS NULL OR m.valid_from <= ({now} AT TIME ZONE sc.timezone)::date)
                  AND (m.valid_to IS NULL OR m.valid_to >= ({now} AT TIME ZONE sc.timezone)::date)
            )
            """).ToListAsync(ct)).SingleOrDefault();

    public async Task<List<ScheduleOccurrence>> ForStudent(Guid user, Guid school, DateOnly from, DateOnly to,
        bool exams, CancellationToken ct)
    {
        var enrollments = await db.Database.SqlQuery<ScheduleEnrollment>($"""
            SELECT e.class_id AS "ClassId", e.enrolled_on AS "EnrolledOn", e.left_on AS "LeftOn"
            FROM public.class_enrollments e JOIN public.students st ON st.id = e.student_id
            WHERE st.user_id = {user} AND st.school_id = {school}
              AND e.enrolled_on <= {to} AND (e.left_on IS NULL OR e.left_on > {from})
            """).ToListAsync(ct);
        if (enrollments.Count == 0) return [];
        var items = exams ? await Exams(school, from, to, ct) : await Lessons(school, from, to, ct);
        return items.Where(item => enrollments.Any(enrollment => enrollment.ClassId == item.ClassId
            && enrollment.EnrolledOn <= item.OnDate && (enrollment.LeftOn == null || enrollment.LeftOn > item.OnDate))).ToList();
    }

    public static bool Overlaps(DateTimeOffset starts, DateTimeOffset ends, ScheduleOccurrence existing) =>
        existing.StartsAt < ends && starts < existing.EndsAt;
}
