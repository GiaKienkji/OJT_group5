namespace SOMS.Domain.Entities;

public class Semester
{
    public Guid Id { get; set; }
    public Guid AcademicYearId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Ordinal { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string Status { get; set; } = string.Empty;
}
