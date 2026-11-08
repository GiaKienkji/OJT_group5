namespace SOMS.Application.Common.Models;

public class LoginRequest
{
    public string EmailOrCode { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public bool RememberMe { get; set; } = false;
}

public class GoogleLoginRequest
{
    public string IdToken { get; set; } = string.Empty;
}

public class RefreshTokenRequest
{
    public string RefreshToken { get; set; } = string.Empty;
}

public class ChangePasswordRequest
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class LoginResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public int ExpiresIn { get; set; }
    public CurrentUserDto User { get; set; } = null!;
}

public class CurrentUserDto
{
    public Guid UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? AvatarPath { get; set; }
    public List<string> Roles { get; set; } = new();
    public List<string> Permissions { get; set; } = new();
    public string DefaultDashboard { get; set; } = "/login";
    public List<DashboardOptionDto> AvailableDashboards { get; set; } = new();
    public Guid? SchoolId { get; set; }
    public string? SchoolName { get; set; }
}

public class DashboardOptionDto
{
    public string RoleCode { get; set; } = string.Empty;
    public string RoleName { get; set; } = string.Empty;
    public string Route { get; set; } = string.Empty;
}
