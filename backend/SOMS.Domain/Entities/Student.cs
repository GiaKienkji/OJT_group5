namespace SOMS.Domain.Entities;

public class Student
{
    public Guid Id { get; set; }
    public Guid SchoolId { get; set; }
    public Guid? UserId { get; set; }
    public string StudentCode { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public DateOnly? DateOfBirth { get; set; }
    public DateOnly? AdmittedOn { get; set; }
    public string Status { get; set; } = "enrolled";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public uint Revision { get; set; }
}
