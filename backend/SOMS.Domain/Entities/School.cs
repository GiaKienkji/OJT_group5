namespace SOMS.Domain.Entities;

public class School
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Level { get; set; } = "combined";
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string Status { get; set; } = "active";

    public ICollection<SchoolMembership> Memberships { get; set; } = new List<SchoolMembership>();
}
