using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SOMS.Api.Authorization;
using SOMS.Application.Common.Security;
using SOMS.Application.Modules.Admin.DTOs;
using SOMS.Application.Modules.Admin.Interfaces;

namespace SOMS.Api.Controllers;

[ApiController]
[Route("api/admin/roles")]
[Authorize]
public class AdminRolesController : ControllerBase
{
    private readonly IRolePermissionService _roleService;
    private readonly IAuditLogService _auditLogService;

    public AdminRolesController(IRolePermissionService roleService, IAuditLogService auditLogService)
    {
        _roleService = roleService;
        _auditLogService = auditLogService;
    }

    [HttpGet]
    [RequirePermission(PermissionCodes.RolesManage)]
    public async Task<IActionResult> GetAllRoles(CancellationToken cancellationToken)
    {
        var roles = await _roleService.GetAllRolesAsync(cancellationToken);
        return Ok(roles);
    }

    [HttpGet("permissions")]
    [RequirePermission(PermissionCodes.RolesManage)]
    public async Task<IActionResult> GetAllPermissions(CancellationToken cancellationToken)
    {
        var perms = await _roleService.GetAllPermissionsAsync(cancellationToken);
        return Ok(perms);
    }

    [HttpPut("permissions")]
    [RequirePermission(PermissionCodes.RolesManage)]
    public async Task<IActionResult> UpdateRolePermissions([FromBody] UpdateRolePermissionsRequest request, CancellationToken cancellationToken)
    {
        var success = await _roleService.UpdateRolePermissionsAsync(request, cancellationToken);
        if (!success) return NotFound(new { message = $"Không tìm thấy vai trò '{request.RoleCode}'." });

        var currentUserId = GetCurrentUserId();
        await _auditLogService.LogAsync(
            action: "UPDATE_ROLE_PERMISSIONS",
            entityName: "RolePermission",
            entityId: request.RoleCode,
            details: $"Cập nhật danh sách quyền cho vai trò {request.RoleCode} ({request.PermissionCodes.Count} quyền)",
            userId: currentUserId,
            ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
            cancellationToken: cancellationToken
        );

        return Ok(new { message = $"Cập nhật phân quyền cho vai trò {request.RoleCode} thành công." });
    }

    [HttpPost("assign")]
    [RequirePermission(PermissionCodes.RolesManage)]
    public async Task<IActionResult> AssignRole([FromBody] AssignUserRoleRequest request, CancellationToken cancellationToken)
    {
        var currentUserId = GetCurrentUserId();
        var success = await _roleService.AssignUserRoleAsync(request, currentUserId, cancellationToken);
        if (!success) return BadRequest(new { message = "Không thể gán vai trò." });

        await _auditLogService.LogAsync(
            action: "ASSIGN_ROLE",
            entityName: "SchoolMembership",
            entityId: request.UserId.ToString(),
            details: $"Gán vai trò {request.RoleCode} cho user {request.UserId}",
            userId: currentUserId,
            schoolId: request.SchoolId,
            ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
            cancellationToken: cancellationToken
        );

        return Ok(new { message = "Gán vai trò cho người dùng thành công." });
    }

    [HttpDelete("remove")]
    [RequirePermission(PermissionCodes.RolesManage)]
    public async Task<IActionResult> RemoveRole([FromQuery] Guid userId, [FromQuery] Guid schoolId, [FromQuery] string roleCode, CancellationToken cancellationToken)
    {
        var success = await _roleService.RemoveUserRoleAsync(userId, schoolId, roleCode, cancellationToken);
        if (!success) return NotFound(new { message = "Không tìm thấy vai trò cần thu hồi." });

        var currentUserId = GetCurrentUserId();
        await _auditLogService.LogAsync(
            action: "REMOVE_ROLE",
            entityName: "SchoolMembership",
            entityId: userId.ToString(),
            details: $"Thu hồi vai trò {roleCode} của user {userId}",
            userId: currentUserId,
            schoolId: schoolId,
            ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
            cancellationToken: cancellationToken
        );

        return Ok(new { message = "Thu hồi vai trò thành công." });
    }

    private Guid? GetCurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return Guid.TryParse(sub, out var g) ? g : null;
    }
}

