namespace SOMS.Domain.Entities;

public sealed class Subject
{
    public Guid Id { get; set; }
    public Guid SchoolId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public uint Revision { get; set; }
}
