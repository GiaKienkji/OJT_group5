using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SOMS.Api.Authorization;
using SOMS.Application.Common.Security;
using SOMS.Application.Modules.Admin.DTOs;
using SOMS.Application.Modules.Admin.Interfaces;

namespace SOMS.Api.Controllers;

[ApiController]
[Route("api/admin/users")]
[Authorize]
public class AdminUsersController : ControllerBase
{
    private readonly IUserManagementService _userService;
    private readonly IAuditLogService _auditLogService;

    public AdminUsersController(IUserManagementService userService, IAuditLogService auditLogService)
    {
        _userService = userService;
        _auditLogService = auditLogService;
    }

    [HttpGet]
    [RequirePermission(PermissionCodes.UsersRead)]
    public async Task<IActionResult> GetUsers([FromQuery] UserQueryFilter filter, CancellationToken cancellationToken)
    {
        var result = await _userService.GetUsersAsync(filter, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [RequirePermission(PermissionCodes.UsersRead)]
    public async Task<IActionResult> GetUserById(Guid id, CancellationToken cancellationToken)
    {
        var user = await _userService.GetUserByIdAsync(id, cancellationToken);
        if (user == null) return NotFound(new { message = "Không tìm thấy người dùng." });
        return Ok(user);
    }

    [HttpPost]
    [RequirePermission(PermissionCodes.UsersCreate)]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.FullName) || string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new { message = "Họ tên và Email không được để trống." });
        }

        var currentUserId = GetCurrentUserId();
        var user = await _userService.CreateUserAsync(request, currentUserId, cancellationToken);

        await _auditLogService.LogAsync(
            action: "CREATE_USER",
            entityName: "Profile",
            entityId: user.Id.ToString(),
            details: $"Tạo người dùng mới: {user.FullName} ({user.Email})",
            userId: currentUserId,
            schoolId: user.SchoolId,
            ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
            cancellationToken: cancellationToken
        );

        return CreatedAtAction(nameof(GetUserById), new { id = user.Id }, user);
    }

    [HttpPut("{id:guid}")]
    [RequirePermission(PermissionCodes.UsersUpdate)]
    public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserRequest request, CancellationToken cancellationToken)
    {
        var updated = await _userService.UpdateUserAsync(id, request, cancellationToken);
        if (updated == null) return NotFound(new { message = "Không tìm thấy người dùng cần cập nhật." });

        var currentUserId = GetCurrentUserId();
        await _auditLogService.LogAsync(
            action: "UPDATE_USER",
            entityName: "Profile",
            entityId: id.ToString(),
            details: $"Cập nhật người dùng: {updated.FullName}, Trạng thái: {updated.Status}",
            userId: currentUserId,
            schoolId: updated.SchoolId,
            ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
            cancellationToken: cancellationToken
        );

        return Ok(updated);
    }

    [HttpPatch("{id:guid}/status")]
    [RequirePermission(PermissionCodes.UsersDeactivate)]
    public async Task<IActionResult> SetUserStatus(Guid id, [FromBody] SetStatusRequest request, CancellationToken cancellationToken)
    {
        var success = await _userService.SetUserStatusAsync(id, request.Status, cancellationToken);
        if (!success) return NotFound(new { message = "Không tìm thấy người dùng." });

        var currentUserId = GetCurrentUserId();
        await _auditLogService.LogAsync(
            action: request.Status == "locked" ? "LOCK_USER" : "UNLOCK_USER",
            entityName: "Profile",
            entityId: id.ToString(),
            details: $"Thay đổi trạng thái tài khoản thành: {request.Status}",
            userId: currentUserId,
            ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
            cancellationToken: cancellationToken
        );

        return Ok(new { message = $"Đã cập nhật trạng thái người dùng thành '{request.Status}' thành công." });
    }

    [HttpPost("{id:guid}/reset-password")]
    [RequirePermission(PermissionCodes.UsersResetPassword)]
    public async Task<IActionResult> ResetPassword(Guid id, [FromBody] ResetPasswordRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
        {
            return BadRequest(new { message = "Mật khẩu mới phải có tối thiểu 6 ký tự." });
        }

        var success = await _userService.ResetPasswordAsync(id, request.NewPassword, cancellationToken);
        if (!success) return BadRequest(new { message = "Không thể đặt lại mật khẩu cho tài khoản này." });

        var currentUserId = GetCurrentUserId();
        await _auditLogService.LogAsync(
            action: "RESET_PASSWORD",
            entityName: "User",
            entityId: id.ToString(),
            details: "Quản trị viên đặt lại mật khẩu cho tài khoản.",
            userId: currentUserId,
            ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
            cancellationToken: cancellationToken
        );

        return Ok(new { message = "Đặt lại mật khẩu thành công." });
    }

    [HttpPost("import")]
    [RequirePermission(PermissionCodes.UsersCreate)]
    public async Task<IActionResult> ImportUsers([FromBody] ImportUsersRequest request, CancellationToken cancellationToken)
    {
        if (request.Users == null || !request.Users.Any())
        {
            return BadRequest(new { message = "Danh sách người dùng import không được rỗng." });
        }

        var result = await _userService.BulkImportUsersAsync(request.Users, request.SchoolId, cancellationToken);
        return Ok(result);
    }

    private Guid? GetCurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return Guid.TryParse(sub, out var g) ? g : null;
    }
}

public class SetStatusRequest
{
    public string Status { get; set; } = "active";
}

public class ImportUsersRequest
{
    public Guid SchoolId { get; set; }
    public List<BulkImportUserItem> Users { get; set; } = new();
}

