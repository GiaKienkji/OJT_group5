using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SOMS.Application.Modules.Academic;
using SOMS.Domain.Entities;
using SOMS.Infrastructure.Data;

namespace SOMS.Api.Controllers;

public sealed partial class AcademicEventsController
{
    [HttpGet("exams/semesters")]
    public async Task<IActionResult> ExamSemesters(Guid? schoolId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchool(schoolId, Exams, ct);
        if (error != null) return error;
        var options = from semester in Db.Set<Semester>()
                      join year in Db.Set<AcademicYear>() on semester.AcademicYearId equals year.Id
                      where year.SchoolId == school
                      orderby semester.StartDate descending, semester.Ordinal
                      select new SemesterOption(semester.Id, year.Id, semester.Name, semester.Ordinal,
                          semester.StartDate, semester.EndDate, semester.Status);
        return Ok(await options.ToListAsync(ct));
    }

    [HttpGet("exams/options")]
    public async Task<IActionResult> ExamResources(Guid semesterId, Guid? schoolId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchool(schoolId, Exams, ct);
        if (error != null) return error;
        var semester = await ExamSemester(school, semesterId, ct);
        if (semester == null) return NotFound();
        var classes = await Db.Set<SchoolClass>().Where(row => row.SchoolId == school
            && row.AcademicYearId == semester.AcademicYearId && row.Status == "active")
            .OrderBy(row => row.Code).Select(row => new ExamClass(row.Id, row.Code, row.Name)).ToListAsync(ct);
        var subjects = await Db.Set<Subject>().Where(row => row.SchoolId == school && row.IsActive)
            .OrderBy(row => row.Code).Select(row => new ExamSubject(row.Id, row.Code, row.Name)).ToListAsync(ct);
        var rooms = await Db.Database.SqlQuery<TimetableRoomOption>($"""
            SELECT id AS "Id", code AS "Code", name AS "Name", capacity AS "Capacity"
            FROM public.rooms WHERE school_id = {school} AND status = 'available' ORDER BY code, id
            """).ToListAsync(ct);
        return Ok(new ExamOptions(classes, subjects, rooms, await Timezone(school, ct)));
    }

    [HttpGet("exams")]
    public async Task<IActionResult> List(Guid semesterId, Guid? schoolId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchool(schoolId, Exams, ct);
        if (error != null) return error;
        if (await ExamSemester(school, semesterId, ct) == null) return NotFound();
        return Ok(await ExamRows(school, semesterId, null).ToListAsync(ct));
    }

    [HttpGet("exams/{id:guid}")]
    public async Task<IActionResult> GetExam(Guid id, Guid? schoolId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchool(schoolId, Exams, ct);
        if (error != null) return error;
        var exam = await FindExam(school, id, ct);
        return exam == null ? NotFound() : Ok(exam);
    }

    [HttpPost("exams")]
    public Task<IActionResult> CreateExam(ExamInput input, Guid? schoolId, CancellationToken ct) =>
        SaveExam(null, input, schoolId, ct);

    [HttpPut("exams/{id:guid}")]
    public Task<IActionResult> EditExam(Guid id, ExamInput input, Guid? schoolId, CancellationToken ct) =>
        SaveExam(id, input, schoolId, ct);

    [HttpPost("exams/{id:guid}/publish")]
    public Task<IActionResult> PublishExam(Guid id, RevisionInput input, Guid? schoolId, CancellationToken ct) =>
        ChangeExam(id, input, true, schoolId, ct);

    [HttpPost("exams/{id:guid}/cancel")]
    public Task<IActionResult> CancelExam(Guid id, RevisionInput input, Guid? schoolId, CancellationToken ct) =>
        ChangeExam(id, input, false, schoolId, ct);

    private async Task<IActionResult> SaveExam(Guid? id, ExamInput input, Guid? schoolId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchool(schoolId, Exams, ct);
        if (error != null) return error;
        return await InTransaction(async () =>
        {
            await LockSchoolSchedule(school, ct);
            var exam = id is Guid examId ? await FindExam(school, examId, ct) : null;
            if (id.HasValue && exam == null) return NotFound();
            if (exam != null && (exam.Status != "draft" || exam.Revision != input.Revision))
                return Problem(statusCode: 409, title: "Lịch kiểm tra đã thay đổi hoặc không còn ở trạng thái nháp.");
            var invalid = await ValidateExam(school, input, id, ct);
            if (invalid != null) return invalid;

            var persisted = id ?? Guid.NewGuid();
            var starts = input.StartsAt.ToUniversalTime();
            var ends = input.EndsAt.ToUniversalTime();
            if (id.HasValue)
            {
                await Db.Database.ExecuteSqlInterpolatedAsync($"""
                    UPDATE public.exam_schedules SET class_id = {input.ClassId}, subject_id = {input.SubjectId},
                        semester_id = {input.SemesterId}, starts_at = {starts}, ends_at = {ends}, room_id = {input.RoomId}
                    WHERE id = {persisted}
                    """, ct);
            }
            else
            {
                await Db.Database.ExecuteSqlInterpolatedAsync($"""
                    INSERT INTO public.exam_schedules (id, class_id, subject_id, semester_id, starts_at, ends_at, room_id, status)
                    VALUES ({persisted}, {input.ClassId}, {input.SubjectId}, {input.SemesterId}, {starts}, {ends}, {input.RoomId}, 'draft')
                    """, ct);
            }
            var saved = (await FindExam(school, persisted, ct))!;
            return id.HasValue ? Ok(saved) : CreatedAtAction(nameof(GetExam), new { id = persisted, schoolId = school }, saved);
        }, ct);
    }

    private async Task<IActionResult> ChangeExam(Guid id, RevisionInput input, bool publish, Guid? schoolId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchool(schoolId, Exams, ct);
        if (error != null) return error;
        return await InTransaction(async () =>
        {
            await LockSchoolSchedule(school, ct);
            var exam = await FindExam(school, id, ct);
            if (exam == null) return NotFound();
            if (exam.Revision != input.Revision || (publish ? exam.Status != "draft" : exam.Status == "cancelled")
                || exam.StartsAt <= UtcNow)
                return Problem(statusCode: 409, title: "Lịch kiểm tra đã thay đổi, đã diễn ra hoặc không thể đổi trạng thái.");
            if (publish)
            {
                var invalid = await ValidateExam(school, new ExamInput(exam.ClassId, exam.SubjectId, exam.SemesterId,
                    exam.StartsAt, exam.EndsAt, exam.RoomId, exam.Revision), id, ct);
                if (invalid != null) return invalid;
            }

            var status = publish ? "published" : "cancelled";
            await Db.Database.ExecuteSqlInterpolatedAsync($"""
                UPDATE public.exam_schedules SET status = {status} WHERE id = {id}
                """, ct);
            await Audit(school, "exam_schedules", id, "UPDATE", new { from = exam.Status, to = status }, ct);
            return Ok(await FindExam(school, id, ct));
        }, ct);
    }

    private async Task<IActionResult?> ValidateExam(Guid school, ExamInput input, Guid? id, CancellationToken ct)
    {
        if (input.StartsAt <= UtcNow || input.EndsAt <= input.StartsAt)
            return Problem(statusCode: 400, title: "Chọn giờ kiểm tra trong tương lai và kết thúc sau giờ bắt đầu.");
        var semester = await ExamSemester(school, input.SemesterId, ct);
        if (semester == null || semester.Status == "closed")
            return Problem(statusCode: 400, title: "Chọn học kỳ còn mở của trường.");
        if (await LockClasses(school, [input.ClassId], ct) == 0)
            return Problem(statusCode: 400, title: "Chọn lớp của trường.");
        var validClass = await Db.Set<SchoolClass>().AnyAsync(row => row.Id == input.ClassId
            && row.AcademicYearId == semester.AcademicYearId && row.Status == "active", ct);
        var validSubject = await Db.Set<Subject>().AnyAsync(row => row.Id == input.SubjectId && row.SchoolId == school && row.IsActive, ct);
        if (!validClass || !validSubject)
            return Problem(statusCode: 400, title: "Lớp, học kỳ hoặc môn không hợp lệ.");

        var zone = await Timezone(school, ct);
        var day = DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeBySystemTimeZoneId(input.StartsAt, zone).DateTime);
        var finalDay = DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeBySystemTimeZoneId(input.EndsAt, zone).DateTime);
        if (day != finalDay || day < semester.StartDate || day > semester.EndDate)
            return Problem(statusCode: 400, title: "Ca phải nằm trong cùng một ngày của học kỳ theo giờ trường.");

        if (input.RoomId is Guid roomId)
        {
            var rooms = await Db.Database.SqlQuery<TimetableRoomOption>($"""
                SELECT id AS "Id", code AS "Code", name AS "Name", capacity AS "Capacity"
                FROM public.rooms WHERE id = {roomId} AND school_id = {school} AND status = 'available'
                """).ToListAsync(ct);
            var room = rooms.SingleOrDefault();
            if (room == null || room.Capacity is int capacity && await ActiveEnrollments(input.ClassId).CountAsync(ct) > capacity)
                return Problem(statusCode: 400, title: "Phòng không khả dụng hoặc sức chứa thấp hơn sĩ số lớp.");
        }

        var events = await schedule.Between(school, day, day, ct);
        var conflict = events.FirstOrDefault(item => (item.Kind != "exam" || item.Id != id)
            && (item.ClassId == input.ClassId || input.RoomId.HasValue && item.RoomId == input.RoomId)
            && AcademicScheduleStore.Overlaps(input.StartsAt, input.EndsAt, item));
        return conflict == null ? null : ConflictWith(conflict);
    }

    private Task<Semester?> ExamSemester(Guid school, Guid semester, CancellationToken ct) =>
        (from row in Db.Set<Semester>()
         join year in Db.Set<AcademicYear>() on row.AcademicYearId equals year.Id
         where row.Id == semester && year.SchoolId == school
         select row).SingleOrDefaultAsync(ct);

    private async Task<ExamRow?> FindExam(Guid school, Guid id, CancellationToken ct) =>
        (await ExamRows(school, null, id).ToListAsync(ct)).SingleOrDefault();

    private IQueryable<ExamRow> ExamRows(Guid school, Guid? semester, Guid? id) =>
        Db.Database.SqlQuery<ExamRow>($"""
            SELECT e.id AS "Id", c.id AS "ClassId", c.code AS "ClassCode", s.id AS "SubjectId", s.name AS "SubjectName",
                e.semester_id AS "SemesterId", e.starts_at AS "StartsAt", e.ends_at AS "EndsAt",
                r.id AS "RoomId", r.code AS "RoomCode", e.status AS "Status", e.xmin::text::bigint AS "Revision"
            FROM public.exam_schedules e
            JOIN public.classes c ON c.id = e.class_id AND c.school_id = {school}
            JOIN public.semesters se ON se.id = e.semester_id AND se.academic_year_id = c.academic_year_id
            JOIN public.academic_years y ON y.id = se.academic_year_id AND y.school_id = {school}
            JOIN public.subjects s ON s.id = e.subject_id AND s.school_id = {school}
            LEFT JOIN public.rooms r ON r.id = e.room_id AND r.school_id = {school}
            WHERE (e.semester_id = CAST({semester} AS uuid) OR CAST({semester} AS uuid) IS NULL)
              AND (e.id = CAST({id} AS uuid) OR CAST({id} AS uuid) IS NULL)
              AND (e.room_id IS NULL OR r.id IS NOT NULL)
            ORDER BY e.starts_at, e.id
            """);
}
