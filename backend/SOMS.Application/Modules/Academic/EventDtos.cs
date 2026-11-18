using System.ComponentModel.DataAnnotations;

namespace SOMS.Application.Modules.Academic;

public record ExamInput(Guid ClassId, Guid SubjectId, Guid SemesterId, DateTimeOffset StartsAt,
    DateTimeOffset EndsAt, Guid? RoomId, uint? Revision);
public record ExamRow(Guid Id, Guid ClassId, string ClassCode, Guid SubjectId, string SubjectName, Guid SemesterId,
    DateTimeOffset StartsAt, DateTimeOffset EndsAt, Guid? RoomId, string? RoomCode, string Status, uint Revision);
public record ExamClass(Guid Id, string Code, string Name);
public record ExamSubject(Guid Id, string Code, string Name);
public record ExamOptions(IReadOnlyList<ExamClass> Classes, IReadOnlyList<ExamSubject> Subjects,
    IReadOnlyList<TimetableRoomOption> Rooms, string Timezone);
public record SubstitutionInput(Guid SlotId, DateOnly OnDate, Guid StaffId);
public record SubstitutionRow(Guid Id, Guid SlotId, DateOnly OnDate, Guid StaffId, string TeacherName,
    string ClassCode, string SubjectName, string Status);
