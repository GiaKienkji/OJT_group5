using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SOMS.Api.Authorization;
using SOMS.Application.Common.Security;
using SOMS.Application.Modules.Admin.Interfaces;
using SOMS.Application.Modules.Management.DTOs;
using SOMS.Application.Modules.Management.Interfaces;

namespace SOMS.Api.Controllers;

[ApiController]
[Route("api/approvals")]
[Authorize]
public class ApprovalsController : ControllerBase
{
    private readonly IApprovalEngineService _approvalService;
    private readonly IAuditLogService _auditLogService;

    public ApprovalsController(IApprovalEngineService approvalService, IAuditLogService auditLogService)
    {
        _approvalService = approvalService;
        _auditLogService = auditLogService;
    }

    [HttpGet]
    public async Task<IActionResult> GetApprovalRequests([FromQuery] ApprovalFilter filter, CancellationToken cancellationToken)
    {
        var requests = await _approvalService.GetApprovalRequestsAsync(filter, cancellationToken);
        return Ok(requests);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetApprovalRequestById(Guid id, CancellationToken cancellationToken)
    {
        var item = await _approvalService.GetApprovalRequestByIdAsync(id, cancellationToken);
        if (item == null) return NotFound(new { message = "Không tìm thấy hồ sơ yêu cầu phê duyệt." });
        return Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> CreateRequest([FromBody] CreateApprovalRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.RequestType))
        {
            return BadRequest(new { message = "Tiêu đề và loại yêu cầu không được để trống." });
        }

        var currentUserId = GetCurrentUserId();
        if (currentUserId == null) return Unauthorized();

        var created = await _approvalService.CreateRequestAsync(request, currentUserId.Value, cancellationToken);

        await _auditLogService.LogAsync(
            action: "CREATE_APPROVAL_REQUEST",
            entityName: "ApprovalRequest",
            entityId: created.Id.ToString(),
            details: $"Tạo yêu cầu [{created.RequestTypeNameVi}]: {created.Title}",
            userId: currentUserId,
            schoolId: request.SchoolId,
            cancellationToken: cancellationToken
        );

        return CreatedAtAction(nameof(GetApprovalRequestById), new { id = created.Id }, created);
    }

    [HttpPost("{id:guid}/decision")]
    [RequirePermission(PermissionCodes.WorkflowApprove)]
    public async Task<IActionResult> ProcessDecision(Guid id, [FromBody] ApprovalDecisionRequest decision, CancellationToken cancellationToken)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null) return Unauthorized();

        var success = await _approvalService.ProcessDecisionAsync(id, decision, currentUserId.Value, cancellationToken);
        if (!success) return NotFound(new { message = "Không tìm thấy yêu cầu hoặc đã được xử lý." });

        await _auditLogService.LogAsync(
            action: decision.Decision.Equals("approved", StringComparison.OrdinalIgnoreCase) ? "APPROVE_REQUEST" : "REJECT_REQUEST",
            entityName: "ApprovalRequest",
            entityId: id.ToString(),
            details: $"Quyết định: {decision.Decision}, Ghi chú: {decision.Note}",
            userId: currentUserId,
            cancellationToken: cancellationToken
        );

        return Ok(new { message = $"Đã xử lý quyết định '{decision.Decision}' thành công." });
    }

    private Guid? GetCurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return Guid.TryParse(sub, out var g) ? g : null;
    }
}

