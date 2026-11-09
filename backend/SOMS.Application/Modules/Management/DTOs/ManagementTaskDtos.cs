namespace SOMS.Application.Modules.Management.DTOs;

public class SchoolTaskDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = "general";
    public string CategoryNameVi { get; set; } = "Chung";
    public Guid CreatedBy { get; set; }
    public string CreatorName { get; set; } = string.Empty;
    public string Priority { get; set; } = "medium";
    public string Status { get; set; } = "not_started";
    public DateTimeOffset? DueDate { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public List<TaskAssignmentDto> Assignments { get; set; } = new();
}

public class TaskAssignmentDto
{
    public Guid Id { get; set; }
    public Guid AssigneeId { get; set; }
    public string AssigneeName { get; set; } = string.Empty;
    public string RoleInTask { get; set; } = "owner";
    public int ProgressPercent { get; set; }
    public string? Note { get; set; }
    public DateTimeOffset AssignedAt { get; set; }
}

public class CreateTaskRequest
{
    public Guid SchoolId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = "general";
    public string Priority { get; set; } = "medium";
    public DateTimeOffset? DueDate { get; set; }
    public List<Guid> AssigneeIds { get; set; } = new();
}

public class UpdateTaskProgressRequest
{
    public int ProgressPercent { get; set; }
    public string? Status { get; set; }
    public string? Note { get; set; }
}

