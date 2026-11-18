using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SOMS.Application.Common.Security;
using SOMS.Application.Modules.Academic;
using SOMS.Domain.Entities;
using SOMS.Infrastructure.Data;

namespace SOMS.Api.Controllers;

[Route("api/academic")]
public sealed partial class AcademicTimetablesController(SomsDbContext db, TimeProvider clock, AcademicScheduleStore schedule) : AcademicControllerBase(db, clock)
{
    private AcademicScheduleStore Schedule { get; } = schedule;
    private const string Draft = PermissionCodes.TimetablesDraft;
    private static readonly string[] ReadPermissions = [Draft, PermissionCodes.TimetablesApprove, PermissionCodes.TimetablesPublish];

    [HttpGet("timetables/context")]
    public async Task<IActionResult> Context(CancellationToken ct)
    {
        var schools = await GetSchools(ReadPermissions, ct);
        return schools.Count == 0 ? Forbid() : Ok(schools);
    }

    [HttpGet("timetables/semesters")]
    public async Task<IActionResult> Semesters(Guid? schoolId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchoolForAny(schoolId, ReadPermissions, ct);
        if (error != null) return error;
        var periods = from semester in Db.Set<Semester>()
                      join year in Db.Set<AcademicYear>() on semester.AcademicYearId equals year.Id
                      where year.SchoolId == school
                      orderby semester.StartDate descending, semester.Ordinal, semester.Id
                      select new SemesterOption(semester.Id, year.Id, semester.Name, semester.Ordinal,
                          semester.StartDate, semester.EndDate, semester.Status);
        return Ok(await periods.ToListAsync(ct));
    }

    [HttpGet("timetables/options")]
    public async Task<IActionResult> Options(Guid semesterId, Guid? schoolId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchool(schoolId, Draft, ct);
        if (error != null) return error;
        if (!await HasSemester(school, semesterId, ct)) return NotFound();
        return Ok(await LoadOptions(school, semesterId, ct));
    }

    [HttpGet("timetables")]
    public async Task<IActionResult> List(Guid semesterId, Guid? schoolId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchoolForAny(schoolId, ReadPermissions, ct);
        if (error != null) return error;
        if (!await HasSemester(school, semesterId, ct)) return NotFound();
        return Ok(await Versions(school, semesterId, null).ToListAsync(ct));
    }

    [HttpGet("timetables/{id:guid}")]
    public async Task<IActionResult> Detail(Guid id, Guid? schoolId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchoolForAny(schoolId, ReadPermissions, ct);
        if (error != null) return error;
        var version = await FindVersion(school, id, ct);
        return version == null ? NotFound() : Ok(await GetDetail(school, version, ct));
    }

    [HttpPost("timetables")]
    public Task<IActionResult> Create(TimetableInput input, Guid? schoolId, CancellationToken ct) =>
        NewVersion(schoolId, input.SemesterId, null, ct);

    [HttpPost("timetables/{id:guid}/clone")]
    public Task<IActionResult> Clone(Guid id, Guid? schoolId, CancellationToken ct) =>
        NewVersion(schoolId, null, id, ct);

    [HttpPost("timetables/{id:guid}/entries")]
    public Task<IActionResult> AddEntry(Guid id, TimetableSlotInput input, Guid? schoolId, CancellationToken ct) =>
        SaveSlot(id, null, input, schoolId, ct);

    [HttpPut("timetables/{id:guid}/entries/{entryId:guid}")]
    public Task<IActionResult> UpdateEntry(Guid id, Guid entryId, TimetableSlotInput input, Guid? schoolId, CancellationToken ct) =>
        SaveSlot(id, entryId, input, schoolId, ct);

    [HttpDelete("timetables/{id:guid}/entries/{entryId:guid}")]
    public async Task<IActionResult> DeleteEntry(Guid id, Guid entryId, uint revision, Guid? schoolId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchool(schoolId, Draft, ct);
        if (error != null) return error;
        return await InTransaction(async () =>
        {
            await LockSchoolSchedule(school, ct);
            var version = await FindVersion(school, id, ct);
            if (version == null) return NotFound();
            if (version.Status != "draft" || version.Revision != revision) return DraftChanged();
            var deleted = await Db.Database.ExecuteSqlInterpolatedAsync($"""
                DELETE FROM public.timetable_slots WHERE version_id = {id} AND id = {entryId}
                """, ct);
            if (deleted == 0) return NotFound();
            await AdvanceVersion(id, ct);
            return Ok(await GetDetail(school, (await FindVersion(school, id, ct))!, ct));
        }, ct);
    }

    [HttpPost("timetables/{id:guid}/validate")]
    public async Task<IActionResult> Validate(Guid id, Guid? schoolId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchoolForAny(schoolId, ReadPermissions, ct);
        if (error != null) return error;
        var version = await FindVersion(school, id, ct);
        if (version == null) return NotFound();
        return Ok(await ValidateVersion(school, version, ct));
    }

    [HttpPost("timetables/{id:guid}/check-conflicts")]
    public async Task<IActionResult> Check(Guid id, Guid? entryId, TimetableSlotInput input, Guid? schoolId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchool(schoolId, Draft, ct);
        if (error != null) return error;
        var version = await FindVersion(school, id, ct);
        if (version == null) return NotFound();
        var options = await LoadOptions(school, version.SemesterId, ct);
        var slot = MakeSlot(options, input, entryId ?? Guid.Empty);
        if (slot == null) return InvalidResources();
        var conflicts = FindConflicts(slot, await Slots(school, id).ToListAsync(ct));
        return Ok(new TimetableCheck(conflicts.Count == 0, conflicts));
    }

    [HttpGet("timetables/{id:guid}/suggestions")]
    public async Task<IActionResult> Suggestions(Guid id, Guid assignmentId, int weekday, Guid? entryId, Guid? schoolId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchool(schoolId, Draft, ct);
        if (error != null) return error;
        if (weekday is < 1 or > 7) return Problem(statusCode: 400, title: "Chọn thứ từ 1 đến 7.");
        var version = await FindVersion(school, id, ct);
        if (version == null) return NotFound();
        var options = await LoadOptions(school, version.SemesterId, ct);
        var original = options.Assignments.SingleOrDefault(item => item.Id == assignmentId);
        if (original == null) return InvalidResources();
        var items = await Slots(school, id).ToListAsync(ct);
        var counts = items.Where(item => item.Id != entryId).GroupBy(item => item.TeachingAssignmentId)
            .ToDictionary(group => group.Key, group => group.Count());
        var compatible = options.Assignments.Where(item => item.ClassId == original.ClassId && item.SubjectId == original.SubjectId
            && counts.GetValueOrDefault(item.Id) < item.WeeklyPeriods).OrderByDescending(item => item.Id == assignmentId);
        var suggestions = from assignment in compatible
                          from period in options.Periods
                          from room in options.Rooms
                          let input = new TimetableSlotInput(assignment.Id, room.Id, period.Id, (short)weekday, version.Revision)
                          let slot = MakeSlot(options, input, entryId ?? Guid.Empty)
                          where slot != null && FindConflicts(slot, items).Count == 0
                          select new TimetableSuggestion(assignment.Id, assignment.TeacherName, room.Id, room.Code,
                              period.Id, (short)weekday, period.StartsAt, period.EndsAt);
        return Ok(suggestions.Take(25).ToList());
    }

    private async Task<IActionResult> NewVersion(Guid? schoolId, Guid? semesterId, Guid? sourceId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchool(schoolId, Draft, ct);
        if (error != null) return error;
        return await InTransaction(async () =>
        {
            await LockSchoolSchedule(school, ct);
            var source = sourceId is Guid id ? await FindVersion(school, id, ct) : null;
            var targetSemester = source?.SemesterId ?? semesterId;
            if (targetSemester is not Guid semester || !await HasSemester(school, semester, ct)) return NotFound();
            if (await Db.Set<Semester>().AnyAsync(item => item.Id == semester && item.Status == "closed", ct))
                return Problem(statusCode: 409, title: "Học kỳ đã đóng.");
            var selected = await Versions(school, semester, null).ToListAsync(ct);
            var versionNo = selected.Select(item => item.VersionNo).DefaultIfEmpty(0).Max() + 1;
            var newId = Guid.NewGuid();
            await Db.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO public.timetable_versions (id, semester_id, version_no, status, created_by)
                VALUES ({newId}, {semester}, {versionNo}, 'draft', {ActorId!.Value})
                """, ct);
            if (source != null)
            {
                var slots = await Slots(school, source.Id).ToListAsync(ct);
                foreach (var slot in slots)
                    await InsertSlot(newId, Guid.NewGuid(), slot, ct);
            }
            var created = (await FindVersion(school, newId, ct))!;
            return CreatedAtAction(nameof(Detail), new { id = newId, schoolId = school }, await GetDetail(school, created, ct));
        }, ct);
    }

    private async Task<IActionResult> SaveSlot(Guid versionId, Guid? entryId, TimetableSlotInput input, Guid? schoolId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchool(schoolId, Draft, ct);
        if (error != null) return error;
        return await InTransaction(async () =>
        {
            await LockSchoolSchedule(school, ct);
            var version = await FindVersion(school, versionId, ct);
            if (version == null) return NotFound();
            if (version.Status != "draft" || version.Revision != input.Revision) return DraftChanged();

            var slots = await Slots(school, versionId).ToListAsync(ct);
            if (entryId.HasValue && !slots.Any(item => item.Id == entryId)) return NotFound();
            var options = await LoadOptions(school, version.SemesterId, ct);
            var slot = MakeSlot(options, input, entryId ?? Guid.NewGuid());
            if (slot == null) return InvalidResources();

            var conflicts = FindConflicts(slot, slots);
            if (conflicts.Count > 0)
                return Conflict(new ProblemDetails
                {
                    Status = 409,
                    Title = "Trùng giờ trong thời khóa biểu.",
                    Detail = Describe(conflicts),
                    Extensions = { ["conflicts"] = conflicts }
                });

            if (entryId.HasValue)
            {
                await Db.Database.ExecuteSqlInterpolatedAsync($"""
                    UPDATE public.timetable_slots
                    SET teaching_assignment_id = {slot.TeachingAssignmentId}, room_id = {slot.RoomId},
                        weekday = {slot.Weekday}, period_id = {slot.PeriodId}
                    WHERE id = {slot.Id} AND version_id = {versionId}
                    """, ct);
            }
            else
                await InsertSlot(versionId, slot.Id, slot, ct);

            await AdvanceVersion(versionId, ct);
            return Ok(await GetDetail(school, (await FindVersion(school, versionId, ct))!, ct));
        }, ct);
    }

    private Task InsertSlot(Guid versionId, Guid id, TimetableSlotRow slot, CancellationToken ct) =>
        Db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO public.timetable_slots (id, version_id, teaching_assignment_id, room_id, weekday, period_id)
            VALUES ({id}, {versionId}, {slot.TeachingAssignmentId}, {slot.RoomId}, {slot.Weekday}, {slot.PeriodId})
            """, ct);

    private Task AdvanceVersion(Guid id, CancellationToken ct) => Db.Database.ExecuteSqlInterpolatedAsync($"""
        UPDATE public.timetable_versions SET content_revision = content_revision + 1 WHERE id = {id}
        """, ct);

    private Task<bool> HasSemester(Guid school, Guid semester, CancellationToken ct) =>
        (from item in Db.Set<Semester>()
         join year in Db.Set<AcademicYear>() on item.AcademicYearId equals year.Id
         where item.Id == semester && year.SchoolId == school
         select item.Id).AnyAsync(ct);

    private async Task<TimetableRow?> FindVersion(Guid school, Guid id, CancellationToken ct) =>
        (await Versions(school, null, id).ToListAsync(ct)).SingleOrDefault();

    private IQueryable<TimetableRow> Versions(Guid school, Guid? semester, Guid? id) =>
        Db.Database.SqlQuery<TimetableRow>($"""
            SELECT v.id AS "Id", v.semester_id AS "SemesterId", v.version_no AS "VersionNo", v.status AS "Status",
                   v.xmin::text::bigint AS "Revision", v.published_at AS "PublishedAt", v.created_by AS "CreatedBy",
                   v.content_revision AS "ContentRevision", v.submitted_by AS "SubmittedBy", v.approved_revision AS "ApprovedRevision",
                   v.approved_by AS "ApprovedBy", v.effective_from AS "EffectiveFrom", v.effective_until AS "EffectiveUntil"
            FROM public.timetable_versions v
            JOIN public.semesters se ON se.id = v.semester_id
            JOIN public.academic_years y ON y.id = se.academic_year_id
            WHERE y.school_id = {school} AND (v.semester_id = CAST({semester} AS uuid) OR CAST({semester} AS uuid) IS NULL)
                  AND (v.id = CAST({id} AS uuid) OR CAST({id} AS uuid) IS NULL)
            ORDER BY v.version_no DESC
            """);

    private IQueryable<TimetableSlotRow> Slots(Guid school, Guid version) =>
        Db.Database.SqlQuery<TimetableSlotRow>($"""
            SELECT sl.id AS "Id", a.id AS "TeachingAssignmentId", c.id AS "ClassId", c.code AS "ClassCode",
                   st.id AS "StaffId", st.full_name AS "TeacherName", sub.name AS "SubjectName",
                   r.id AS "RoomId", r.code AS "RoomCode", p.id AS "PeriodId", sl.weekday AS "Weekday",
                   p.starts_at AS "StartsAt", p.ends_at AS "EndsAt"
            FROM public.timetable_slots sl
            JOIN public.timetable_versions v ON v.id = sl.version_id
            JOIN public.semesters se ON se.id = v.semester_id
            JOIN public.academic_years y ON y.id = se.academic_year_id
            JOIN public.teaching_assignments a ON a.id = sl.teaching_assignment_id AND a.semester_id = se.id
            JOIN public.classes c ON c.id = a.class_id AND c.academic_year_id = y.id
            JOIN public.staff st ON st.id = a.staff_id
            JOIN public.subjects sub ON sub.id = a.subject_id
            JOIN public.rooms r ON r.id = sl.room_id
            JOIN public.period_definitions p ON p.id = sl.period_id
            WHERE sl.version_id = {version} AND y.school_id = {school} AND c.school_id = {school}
              AND st.school_id = {school} AND sub.school_id = {school} AND r.school_id = {school} AND p.school_id = {school}
            ORDER BY sl.weekday, p.starts_at, c.code, sl.id
            """);

    private async Task<TimetableOptions> LoadOptions(Guid school, Guid semester, CancellationToken ct)
    {
        var assignments = await Db.Database.SqlQuery<TimetableAssignmentOption>($"""
            SELECT a.id AS "Id", c.id AS "ClassId", c.code AS "ClassCode", st.id AS "StaffId",
                   st.full_name AS "TeacherName", sub.id AS "SubjectId", sub.name AS "SubjectName", a.weekly_periods AS "WeeklyPeriods",
                   (SELECT count(*)::integer FROM public.class_enrollments e WHERE e.class_id = c.id AND e.status = 'active') AS "EnrolledCount"
            FROM public.teaching_assignments a
            JOIN public.semesters se ON se.id = a.semester_id
            JOIN public.academic_years y ON y.id = se.academic_year_id
            JOIN public.classes c ON c.id = a.class_id AND c.academic_year_id = y.id
            JOIN public.staff st ON st.id = a.staff_id
            JOIN public.subjects sub ON sub.id = a.subject_id
            WHERE se.id = {semester} AND y.school_id = {school} AND c.school_id = {school} AND c.status = 'active'
              AND st.school_id = {school} AND st.kind = 'teacher' AND st.employment_status = 'active'
              AND (st.started_on IS NULL OR st.started_on <= se.start_date)
              AND (st.ended_on IS NULL OR st.ended_on >= se.end_date)
              AND sub.school_id = {school} AND sub.is_active AND a.status = 'active'
            ORDER BY c.code, sub.code, st.full_name, a.id
            """).ToListAsync(ct);
        var rooms = await Db.Database.SqlQuery<TimetableRoomOption>($"""
            SELECT id AS "Id", code AS "Code", name AS "Name", capacity AS "Capacity"
            FROM public.rooms WHERE school_id = {school} AND status = 'available' ORDER BY code, id
            """).ToListAsync(ct);
        var periods = await Db.Database.SqlQuery<TimetablePeriodOption>($"""
            SELECT id AS "Id", period_no AS "Number", shift AS "Shift", starts_at AS "StartsAt", ends_at AS "EndsAt"
            FROM public.period_definitions WHERE school_id = {school} ORDER BY starts_at, ends_at, id
            """).ToListAsync(ct);
        return new TimetableOptions(assignments, rooms, periods);
    }

    private async Task<TimetableDetail> GetDetail(Guid school, TimetableRow version, CancellationToken ct) =>
        new(version, await Slots(school, version.Id).ToListAsync(ct));

    private static TimetableSlotRow? MakeSlot(TimetableOptions options, TimetableSlotInput input, Guid id)
    {
        var assignment = options.Assignments.SingleOrDefault(item => item.Id == input.TeachingAssignmentId);
        var room = options.Rooms.SingleOrDefault(item => item.Id == input.RoomId);
        var period = options.Periods.SingleOrDefault(item => item.Id == input.PeriodId);
        return assignment == null || room == null || period == null
            || room.Capacity is int capacity && assignment.EnrolledCount > capacity ? null
            : new TimetableSlotRow(id, assignment.Id, assignment.ClassId, assignment.ClassCode, assignment.StaffId,
                assignment.TeacherName, assignment.SubjectName, room.Id, room.Code, period.Id, input.Weekday, period.StartsAt, period.EndsAt);
    }

    private static List<TimetableConflict> FindConflicts(TimetableSlotRow candidate, IEnumerable<TimetableSlotRow> items)
    {
        var matches = new List<TimetableConflict>();
        foreach (var item in items.Where(item => item.Id != candidate.Id && item.Weekday == candidate.Weekday
            && item.StartsAt < candidate.EndsAt && candidate.StartsAt < item.EndsAt))
        {
            if (item.ClassId == candidate.ClassId)
                matches.Add(new("class", item.ClassCode, item.Weekday, item.StartsAt, item.EndsAt, item.Id));
            if (item.StaffId == candidate.StaffId)
                matches.Add(new("teacher", item.TeacherName, item.Weekday, item.StartsAt, item.EndsAt, item.Id));
            if (item.RoomId == candidate.RoomId)
                matches.Add(new("room", item.RoomCode, item.Weekday, item.StartsAt, item.EndsAt, item.Id));
        }
        return matches;
    }

    private static string Describe(IEnumerable<TimetableConflict> conflicts) => string.Join("; ", conflicts
        .Select(item => $"{item.Label} {item.StartsAt:HH\\:mm}–{item.EndsAt:HH\\:mm}").Distinct());

    private ObjectResult DraftChanged() => Problem(statusCode: 409, title: "Lịch đã thay đổi hoặc không còn là bản nháp. Hãy tải lại.");
    private ObjectResult InvalidResources() => Problem(statusCode: 400, title: "Chọn phân công, phòng và tiết còn hoạt động trong trường.");
}
