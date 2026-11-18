namespace SOMS.Domain.Entities;

public sealed class AcademicStaff
{
    public Guid Id { get; set; }
    public Guid SchoolId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Kind { get; set; } = string.Empty;
    public string EmploymentStatus { get; set; } = string.Empty;
    public DateOnly? StartedOn { get; set; }
    public DateOnly? EndedOn { get; set; }
}
