namespace SOMS.Domain.Entities;

public sealed class ClassSubject
{
    public Guid ClassId { get; set; }
    public Guid SubjectId { get; set; }
    public Guid SemesterId { get; set; }
    public short WeeklyPeriods { get; set; }
}
