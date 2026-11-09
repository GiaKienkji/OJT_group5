namespace SOMS.Domain.Entities;

public class AuditLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? SchoolId { get; set; }
    public Guid? UserId { get; set; }
    public string Action { get; set; } = string.Empty; // "LOGIN", "LOGOUT", "CREATE_USER", "UPDATE_ROLE", "APPROVE_REQUEST", "CONFIG_CHANGE", etc.
    public string? EntityName { get; set; } // "User", "ApprovalRequest", "AcademicYear", etc.
    public string? EntityId { get; set; }
    public string? Details { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Profile? User { get; set; }
    public School? School { get; set; }
}

