namespace SOMS.Domain.Entities;

public sealed class ClassEnrollment
{
    public Guid Id { get; set; }
    public Guid ClassId { get; set; }
    public Guid StudentId { get; set; }
    public DateOnly EnrolledOn { get; set; }
    public DateOnly? LeftOn { get; set; }
    public string Status { get; set; } = "active";
}
