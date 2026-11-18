using System.ComponentModel.DataAnnotations;

namespace SOMS.Application.Modules.Academic;

public record StudentInput(
    [Required, StringLength(50)] string StudentCode,
    [Required, StringLength(200)] string FullName,
    DateOnly? DateOfBirth, DateOnly? AdmittedOn, uint? Revision);

public record StudentRow(Guid Id, string StudentCode, string FullName, DateOnly? DateOfBirth,
    DateOnly? AdmittedOn, string Status, uint Revision, Guid? UserId);
public record StudentProfileOption(Guid Id, string FullName);
public record StudentProfileLink(Guid? UserId, [Required] uint? Revision);

public record StudentPage(IReadOnlyList<StudentRow> Items, int Total, int Page, int PageSize);
