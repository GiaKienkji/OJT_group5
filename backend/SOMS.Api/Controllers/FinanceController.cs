using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SOMS.Api.Authorization;
using SOMS.Application.Common.Models;
using SOMS.Application.Common.Security;
using SOMS.Application.Modules.Finance.DTOs;
using SOMS.Application.Modules.Finance.Interfaces;

namespace SOMS.Api.Controllers;

[ApiController, Route("api/finance"), Authorize]
public sealed class FinanceController : Tv4Controller
{
    private readonly IFinanceService _service;
    public FinanceController(IFinanceService service) => _service = service;
    [HttpGet("me"), RequirePermission(PermissionCodes.FinanceManage)]
    public Task<IActionResult> Profile(CancellationToken ct) => Execute(() => _service.Profile(null, ct));
    [HttpPut("me"), RequirePermission(PermissionCodes.FinanceManage)]
    public Task<IActionResult> UpdateProfile(ProfileUpdate input, CancellationToken ct) => Execute(() => _service.Profile(input, ct));
    [HttpGet("lookups"), RequirePermission(PermissionCodes.FinanceManage)]
    public Task<IActionResult> Lookups([FromQuery] LookupQuery query, CancellationToken ct) => Execute(() => _service.Lookups(query, ct));
    [HttpGet("dashboard"), RequirePermission(PermissionCodes.FinanceManage)]
    public Task<IActionResult> Dashboard(CancellationToken ct) => Execute(() => _service.Dashboard(ct));
    [HttpGet("fee-categories"), RequirePermission(PermissionCodes.FeeCategoriesManage)]
    public Task<IActionResult> Categories(CancellationToken ct) => Execute(() => _service.Categories(null, null, ct));
    [HttpPost("fee-categories"), RequirePermission(PermissionCodes.FeeCategoriesManage)]
    public Task<IActionResult> CreateCategory(FeeCategoryInput input, CancellationToken ct) => Execute(() => _service.Categories(null, input, ct), true);
    [HttpPut("fee-categories/{id:guid}"), RequirePermission(PermissionCodes.FeeCategoriesManage)]
    public Task<IActionResult> UpdateCategory(Guid id, FeeCategoryInput input, CancellationToken ct) => Execute(() => _service.Categories(id, input, ct));
    [HttpGet("fee-campaigns"), RequirePermission(PermissionCodes.FeeCampaignsManage)]
    public Task<IActionResult> Campaigns(CancellationToken ct) => Execute(() => _service.Campaigns(null, null, ct));
    [HttpPost("fee-campaigns"), RequirePermission(PermissionCodes.FeeCampaignsManage)]
    public Task<IActionResult> CreateCampaign(FeeCampaignInput input, CancellationToken ct) => Execute(() => _service.Campaigns(null, input, ct), true);
    [HttpPut("fee-campaigns/{id:guid}"), RequirePermission(PermissionCodes.FeeCampaignsManage)]
    public Task<IActionResult> UpdateCampaign(Guid id, FeeCampaignInput input, CancellationToken ct) => Execute(() => _service.Campaigns(id, input, ct));
    [HttpGet("fee-campaigns/{id:guid}/rules"), RequirePermission(PermissionCodes.FeeCampaignsManage)]
    public Task<IActionResult> Rules(Guid id, CancellationToken ct) => Execute(() => _service.Rules(id, null, ct));
    [HttpPut("fee-campaigns/{id:guid}/rules"), RequirePermission(PermissionCodes.FeeCampaignsManage)]
    public Task<IActionResult> SaveRules(Guid id, List<FeeRuleInput> input, CancellationToken ct) => Execute(() => _service.Rules(id, input, ct));
    [HttpPost("fee-campaigns/{id:guid}/assignments"), RequirePermission(PermissionCodes.FeeCampaignsManage)]
    public Task<IActionResult> Apply(Guid id, ApplyFeesInput input, CancellationToken ct) => Execute(() => _service.Apply(id, input, ct));
    [HttpGet("fee-assignments"), RequirePermission(PermissionCodes.FeeCampaignsManage)]
    public Task<IActionResult> Charges([FromQuery] ChargeQuery query, CancellationToken ct) => Execute(() => _service.Charges(query, false, ct));
    [HttpGet("debts"), RequirePermission(PermissionCodes.DebtsTrack)]
    public Task<IActionResult> Debts([FromQuery] ChargeQuery query, CancellationToken ct) => Execute(() => _service.Charges(query, true, ct));
    [HttpGet("fee-assignments/{id:guid}/exemptions"), RequirePermission(PermissionCodes.FinanceManage)]
    public Task<IActionResult> Exemptions(Guid id, CancellationToken ct) => Execute(() => _service.Exemptions(id, null, ct));
    [HttpPost("fee-assignments/{id:guid}/exemptions"), RequirePermission(PermissionCodes.FinanceManage)]
    public Task<IActionResult> RequestExemption(Guid id, ExemptionInput input, CancellationToken ct) => Execute(() => _service.Exemptions(id, input, ct), true);
    [HttpPost("exemptions/{id:guid}/decision"), RequirePermission(PermissionCodes.WorkflowApprove)]
    public Task<IActionResult> DecideExemption(Guid id, DecisionInput input, CancellationToken ct) => Execute(() => _service.DecideExemption(id, input, ct));
    [HttpGet("fee-campaigns/{id:guid}/notices"), RequirePermission(PermissionCodes.FinanceManage)]
    public Task<IActionResult> Notices(Guid id, CancellationToken ct) => Execute(() => _service.Notices(id, null, ct));
    [HttpPost("fee-campaigns/{id:guid}/notices"), RequirePermission(PermissionCodes.FinanceManage)]
    public Task<IActionResult> CreateNotice(Guid id, NoticeInput input, CancellationToken ct) => Execute(() => _service.Notices(id, input, ct), true);
    [HttpPost("notices/{id:guid}/send"), RequirePermission(PermissionCodes.FinanceManage)]
    public Task<IActionResult> SendNotice(Guid id, CancellationToken ct) => Execute(() => _service.SendNotice(id, ct));
    [HttpPost("debts/{id:guid}/reminder"), RequirePermission(PermissionCodes.DebtsTrack)]
    public Task<IActionResult> Reminder(Guid id, ReminderInput input, CancellationToken ct) => Execute(() => _service.Reminder(id, input, ct));
    [HttpGet("payments"), RequirePermission(PermissionCodes.PaymentsRecord)]
    public Task<IActionResult> Payments([FromQuery] Guid? studentId, [FromQuery] string? status, CancellationToken ct) => Execute(() => _service.Payments(studentId, status, ct));
    [HttpPost("payments"), RequirePermission(PermissionCodes.PaymentsRecord)]
    public Task<IActionResult> RecordPayment(RecordPaymentInput input, CancellationToken ct) => Execute(() => _service.RecordPayment(input, ct), true);
    [HttpPost("payments/{id:guid}/verify"), RequirePermission(PermissionCodes.PaymentsReconcile)]
    public Task<IActionResult> Verify(Guid id, DecisionInput input, CancellationToken ct) => Execute(() => _service.Verify(id, input, ct));
    [HttpGet("bank-transactions"), RequirePermission(PermissionCodes.PaymentsReconcile)]
    public Task<IActionResult> BankTransactions([FromQuery] string? status, CancellationToken ct) => Execute(() => _service.BankTransactions(status, ct));
    [HttpPost("bank-transactions/import"), RequirePermission(PermissionCodes.PaymentsReconcile)]
    public Task<IActionResult> Import(BankImportInput input, CancellationToken ct) => Execute(() => _service.Import(input, ct));
    [HttpPost("payments/reconcile"), RequirePermission(PermissionCodes.PaymentsReconcile)]
    public Task<IActionResult> Reconcile(ReconcileInput input, CancellationToken ct) => Execute(() => _service.Reconcile(input, ct));
    [HttpGet("adjustments"), RequirePermission(PermissionCodes.FinanceManage)]
    public Task<IActionResult> Adjustments(CancellationToken ct) => Execute(() => _service.Adjustments(null, ct));
    [HttpPost("adjustments"), RequirePermission(PermissionCodes.FinanceManage)]
    public Task<IActionResult> RequestAdjustment(AdjustmentInput input, CancellationToken ct) => Execute(() => _service.Adjustments(input, ct), true);
    [HttpPost("adjustments/{id:guid}/decision"), RequirePermission(PermissionCodes.WorkflowApprove)]
    public Task<IActionResult> DecideAdjustment(Guid id, DecisionInput input, CancellationToken ct) => Execute(() => _service.DecideAdjustment(id, input, ct));
    [HttpPost("adjustments/{id:guid}/execute"), RequirePermission(PermissionCodes.FinanceManage)]
    public Task<IActionResult> ExecuteAdjustment(Guid id, CancellationToken ct) => Execute(() => _service.ExecuteAdjustment(id, ct));
    [HttpPost("receipts/{paymentId:guid}"), RequirePermission(PermissionCodes.PaymentsRecord)]
    public Task<IActionResult> CreateReceipt(Guid paymentId, CancellationToken ct) => Execute(() => _service.Receipt(paymentId, true, ct));
    [HttpGet("receipts/{id:guid}"), RequirePermission(PermissionCodes.PaymentsRecord)]
    public Task<IActionResult> Receipt(Guid id, CancellationToken ct) => Execute(() => _service.Receipt(id, false, ct));
    [HttpGet("receipts/{id:guid}/download"), RequirePermission(PermissionCodes.PaymentsRecord)]
    public Task<IActionResult> ReceiptFile(Guid id, CancellationToken ct) => Download(() => _service.ReceiptFile(id, ct));
    [HttpGet("payment-history"), RequirePermission(PermissionCodes.PaymentsRecord)]
    public Task<IActionResult> History([FromQuery] Guid? studentId, CancellationToken ct) => Execute(() => _service.Payments(studentId, null, ct));
    [HttpGet("reports"), RequirePermission(PermissionCodes.FinanceManage)]
    public Task<IActionResult> Reports([FromQuery] ChargeQuery query, CancellationToken ct) => Execute(() => _service.Reports(query, ct));
    [HttpPost("reports/export"), RequirePermission(PermissionCodes.FinanceManage)]
    public Task<IActionResult> Export(FinanceExportInput input, CancellationToken ct) => Download(() => _service.Export(input, ct));
}
