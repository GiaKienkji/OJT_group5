namespace SOMS.Application.Modules.Management.DTOs;

public class ExecutiveDashboardSummaryDto
{
    public SchoolKpisDto Kpis { get; set; } = new();
    public AttendanceMetricDto AttendanceToday { get; set; } = new();
    public FinanceSummaryDto Finance { get; set; } = new();
    public AcademicProgressDto AcademicProgress { get; set; } = new();
    public List<AlertItemDto> UrgentAlerts { get; set; } = new();
    public List<ApprovalRequestItemDto> PendingApprovals { get; set; } = new();
    public List<SchoolTaskDto> ActiveTasks { get; set; } = new();
}

public class SchoolKpisDto
{
    public int TotalStudents { get; set; }
    public int TotalTeachers { get; set; }
    public int TotalStaff { get; set; }
    public int TotalClasses { get; set; }
    public int PendingApprovalsCount { get; set; }
    public int ActiveTasksCount { get; set; }
    public int OverdueTasksCount { get; set; }
}

public class AttendanceMetricDto
{
    public double PresentRatePercent { get; set; } = 96.5;
    public int TotalAbsentToday { get; set; } = 14;
    public int ExcusedAbsent { get; set; } = 11;
    public int UnexcusedAbsent { get; set; } = 3;
}

public class FinanceSummaryDto
{
    public decimal TotalExpectedRevenue { get; set; } = 4850000000m; // 4.85 tỷ
    public decimal TotalCollectedRevenue { get; set; } = 4210000000m; // 4.21 tỷ
    public decimal OutstandingDebt { get; set; } = 640000000m;      // 640 triệu
    public double CollectionRatePercent { get; set; } = 86.8;
}

public class AcademicProgressDto
{
    public double TeachingScheduleCompletedPercent { get; set; } = 78.4;
    public double GradesEnteredPercent { get; set; } = 82.5;
    public int UpcomingExamsCount { get; set; } = 6;
}

public class AlertItemDto
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = "warning"; // "info", "warning", "danger"
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTimeOffset Timestamp { get; set; } = DateTimeOffset.UtcNow;
    public string? ActionUrl { get; set; }
}

