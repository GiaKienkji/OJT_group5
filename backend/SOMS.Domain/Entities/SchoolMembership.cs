namespace SOMS.Domain.Entities;

public class SchoolMembership
{
    public Guid Id { get; set; }
    public Guid SchoolId { get; set; }
    public Guid UserId { get; set; }
    public string RoleCode { get; set; } = string.Empty;
    public string Status { get; set; } = "active";
    public Guid? GrantedBy { get; set; }
    public DateOnly? ValidFrom { get; set; }
    public DateOnly? ValidTo { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public School School { get; set; } = null!;
    public Profile Profile { get; set; } = null!;
    public Role Role { get; set; } = null!;
}
