namespace SOMS.Domain.Entities;

public class SchoolTask
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SchoolId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = "general"; // "academic", "facility", "administrative", "event", "general"
    public Guid CreatedBy { get; set; }
    public string Priority { get; set; } = "medium"; // "low", "medium", "high", "urgent"
    public string Status { get; set; } = "not_started"; // "not_started", "in_progress", "completed", "cancelled", "overdue"
    public DateTimeOffset? DueDate { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public School School { get; set; } = null!;
    public Profile Creator { get; set; } = null!;
    public ICollection<TaskAssignment> Assignments { get; set; } = new List<TaskAssignment>();
}

public class TaskAssignment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TaskId { get; set; }
    public Guid AssigneeId { get; set; }
    public string RoleInTask { get; set; } = "owner"; // "owner", "participant"
    public int ProgressPercent { get; set; } = 0; // 0 - 100
    public string? Note { get; set; }
    public DateTimeOffset AssignedAt { get; set; } = DateTimeOffset.UtcNow;

    public SchoolTask Task { get; set; } = null!;
    public Profile Assignee { get; set; } = null!;
}

