using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SOMS.Application.Common.Security;
using SOMS.Application.Modules.Academic;
using SOMS.Infrastructure.Data;

namespace SOMS.Api.Controllers;

[Route("api/academic/schedule")]
public sealed class AcademicScheduleController(SomsDbContext db, TimeProvider clock, AcademicScheduleStore schedule)
    : AcademicControllerBase(db, clock)
{
    private static readonly string[] Permissions = [
        PermissionCodes.AcademicManage, PermissionCodes.StudentTimetableView, PermissionCodes.TeachingScheduleView,
        PermissionCodes.ParentAcademicsView
    ];

    [HttpGet("context")]
    public async Task<IActionResult> Context(CancellationToken ct)
    {
        var schools = await GetSchools(Permissions, ct);
        if (schools.Count == 0) return Forbid();
        var result = new List<ScheduleSchool>();
        foreach (var school in schools)
            result.Add(new ScheduleSchool(school.Id, school.Name, await SchoolToday(school.Id, ct)));
        return Ok(result);
    }

    [HttpGet]
    public async Task<IActionResult> Between(DateOnly from, DateOnly to, Guid? schoolId, Guid? classId, Guid? teacherId,
        Guid? roomId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchoolForAny(schoolId, Permissions, ct);
        if (error != null) return error;
        if (from == default || to < from || to.DayNumber - from.DayNumber > 61)
            return Problem(statusCode: 400, title: "Chọn khoảng lịch tối đa 62 ngày.");

        var occurrences = await schedule.Between(school, from, to, ct);
        var filtered = occurrences.Where(item => (!classId.HasValue || item.ClassId == classId)
            && (!teacherId.HasValue || item.StaffId == teacherId) && (!roomId.HasValue || item.RoomId == roomId));
        if (await Has(PermissionCodes.AcademicManage, school, ct))
            return Ok(filtered.ToList());

        var isStudent = await Has(PermissionCodes.StudentTimetableView, school, ct);
        var isGuardian = await Has(PermissionCodes.ParentAcademicsView, school, ct);
        var isTeacher = await Has(PermissionCodes.TeachingScheduleView, school, ct);
        var actor = ActorId!.Value;

        var enrollments = await Db.Database.SqlQuery<ScheduleEnrollment>($"""
            SELECT e.class_id AS "ClassId", e.enrolled_on AS "EnrolledOn", e.left_on AS "LeftOn"
            FROM public.class_enrollments e
            JOIN public.students st ON st.id = e.student_id AND st.school_id = {school}
            WHERE e.enrolled_on <= {to} AND (e.left_on IS NULL OR e.left_on > {from})
              AND (({isStudent} AND st.user_id = {actor}) OR ({isGuardian} AND EXISTS (
                  SELECT 1 FROM public.student_guardians sg JOIN public.guardians g ON g.id = sg.guardian_id
                  WHERE sg.student_id = st.id AND sg.can_view_academics AND sg.verified_at IS NOT NULL
                    AND g.school_id = {school} AND g.user_id = {actor}
              )))
            """).ToListAsync(ct);
        var teacherIds = isTeacher ? await Db.Database.SqlQuery<Guid>($"""
            SELECT id FROM public.staff WHERE user_id = {actor} AND school_id = {school} AND kind = 'teacher'
            """).ToListAsync(ct) : [];
        var examAssignments = isTeacher && teacherIds.Count > 0
            ? (await Db.Database.SqlQuery<ScheduleTeaching>($"""
                SELECT a.class_id AS "ClassId", a.subject_id AS "SubjectId", a.semester_id AS "SemesterId"
                FROM public.teaching_assignments a
                JOIN public.classes c ON c.id = a.class_id AND c.school_id = {school}
                WHERE a.staff_id = ANY({teacherIds.ToArray()}) AND a.status = 'active'
                """).ToListAsync(ct)).ToHashSet() : [];
        return Ok(filtered.Where(item => item.StaffId.HasValue && teacherIds.Contains(item.StaffId.Value)
            || item.Kind == "exam" && examAssignments.Contains(new ScheduleTeaching(item.ClassId, item.SubjectId, item.SemesterId))
            || enrollments.Any(enrollment => enrollment.ClassId == item.ClassId && enrollment.EnrolledOn <= item.OnDate
                && (enrollment.LeftOn == null || enrollment.LeftOn > item.OnDate))).ToList());
    }

    private async Task<bool> Has(string permission, Guid school, CancellationToken ct) =>
        (await GetSchools(permission, ct)).Any(item => item.Id == school);
}
