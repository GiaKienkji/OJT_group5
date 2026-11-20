using SOMS.Application.Common.Models;

namespace SOMS.Application.Modules.Finance.DTOs;

public sealed record FeeCategoryInput(string Code, string Name, bool IsActive = true);
public sealed record FeeCampaignInput(string Name, Guid AcademicYearId, Guid? SemesterId, DateOnly? DueDate, string Status = "draft");
public sealed record FeeRuleInput(Guid FeeCategoryId, Guid? GradeLevelId, Guid? ClassId, decimal Amount, DateOnly? DueDate);
public sealed record ApplyFeesInput(List<Guid> StudentIds);
public sealed record ChargeQuery(Guid? CampaignId = null, Guid? StudentId = null, Guid? ClassId = null, Guid? GradeLevelId = null, string? Status = null, bool? Overdue = null, Guid? AcademicYearId = null, Guid? SemesterId = null, DateOnly? FromDate = null, DateOnly? ToDate = null, string ReportType = "collection");
public sealed record ExemptionInput(decimal Amount, string Reason);
public sealed record NoticeInput(string Title, string Message);
public sealed record ReminderInput(string Channel, string? Message, Guid RequestKey);
public sealed record PaymentAllocationInput(Guid ChargeId, decimal Amount);
public sealed record RecordPaymentInput(Guid StudentId, decimal Amount, string PaymentMethod, DateTimeOffset? PaidAt, List<PaymentAllocationInput> Allocations);
public sealed record BankTransactionInput(string TransactionId, string Reference, decimal Amount, DateTimeOffset TransactionAt, string? Description);
public sealed record BankImportInput(string Source, List<BankTransactionInput> Transactions);
public sealed record BankMatchInput(Guid BankTransactionId, Guid PaymentId);
public sealed record ReconcileInput(List<BankMatchInput> Matches);
public sealed record AdjustmentInput(Guid PaymentId, string Type, decimal Amount, string Reason);
public sealed record FinanceExportInput(string ReportType, string Format, ChargeQuery Filters);
