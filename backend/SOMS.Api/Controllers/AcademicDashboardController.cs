using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SOMS.Application.Common.Security;
using SOMS.Application.Modules.Academic;
using SOMS.Domain.Entities;
using SOMS.Infrastructure.Data;

namespace SOMS.Api.Controllers;

[Route("api/academic/dashboard")]
public sealed class AcademicDashboardController(SomsDbContext db, TimeProvider clock, AcademicScheduleStore schedule)
    : AcademicControllerBase(db, clock)
{
    [HttpGet("filters")]
    public async Task<IActionResult> Filters(Guid? schoolId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchool(schoolId, PermissionCodes.AcademicManage, ct);
        if (error != null) return error;
        var years = await Db.Set<AcademicYear>().Where(row => row.SchoolId == school)
            .OrderByDescending(row => row.StartDate)
            .Select(row => new AcademicYearOption(row.Id, row.Name, row.Status)).ToListAsync(ct);
        var semesters = await (from semester in Db.Set<Semester>()
                               join year in Db.Set<AcademicYear>() on semester.AcademicYearId equals year.Id
                               where year.SchoolId == school
                               orderby semester.StartDate descending, semester.Ordinal
                               select new SemesterOption(semester.Id, year.Id, semester.Name, semester.Ordinal,
                                   semester.StartDate, semester.EndDate, semester.Status)).ToListAsync(ct);
        return Ok(new { years, semesters });
    }

    [HttpGet]
    public async Task<IActionResult> Summary(Guid? schoolId, Guid? academicYearId, Guid? semesterId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchool(schoolId, PermissionCodes.AcademicManage, ct);
        if (error != null) return error;
        if (academicYearId.HasValue && !await Db.Set<AcademicYear>().AnyAsync(row => row.SchoolId == school && row.Id == academicYearId, ct))
            return NotFound();
        var scopedSemesters =
            from semester in Db.Set<Semester>()
            join year in Db.Set<AcademicYear>() on semester.AcademicYearId equals year.Id
            where year.SchoolId == school && (!academicYearId.HasValue || year.Id == academicYearId)
                && (!semesterId.HasValue || semester.Id == semesterId)
            select semester;
        if (semesterId.HasValue)
        {
            var semester = await scopedSemesters.SingleOrDefaultAsync(ct);
            if (semester == null) return NotFound();
            academicYearId ??= semester.AcademicYearId;
        }
        var semesterIds = await scopedSemesters.Select(row => row.Id).ToArrayAsync(ct);
        var classes = Db.Set<SchoolClass>().Where(row => row.SchoolId == school && row.Status == "active"
            && (!academicYearId.HasValue || row.AcademicYearId == academicYearId));
        var students = Db.Set<Student>().Where(row => row.SchoolId == school && row.Status == "enrolled");
        if (academicYearId.HasValue)
        {
            students = students.Where(student =>
                Db.Set<ClassEnrollment>().Any(enrollment => enrollment.StudentId == student.Id
                    && enrollment.Status == "active" && classes.Any(row => row.Id == enrollment.ClassId)));
        }

        var unmet = await (from curriculum in Db.Set<ClassSubject>()
                           join schoolClass in classes on curriculum.ClassId equals schoolClass.Id
                           join subject in Db.Set<Subject>() on curriculum.SubjectId equals subject.Id
                           where semesterIds.Contains(curriculum.SemesterId) && subject.SchoolId == school && subject.IsActive
                               && Db.Set<TeachingAssignment>().Where(item => item.ClassId == curriculum.ClassId
                                   && item.SemesterId == curriculum.SemesterId && item.SubjectId == curriculum.SubjectId
                                   && item.Status == "active").Sum(item => (int)item.WeeklyPeriods) < curriculum.WeeklyPeriods
                           select curriculum).CountAsync(ct);
        var drafts = (await Db.Database.SqlQuery<long>($"""
            SELECT count(*) FROM public.timetable_versions WHERE semester_id = ANY({semesterIds}) AND status = 'draft'
            """).ToListAsync(ct)).Single();
        var conflictedDrafts = (await Db.Database.SqlQuery<long>($"""
            SELECT count(DISTINCT v.id)
            FROM public.timetable_versions v
            JOIN public.timetable_slots s1 ON s1.version_id = v.id
            JOIN public.timetable_slots s2 ON s2.version_id = v.id AND s2.id > s1.id AND s2.weekday = s1.weekday
            JOIN public.period_definitions p1 ON p1.id = s1.period_id
            JOIN public.period_definitions p2 ON p2.id = s2.period_id
            JOIN public.teaching_assignments a1 ON a1.id = s1.teaching_assignment_id
            JOIN public.teaching_assignments a2 ON a2.id = s2.teaching_assignment_id
            WHERE v.semester_id = ANY({semesterIds}) AND v.status = 'draft'
              AND p1.starts_at < p2.ends_at AND p2.starts_at < p1.ends_at
              AND (s1.room_id = s2.room_id OR a1.class_id = a2.class_id OR a1.staff_id = a2.staff_id)
            """).ToListAsync(ct)).Single();

        var from = await SchoolToday(school, ct);
        var to = from.AddDays(6);
        var lessons = await schedule.Lessons(school, from, to, ct);
        var leaves = await Db.Database.SqlQuery<TeacherLeaveWindow>($"""
            SELECT staff_id AS "StaffId", starts_on AS "StartsOn", ends_on AS "EndsOn"
            FROM public.workflow_requests
            WHERE school_id = {school} AND request_type = 'teacher_leave' AND status IN ('approved', 'completed')
              AND staff_id IS NOT NULL AND starts_on <= {to} AND (ends_on IS NULL OR ends_on >= {from})
            """).ToListAsync(ct);
        var needsSubstitute = lessons.Count(item => semesterIds.Contains(item.SemesterId) && item.StaffId == item.OriginalStaffId
            && item.StartsAt > UtcNow && leaves.Any(leave => leave.StaffId == item.StaffId && leave.StartsOn <= item.OnDate
                && (leave.EndsOn == null || leave.EndsOn >= item.OnDate)));
        return Ok(new
        {
            students = await students.CountAsync(ct), classes = await classes.CountAsync(ct), unmetAssignments = unmet,
            drafts, conflictedDrafts, needsSubstitute
        });
    }

    private sealed record TeacherLeaveWindow(Guid StaffId, DateOnly StartsOn, DateOnly? EndsOn);
}
