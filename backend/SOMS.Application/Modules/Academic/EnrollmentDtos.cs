using System.ComponentModel.DataAnnotations;

namespace SOMS.Application.Modules.Academic;

public record RevisionInput([Required] uint? Revision);
public record EnrollmentInput(Guid StudentId);
public record TransferInput(Guid ClassId);
public record EnrollmentRow(Guid Id, Guid StudentId, string StudentCode, string FullName,
    DateOnly EnrolledOn, DateOnly? LeftOn, string Status);
public record ClassRoster(IReadOnlyList<EnrollmentRow> Items, int ActiveCount);
public record EnrollmentStudent(Guid Id, string Code, string Name);
public record TransferClass(Guid Id, string Code, string Name);
