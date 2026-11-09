namespace SOMS.Domain.Entities;

public class ApprovalRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SchoolId { get; set; }
    public string RequestCode { get; set; } = string.Empty; // e.g. "REQ-202611-0001"
    public string RequestType { get; set; } = string.Empty; // "leave_teacher", "leave_student", "timetable_change", "substitute_teaching", "facility_purchase", "facility_repair", "grade_change"
    public Guid RequesterId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? PayloadJson { get; set; } // Dữ liệu chi tiết đặc thù cho từng loại đơn
    public string Status { get; set; } = "pending"; // "pending", "approved", "rejected", "cancelled"
    public string Priority { get; set; } = "medium"; // "low", "medium", "high", "urgent"
    public Guid? CurrentApproverId { get; set; }
    public DateTimeOffset? FinalDecisionAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public School School { get; set; } = null!;
    public Profile Requester { get; set; } = null!;
    public Profile? CurrentApprover { get; set; }
    public ICollection<ApprovalHistory> ApprovalHistories { get; set; } = new List<ApprovalHistory>();
}

public class ApprovalHistory
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RequestId { get; set; }
    public string Action { get; set; } = string.Empty; // "created", "approved", "rejected", "forwarded", "cancelled"
    public Guid PerformedBy { get; set; }
    public string? Note { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ApprovalRequest Request { get; set; } = null!;
    public Profile Actor { get; set; } = null!;
}

