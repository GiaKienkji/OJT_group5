namespace SOMS.Domain.Entities;

public class Profile
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? AvatarPath { get; set; }
    public string Status { get; set; } = "active";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<SchoolMembership> SchoolMemberships { get; set; } = new List<SchoolMembership>();
    public ICollection<UserSession> UserSessions { get; set; } = new List<UserSession>();
}
