using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SOMS.Application.Common.Interfaces;
using SOMS.Application.Common.Models;

namespace SOMS.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// Authenticate user via Email or Account Code + Password.
    /// Returns JWT Access Token, Refresh Token, and User Profile with Roles & Permissions.
    /// </summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.EmailOrCode) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Email hoặc mã tài khoản và mật khẩu không được để trống." });
        }

        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = Request.Headers.UserAgent.ToString();

        var response = await _authService.LoginAsync(request, ipAddress, userAgent, cancellationToken);
        if (response == null)
        {
            return Unauthorized(new { message = "Thông tin đăng nhập không chính xác hoặc tài khoản đã bị khóa." });
        }

        return Ok(response);
    }

    /// <summary>
    /// Authenticate user via Google OAuth 2.0 (Google Identity Services ID Token).
    /// </summary>
    [HttpPost("google")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.IdToken))
        {
            return BadRequest(new { message = "Google ID Token không được để trống." });
        }

        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = Request.Headers.UserAgent.ToString();

        var response = await _authService.LoginWithGoogleAsync(request.IdToken, ipAddress, userAgent, cancellationToken);
        if (response == null)
        {
            return Unauthorized(new { message = "Xác thực Google không thành công hoặc token không hợp lệ." });
        }

        return Ok(response);
    }

    /// <summary>
    /// Refresh access token using an active refresh token with automatic token rotation.
    /// </summary>
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request, CancellationToken cancellationToken)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = Request.Headers.UserAgent.ToString();

        var response = await _authService.RefreshTokenAsync(request.RefreshToken, ipAddress, userAgent, cancellationToken);
        if (response == null)
        {
            return Unauthorized(new { message = "Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại." });
        }

        return Ok(response);
    }

    /// <summary>
    /// Invalidate refresh token and logout session.
    /// </summary>
    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Logout([FromBody] RefreshTokenRequest request, CancellationToken cancellationToken)
    {
        await _authService.LogoutAsync(request.RefreshToken, cancellationToken);
        return Ok(new { message = "Đăng xuất thành công." });
    }

    /// <summary>
    /// Get current authenticated user's profile, roles, permissions and available dashboards.
    /// </summary>
    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType(typeof(CurrentUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCurrentUser(CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                          ?? User.FindFirst("sub")?.Value;

        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { message = "Token không hợp lệ." });
        }

        var user = await _authService.GetCurrentUserAsync(userId, cancellationToken);
        if (user == null)
        {
            return NotFound(new { message = "Không tìm thấy hồ sơ người dùng." });
        }

        return Ok(user);
    }

    /// <summary>
    /// Change password for the current authenticated user.
    /// </summary>
    [Authorize]
    [HttpPost("change-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var success = await _authService.ChangePasswordAsync(userId, request.CurrentPassword, request.NewPassword, cancellationToken);
        if (!success)
        {
            return BadRequest(new { message = "Mật khẩu hiện tại không đúng hoặc không thể cập nhật." });
        }

        return Ok(new { message = "Đổi mật khẩu thành công." });
    }
}
