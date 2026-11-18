using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using SOMS.Application.Common.Security;
using SOMS.Application.Modules.Academic;
using SOMS.Domain.Entities;
using SOMS.Infrastructure.Data;

namespace SOMS.Api.Controllers;

[Route("api/academic")]
public sealed class AcademicAssignmentsController(SomsDbContext db, TimeProvider clock) : AcademicControllerBase(db, clock)
{
    private const string Teaching = PermissionCodes.TeachingAssignmentsManage;
    private const string Homeroom = PermissionCodes.HomeroomAssign;
    private const string Subjects = PermissionCodes.SubjectsManage;

    [HttpGet("teachers")]
    public async Task<IActionResult> Teachers(Guid? schoolId, Guid? semesterId, bool homeroom = false,
        string? search = null, CancellationToken ct = default)
    {
        var (school, error) = await ResolveSchool(schoolId, homeroom ? Homeroom : Teaching, ct);
        if (error != null) return error;
        var today = await SchoolToday(school, ct);
        var semester = semesterId is Guid id ? await SchoolSemester(school, id, ct) : null;
        if (semesterId.HasValue && semester == null) return NotFound();
        var term = search?.Trim();
        if (term?.Length > 200) return Problem(statusCode: 400, title: "Từ khóa dài hơn 200 ký tự.");

        var teachers = EligibleTeachers(school, semester?.StartDate ?? today, semester?.EndDate ?? today);
        if (!string.IsNullOrEmpty(term))
        {
            var pattern = SearchPattern(term);
            teachers = teachers.Where(row => EF.Functions.ILike(EF.Functions.Collate(row.EmployeeCode, "und-x-icu"), pattern, "\\")
                || EF.Functions.ILike(EF.Functions.Collate(row.FullName, "und-x-icu"), pattern, "\\"));
        }
        return Ok(await teachers.OrderBy(row => row.FullName).ThenBy(row => row.Id).Take(100)
            .Select(row => new TeacherOption(row.Id, row.EmployeeCode, row.FullName)).ToListAsync(ct));
    }

    [HttpGet("classes/{classId:guid}/subjects")]
    public async Task<IActionResult> Curriculum(Guid classId, Guid semesterId, Guid? schoolId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchoolForAny(schoolId, [Subjects, Teaching], ct);
        if (error != null) return error;
        if (!await ClassSemesterExists(school, classId, semesterId, ct)) return NotFound();
        return Ok(await CurriculumRows(school, classId, semesterId).ToListAsync(ct));
    }

    [HttpPut("classes/{classId:guid}/subjects")]
    public async Task<IActionResult> ReplaceCurriculum(Guid classId, CurriculumInput input, Guid? schoolId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchool(schoolId, Subjects, ct);
        if (error != null) return error;
        if (input.Subjects.Count > 100 || input.Subjects.Select(row => row.SubjectId).Distinct().Count() != input.Subjects.Count)
            return Problem(statusCode: 400, title: "Chọn tối đa 100 môn và mỗi môn chỉ xuất hiện một lần.");

        return await InTransaction(async () =>
        {
            if (await LockClasses(school, [classId], ct) == 0 || !await ClassSemesterExists(school, classId, input.SemesterId, ct))
                return NotFound();
            var target = await Db.Set<SchoolClass>().SingleAsync(row => row.Id == classId, ct);
            if (target.Status != "active") return Problem(statusCode: 409, title: "Lớp đã được lưu trữ.");

            var current = await Db.Set<ClassSubject>().Where(row => row.ClassId == classId && row.SemesterId == input.SemesterId)
                .ToDictionaryAsync(row => row.SubjectId, ct);
            var ids = input.Subjects.Select(row => row.SubjectId).ToArray();
            var available = await Db.Set<Subject>().Where(row => row.SchoolId == school && ids.Contains(row.Id))
                .ToDictionaryAsync(row => row.Id, ct);
            if (input.Subjects.Any(row => !available.TryGetValue(row.SubjectId, out var subject) ||
                !subject.IsActive && (!current.TryGetValue(row.SubjectId, out var old) || old.WeeklyPeriods != row.WeeklyPeriods)))
                return Problem(statusCode: 400, title: "Chọn môn đang hoạt động thuộc trường.");

            var active = await Db.Set<TeachingAssignment>().Where(row => row.ClassId == classId
                && row.SemesterId == input.SemesterId && row.Status == "active")
                .GroupBy(row => row.SubjectId).Select(group => new { SubjectId = group.Key, Periods = group.Sum(row => row.WeeklyPeriods) })
                .ToDictionaryAsync(row => row.SubjectId, row => row.Periods, ct);
            if (current.Keys.Any(id => active.ContainsKey(id) && !ids.Contains(id))
                || input.Subjects.Any(row => active.GetValueOrDefault(row.SubjectId) > row.WeeklyPeriods))
                return Problem(statusCode: 409, title: "Chương trình phải giữ đủ số tiết đã phân công.");

            Db.RemoveRange(current.Values.Where(row => !ids.Contains(row.SubjectId)));
            foreach (var item in input.Subjects)
            {
                if (current.TryGetValue(item.SubjectId, out var existing))
                    existing.WeeklyPeriods = item.WeeklyPeriods;
                else
                    Db.Add(new ClassSubject
                    {
                        ClassId = classId, SemesterId = input.SemesterId, SubjectId = item.SubjectId, WeeklyPeriods = item.WeeklyPeriods
                    });
            }
            await Db.SaveChangesAsync(ct);
            return Ok(await CurriculumRows(school, classId, input.SemesterId).ToListAsync(ct));
        }, ct);
    }

    [HttpGet("teaching-assignments")]
    public async Task<IActionResult> Assignments(Guid classId, Guid semesterId, Guid? schoolId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchool(schoolId, Teaching, ct);
        if (error != null) return error;
        if (!await ClassSemesterExists(school, classId, semesterId, ct)) return NotFound();
        return Ok(await AssignmentRows(school, Db.Set<TeachingAssignment>()
            .Where(row => row.ClassId == classId && row.SemesterId == semesterId)).ToListAsync(ct));
    }

    [HttpPost("teaching-assignments")]
    public Task<IActionResult> Create(TeachingAssignmentInput input, Guid? schoolId, CancellationToken ct) =>
        SaveAssignment(null, input, schoolId, ct);

    [HttpPut("teaching-assignments/{id:guid}")]
    public Task<IActionResult> Update(Guid id, TeachingAssignmentInput input, Guid? schoolId, CancellationToken ct) =>
        SaveAssignment(id, input, schoolId, ct);

    [HttpPost("teaching-assignments/{id:guid}/archive")]
    public async Task<IActionResult> Archive(Guid id, RevisionInput input, Guid? schoolId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchool(schoolId, Teaching, ct);
        if (error != null) return error;
        var old = await ScopedAssignments(school).AsNoTracking().SingleOrDefaultAsync(row => row.Id == id, ct);
        if (old == null) return NotFound();
        return await InTransaction(async () =>
        {
            await LockSchoolSchedule(school, ct);
            if (await LockClasses(school, [old.ClassId], ct) == 0) return NotFound();
            var assignment = await ScopedAssignments(school).SingleOrDefaultAsync(row => row.Id == id, ct);
            if (assignment == null) return NotFound();
            if (assignment.Revision != input.Revision || await HasSlots(id, ct))
                return Problem(statusCode: 409, title: "Phân công đã thay đổi hoặc đang được dùng trong thời khóa biểu.");
            assignment.Status = "inactive";
            await Db.SaveChangesAsync(ct);
            return Ok(await AssignmentRows(school, Db.Set<TeachingAssignment>().Where(row => row.Id == id)).SingleAsync(ct));
        }, ct);
    }

    private async Task<IActionResult> SaveAssignment(Guid? id, TeachingAssignmentInput input, Guid? schoolId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchool(schoolId, Teaching, ct);
        if (error != null) return error;
        if (input.Status is not ("draft" or "active"))
            return Problem(statusCode: 400, title: "Chọn trạng thái nháp hoặc hoạt động.");

        return await InTransaction(async () =>
        {
            await LockSchoolSchedule(school, ct);
            if (await LockClasses(school, [input.ClassId], ct) == 0) return NotFound();
            var row = id.HasValue
                ? await ScopedAssignments(school).SingleOrDefaultAsync(item => item.Id == id, ct)
                : new TeachingAssignment { Id = Guid.NewGuid(), ClassId = input.ClassId };
            if (row == null) return NotFound();
            if (id.HasValue && (row.ClassId != input.ClassId || row.SemesterId != input.SemesterId))
                return Problem(statusCode: 400, title: "Lớp và học kỳ của phân công đã tạo không thể thay đổi.");
            if (id.HasValue && (row.Revision != input.Revision || await HasSlots(row.Id, ct)))
                return Problem(statusCode: 409, title: "Phân công đã thay đổi hoặc đang được dùng trong thời khóa biểu.");

            var semester = await SchoolSemester(school, input.SemesterId, ct);
            var schoolClass = await Db.Set<SchoolClass>().SingleAsync(item => item.Id == input.ClassId, ct);
            if (semester == null || semester.AcademicYearId != schoolClass.AcademicYearId)
                return Problem(statusCode: 400, title: "Chọn học kỳ thuộc năm học của lớp.");
            if (schoolClass.Status != "active" || semester.Status == "closed")
                return Problem(statusCode: 409, title: "Lớp hoặc học kỳ đã đóng.");

            var curriculum = await Db.Set<ClassSubject>().SingleOrDefaultAsync(item => item.ClassId == input.ClassId
                && item.SemesterId == input.SemesterId && item.SubjectId == input.SubjectId, ct);
            var subject = await Db.Database.SqlQuery<Guid>($"""
                SELECT id FROM public.subjects
                WHERE id = {input.SubjectId} AND school_id = {school} AND is_active FOR SHARE
                """).ToListAsync(ct);
            if (curriculum == null || subject.Count == 0)
                return Problem(statusCode: 400, title: "Chọn môn đang hoạt động trong chương trình lớp.");
            if (!await EligibleTeachers(school, semester.StartDate, semester.EndDate).AnyAsync(item => item.Id == input.StaffId, ct))
                return Problem(statusCode: 400, title: "Giáo viên phải thuộc trường và còn hiệu lực trong học kỳ.");

            if (input.Status == "active")
            {
                var allocated = await Db.Set<TeachingAssignment>().Where(item => item.Id != row.Id && item.ClassId == input.ClassId
                    && item.SemesterId == input.SemesterId && item.SubjectId == input.SubjectId && item.Status == "active")
                    .SumAsync(item => (int)item.WeeklyPeriods, ct);
                if (allocated + input.WeeklyPeriods > curriculum.WeeklyPeriods)
                    return Problem(statusCode: 409, title: "Số tiết phân công vượt số tiết trong chương trình lớp.");
            }

            row.SemesterId = input.SemesterId;
            row.SubjectId = input.SubjectId;
            row.StaffId = input.StaffId;
            row.WeeklyPeriods = input.WeeklyPeriods;
            row.Status = input.Status;
            if (!id.HasValue) Db.Add(row);
            try
            {
                await Db.SaveChangesAsync(ct);
            }
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
            {
                return Problem(statusCode: 409, title: "Giáo viên đã có phân công cho lớp, môn và học kỳ này.");
            }

            var result = await AssignmentRows(school, Db.Set<TeachingAssignment>().Where(item => item.Id == row.Id)).SingleAsync(ct);
            return id.HasValue ? Ok(result) : CreatedAtAction(nameof(Assignments),
                new { classId = input.ClassId, semesterId = input.SemesterId, schoolId = school }, result);
        }, ct);
    }

    [HttpGet("classes/{classId:guid}/homeroom-assignments")]
    public async Task<IActionResult> HomeroomAssignments(Guid classId, Guid? schoolId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchool(schoolId, Homeroom, ct);
        if (error != null) return error;
        var row = await Db.Set<SchoolClass>().SingleOrDefaultAsync(item => item.Id == classId && item.SchoolId == school, ct);
        return row == null ? NotFound() : Ok(await ReadHomeroom(row, ct));
    }

    [HttpPost("classes/{classId:guid}/homeroom-assignments")]
    public async Task<IActionResult> SetHomeroom(Guid classId, HomeroomInput input, Guid? schoolId, CancellationToken ct)
    {
        var (school, error) = await ResolveSchool(schoolId, Homeroom, ct);
        if (error != null) return error;
        return await InTransaction(async () =>
        {
            if (await LockClasses(school, [classId], ct) == 0) return NotFound();
            var row = await Db.Set<SchoolClass>().SingleAsync(item => item.Id == classId, ct);
            if (row.Revision != input.Revision || row.Status != "active")
                return Problem(statusCode: 409, title: "Lớp đã thay đổi hoặc đã lưu trữ.");
            if (row.HomeroomStaffId == input.StaffId)
                return Ok(await ReadHomeroom(row, ct));

            var today = await SchoolToday(school, ct);
            if (input.StaffId is Guid teacher && !await EligibleTeachers(school, today, today).AnyAsync(item => item.Id == teacher, ct))
                return Problem(statusCode: 400, title: "Chọn giáo viên đang làm việc tại trường.");
            var previous = await Db.Set<HomeroomAssignment>().SingleOrDefaultAsync(
                item => item.ClassId == classId && item.EndsBefore == null, ct);
            if (previous != null)
            {
                if (previous.StartsOn > today)
                    return Problem(statusCode: 409, title: "Lịch sử chủ nhiệm có ngày hiệu lực trong tương lai.");
                previous.EndsBefore = today;
                await Db.SaveChangesAsync(ct);
            }

            if (input.StaffId is Guid staffId)
                Db.Add(new HomeroomAssignment { Id = Guid.NewGuid(), ClassId = classId, StaffId = staffId, StartsOn = today });
            row.HomeroomStaffId = input.StaffId;
            await Db.SaveChangesAsync(ct);
            return Ok(await ReadHomeroom(row, ct));
        }, ct);
    }

    private IQueryable<AcademicStaff> EligibleTeachers(Guid school, DateOnly start, DateOnly end) =>
        Db.Set<AcademicStaff>().Where(row => row.SchoolId == school && row.Kind == "teacher" && row.EmploymentStatus == "active"
            && (row.StartedOn == null || row.StartedOn <= start) && (row.EndedOn == null || row.EndedOn >= end));

    private Task<Semester?> SchoolSemester(Guid school, Guid semesterId, CancellationToken ct) =>
        (from semester in Db.Set<Semester>()
         join year in Db.Set<AcademicYear>() on semester.AcademicYearId equals year.Id
         where semester.Id == semesterId && year.SchoolId == school
         select semester).SingleOrDefaultAsync(ct);

    private Task<bool> ClassSemesterExists(Guid school, Guid classId, Guid semesterId, CancellationToken ct) =>
        (from row in Db.Set<SchoolClass>()
         join year in Db.Set<AcademicYear>() on row.AcademicYearId equals year.Id
         join semester in Db.Set<Semester>() on year.Id equals semester.AcademicYearId
         where row.Id == classId && row.SchoolId == school && year.SchoolId == school && semester.Id == semesterId
         select row.Id).AnyAsync(ct);

    private IQueryable<ClassSubjectRow> CurriculumRows(Guid school, Guid classId, Guid semesterId) =>
        from row in Db.Set<ClassSubject>()
        join subject in Db.Set<Subject>() on row.SubjectId equals subject.Id
        where row.ClassId == classId && row.SemesterId == semesterId && subject.SchoolId == school
        orderby subject.Code
        select new ClassSubjectRow(subject.Id, subject.Code, subject.Name, row.WeeklyPeriods);

    private IQueryable<TeachingAssignment> ScopedAssignments(Guid school) =>
        from row in Db.Set<TeachingAssignment>()
        join schoolClass in Db.Set<SchoolClass>() on row.ClassId equals schoolClass.Id
        join year in Db.Set<AcademicYear>() on schoolClass.AcademicYearId equals year.Id
        join semester in Db.Set<Semester>() on row.SemesterId equals semester.Id
        join subject in Db.Set<Subject>() on row.SubjectId equals subject.Id
        join teacher in Db.Set<AcademicStaff>() on row.StaffId equals teacher.Id
        where schoolClass.SchoolId == school && year.SchoolId == school && semester.AcademicYearId == year.Id
            && subject.SchoolId == school && teacher.SchoolId == school
        select row;

    private IQueryable<TeachingAssignmentRow> AssignmentRows(Guid school, IQueryable<TeachingAssignment> assignments) =>
        from row in assignments
        join scoped in ScopedAssignments(school) on row.Id equals scoped.Id
        join subject in Db.Set<Subject>() on row.SubjectId equals subject.Id
        join teacher in Db.Set<AcademicStaff>() on row.StaffId equals teacher.Id
        orderby subject.Code, teacher.FullName, row.Id
        select new TeachingAssignmentRow(row.Id, row.ClassId, row.SubjectId, row.StaffId, row.SemesterId,
            row.WeeklyPeriods, row.Status, row.Revision, subject.Name, teacher.FullName);

    private async Task<bool> HasSlots(Guid assignment, CancellationToken ct) =>
        (await Db.Database.SqlQuery<bool>($"""
            SELECT EXISTS (SELECT 1 FROM public.timetable_slots WHERE teaching_assignment_id = {assignment})
            """).ToListAsync(ct)).Single();

    private async Task<HomeroomHistory> ReadHomeroom(SchoolClass row, CancellationToken ct)
    {
        var items = await (from history in Db.Set<HomeroomAssignment>()
                           join teacher in Db.Set<AcademicStaff>() on history.StaffId equals teacher.Id
                           where history.ClassId == row.Id && teacher.SchoolId == row.SchoolId
                           orderby history.EndsBefore == null descending, history.StartsOn descending, history.Id
                           select new HomeroomRow(history.Id, teacher.Id, teacher.FullName, history.StartsOn, history.EndsBefore))
            .ToListAsync(ct);
        return new HomeroomHistory(row.Revision, items);
    }
}
