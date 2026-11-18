namespace SOMS.Domain.Entities;

public sealed class TeachingAssignment
{
    public Guid Id { get; set; }
    public Guid ClassId { get; set; }
    public Guid SubjectId { get; set; }
    public Guid StaffId { get; set; }
    public Guid SemesterId { get; set; }
    public short WeeklyPeriods { get; set; }
    public string Status { get; set; } = "draft";
    public uint Revision { get; set; }
}
