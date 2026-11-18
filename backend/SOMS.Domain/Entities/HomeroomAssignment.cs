namespace SOMS.Domain.Entities;

public sealed class HomeroomAssignment
{
    public Guid Id { get; set; }
    public Guid ClassId { get; set; }
    public Guid StaffId { get; set; }
    public DateOnly StartsOn { get; set; }
    public DateOnly? EndsBefore { get; set; }
}
