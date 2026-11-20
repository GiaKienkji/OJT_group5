using SOMS.Application.Common.Models;
using SOMS.Application.Modules.Finance.DTOs;

namespace SOMS.Application.Modules.Finance.Interfaces;

public interface IFinanceService
{
    Task<object> Profile(ProfileUpdate? input, CancellationToken ct);
    Task<object> Lookups(LookupQuery query, CancellationToken ct);
    Task<object> Dashboard(CancellationToken ct);
    Task<object> Categories(Guid? id, FeeCategoryInput? input, CancellationToken ct);
    Task<object> Campaigns(Guid? id, FeeCampaignInput? input, CancellationToken ct);
    Task<object> Rules(Guid campaignId, List<FeeRuleInput>? input, CancellationToken ct);
    Task<object> Apply(Guid campaignId, ApplyFeesInput input, CancellationToken ct);
    Task<object> Charges(ChargeQuery query, bool debtsOnly, CancellationToken ct);
    Task<object> Exemptions(Guid chargeId, ExemptionInput? input, CancellationToken ct);
    Task<object> DecideExemption(Guid id, DecisionInput input, CancellationToken ct);
    Task<object> Notices(Guid campaignId, NoticeInput? input, CancellationToken ct);
    Task<object> SendNotice(Guid id, CancellationToken ct);
    Task<object> Reminder(Guid chargeId, ReminderInput input, CancellationToken ct);
    Task<object> Payments(Guid? studentId, string? status, CancellationToken ct);
    Task<object> RecordPayment(RecordPaymentInput input, CancellationToken ct);
    Task<object> Verify(Guid id, DecisionInput input, CancellationToken ct);
    Task<object> BankTransactions(string? status, CancellationToken ct);
    Task<object> Import(BankImportInput input, CancellationToken ct);
    Task<object> Reconcile(ReconcileInput input, CancellationToken ct);
    Task<object> Adjustments(AdjustmentInput? input, CancellationToken ct);
    Task<object> DecideAdjustment(Guid id, DecisionInput input, CancellationToken ct);
    Task<object> ExecuteAdjustment(Guid id, CancellationToken ct);
    Task<object> Receipt(Guid id, bool create, CancellationToken ct);
    Task<Tv4File> ReceiptFile(Guid id, CancellationToken ct);
    Task<object> Reports(ChargeQuery query, CancellationToken ct);
    Task<Tv4File> Export(FinanceExportInput input, CancellationToken ct);
}
