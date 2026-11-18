namespace SOMS.Domain.Entities;

public class GradeLevel
{
    public Guid Id { get; set; }
    public Guid SchoolId { get; set; }
    public int GradeNumber { get; set; }
}
