namespace SOMS.Application.Modules.Academic;

public record ScheduleOccurrence(string Kind, Guid Id, Guid? VersionId, long? ContentRevision, DateOnly OnDate,
    string Timezone, Guid SemesterId, Guid ClassId, string ClassCode, Guid SubjectId, string SubjectName, Guid? StaffId, string? TeacherName,
    Guid? OriginalStaffId, Guid? RoomId, string? RoomCode, DateTimeOffset StartsAt, DateTimeOffset EndsAt, string SubjectCode, short? PeriodNo, string? Shift, string SemesterName, string AcademicYearName);
public record StudentScheduleSchool(Guid Id, DateOnly Today);
public record ScheduleSchool(Guid Id, string Name, DateOnly Today);
public record ScheduleTeaching(Guid ClassId, Guid SubjectId, Guid SemesterId);
public record ScheduleEnrollment(Guid ClassId, DateOnly EnrolledOn, DateOnly? LeftOn);
