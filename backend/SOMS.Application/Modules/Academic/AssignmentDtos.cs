using System.ComponentModel.DataAnnotations;

namespace SOMS.Application.Modules.Academic;

public record TeacherOption(Guid Id, string Code, string FullName);
public record ClassSubjectRow(Guid SubjectId, string Code, string Name, short WeeklyPeriods);
public record ClassSubjectInput(Guid SubjectId, [Range(1, short.MaxValue)] short WeeklyPeriods);
public record CurriculumInput(Guid SemesterId, List<ClassSubjectInput> Subjects);
public record TeachingAssignmentRow(Guid Id, Guid ClassId, Guid SubjectId, Guid StaffId, Guid SemesterId,
    short WeeklyPeriods, string Status, uint Revision, string SubjectName, string TeacherName);
public record TeachingAssignmentInput(Guid ClassId, Guid SubjectId, Guid StaffId, Guid SemesterId,
    [Range(1, short.MaxValue)] short WeeklyPeriods, [Required] string Status, uint? Revision);
public record HomeroomInput(Guid? StaffId, [Required] uint? Revision);
public record HomeroomRow(Guid Id, Guid StaffId, string FullName, DateOnly StartsOn, DateOnly? EndsBefore);
public record HomeroomHistory(uint ClassRevision, IReadOnlyList<HomeroomRow> Items);
