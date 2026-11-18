using System.ComponentModel.DataAnnotations;

namespace SOMS.Application.Modules.Academic;

public record AcademicSchool(Guid Id, string Name);
public record AcademicYearOption(Guid Id, string Name, string Status);
public record SemesterOption(Guid Id, Guid AcademicYearId, string Name, int Ordinal, DateOnly StartDate, DateOnly EndDate, string Status);
public record GradeLevelOption(Guid Id, int GradeNumber);
public record ClassRow(Guid Id, string Code, string Name, Guid AcademicYearId, string AcademicYear,
    Guid GradeLevelId, int GradeNumber, int? Capacity, string Status, uint Revision);
public record ClassPage(IReadOnlyList<ClassRow> Items, int Total, int Page, int PageSize);

public record ClassInput(
    [Required, StringLength(50)] string Code,
    [Required, StringLength(200)] string Name,
    Guid AcademicYearId,
    Guid GradeLevelId,
    [Range(1, int.MaxValue)] int? Capacity,
    uint? Revision);
