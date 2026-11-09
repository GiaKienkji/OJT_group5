namespace SOMS.Application.Modules.Admin.DTOs;

public class AuditLogItemDto
{
    public Guid Id { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? EntityName { get; set; }
    public string? EntityId { get; set; }
    public string? Details { get; set; }
    public string? IpAddress { get; set; }
    public string? UserFullName { get; set; }
    public string? SchoolName { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public class UserSessionItemDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string UserFullName { get; set; } = string.Empty;
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public bool IsRevoked { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
}

public class SystemHealthStatusDto
{
    public string Status { get; set; } = "Healthy";
    public DateTime ServerTime { get; set; } = DateTime.UtcNow;
    public int ActiveUsersCount { get; set; }
    public int TotalUsersCount { get; set; }
    public int TotalSchoolsCount { get; set; }
    public string DatabaseConnection { get; set; } = "Connected";
}

