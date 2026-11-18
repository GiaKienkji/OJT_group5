using System.ComponentModel.DataAnnotations;

namespace SOMS.Application.Modules.Academic;

public record SubjectRow(Guid Id, string Code, string Name, bool IsActive, uint Revision);
public record SubjectPage(IReadOnlyList<SubjectRow> Items, int Total, int Page, int PageSize);
public record SubjectInput([Required, StringLength(50)] string Code, [Required, StringLength(200)] string Name,
    bool IsActive = true, uint? Revision = null);
