using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SOMS.Api.Authorization;
using SOMS.Application.Common.Security;
using SOMS.Application.Modules.Admin.Interfaces;

namespace SOMS.Api.Controllers;

[ApiController]
[Route("api/admin/audit")]
[Authorize]
public class AdminAuditController : ControllerBase
{
    private readonly IAuditLogService _auditLogService;

    public AdminAuditController(IAuditLogService auditLogService)
    {
        _auditLogService = auditLogService;
    }

    [HttpGet("logs")]
    [RequirePermission(PermissionCodes.AuditLogsRead)]
    public async Task<IActionResult> GetAuditLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? action = null, CancellationToken cancellationToken = default)
    {
        var result = await _auditLogService.GetAuditLogsAsync(page, pageSize, action, cancellationToken);
        return Ok(result);
    }

    [HttpGet("sessions")]
    [RequirePermission(PermissionCodes.HealthView)]
    public async Task<IActionResult> GetActiveSessions([FromQuery] Guid? schoolId = null, CancellationToken cancellationToken = default)
    {
        var sessions = await _auditLogService.GetActiveSessionsAsync(schoolId, cancellationToken);
        return Ok(sessions);
    }

    [HttpPost("sessions/{sessionId:guid}/revoke")]
    [RequirePermission(PermissionCodes.UsersDeactivate)]
    public async Task<IActionResult> RevokeSession(Guid sessionId, CancellationToken cancellationToken)
    {
        var success = await _auditLogService.RevokeSessionAsync(sessionId, cancellationToken);
        if (!success) return NotFound(new { message = "Không tìm thấy phiên đăng nhập." });
        return Ok(new { message = "Đã thu hồi phiên đăng nhập thành công." });
    }

    [HttpGet("health")]
    [RequirePermission(PermissionCodes.HealthView)]
    public async Task<IActionResult> GetSystemHealth(CancellationToken cancellationToken)
    {
        var health = await _auditLogService.GetSystemHealthAsync(cancellationToken);
        return Ok(health);
    }
}

