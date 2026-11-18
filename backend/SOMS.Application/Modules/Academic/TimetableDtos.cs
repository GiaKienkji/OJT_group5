using System.ComponentModel.DataAnnotations;

namespace SOMS.Application.Modules.Academic;

public record TimetableRow(Guid Id, Guid SemesterId, int VersionNo, string Status, uint Revision, DateTimeOffset? PublishedAt,
    long ContentRevision, Guid? CreatedBy, Guid? SubmittedBy, long? ApprovedRevision, Guid? ApprovedBy,
    DateOnly? EffectiveFrom, DateOnly? EffectiveUntil);
public record TimetableSlotRow(Guid Id, Guid TeachingAssignmentId, Guid ClassId, string ClassCode, Guid StaffId, string TeacherName,
    string SubjectName, Guid RoomId, string RoomCode, Guid PeriodId, short Weekday, TimeOnly StartsAt, TimeOnly EndsAt);
public record TimetableAssignmentOption(Guid Id, Guid ClassId, string ClassCode, Guid StaffId, string TeacherName, Guid SubjectId, string SubjectName, short WeeklyPeriods, int EnrolledCount);
public record TimetableRoomOption(Guid Id, string Code, string? Name, int? Capacity);
public record TimetablePeriodOption(Guid Id, short Number, string Shift, TimeOnly StartsAt, TimeOnly EndsAt);
public record TimetableDetail(TimetableRow Version, IReadOnlyList<TimetableSlotRow> Items);
public record TimetableOptions(IReadOnlyList<TimetableAssignmentOption> Assignments, IReadOnlyList<TimetableRoomOption> Rooms,
    IReadOnlyList<TimetablePeriodOption> Periods);
public record TimetableInput(Guid SemesterId);
public record TimetableSlotInput(Guid TeachingAssignmentId, Guid RoomId, Guid PeriodId,
    [Range(1, 7)] short Weekday, [Required] uint? Revision);
public record TimetableConflict(string Resource, string Label, short Weekday, TimeOnly StartsAt, TimeOnly EndsAt, Guid SlotId);
public record TimetableCheck(bool Valid, IReadOnlyList<TimetableConflict> Conflicts, IReadOnlyList<string>? Errors = null);
public record TimetablePublishInput([Required] uint? Revision, DateOnly? EffectiveFrom = null);
public record TimetableSuggestion(Guid TeachingAssignmentId, string TeacherName, Guid RoomId, string RoomCode,
    Guid PeriodId, short Weekday, TimeOnly StartsAt, TimeOnly EndsAt);
