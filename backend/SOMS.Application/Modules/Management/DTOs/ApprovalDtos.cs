namespace SOMS.Application.Modules.Management.DTOs;

public class ApprovalRequestItemDto
{
    public Guid Id { get; set; }
    public string RequestCode { get; set; } = string.Empty;
    public string RequestType { get; set; } = string.Empty; // "leave_teacher", "leave_student", "timetable_change", "substitute_teaching", "facility_purchase", "facility_repair"
    public string RequestTypeNameVi { get; set; } = string.Empty;
    public Guid RequesterId { get; set; }
    public string RequesterName { get; set; } = string.Empty;
    public string? RequesterRole { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? PayloadJson { get; set; }
    public string Status { get; set; } = "pending"; // "pending", "approved", "rejected", "cancelled"
    public string Priority { get; set; } = "medium";
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? FinalDecisionAt { get; set; }
    public List<ApprovalHistoryItemDto> Histories { get; set; } = new();
}

public class ApprovalHistoryItemDto
{
    public Guid Id { get; set; }
    public string Action { get; set; } = string.Empty;
    public string ActorName { get; set; } = string.Empty;
    public string? Note { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public class CreateApprovalRequest
{
    public Guid SchoolId { get; set; }
    public string RequestType { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? PayloadJson { get; set; }
    public string Priority { get; set; } = "medium";
}

public class ApprovalDecisionRequest
{
    public string Decision { get; set; } = "approved"; // "approved" or "rejected"
    public string? Note { get; set; }
}

public class ApprovalFilter
{
    public string? Status { get; set; }
    public string? RequestType { get; set; }
    public string? Priority { get; set; }
    public Guid? SchoolId { get; set; }
    public Guid? RequesterId { get; set; }
}

