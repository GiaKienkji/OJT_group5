using SOMS.Application.Common.Models;

namespace SOMS.Application.Common.Interfaces;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(LoginRequest request, string? ipAddress, string? userAgent, CancellationToken cancellationToken = default);
    Task<LoginResponse?> LoginWithGoogleAsync(string idToken, string? ipAddress, string? userAgent, CancellationToken cancellationToken = default);
    Task<LoginResponse?> RefreshTokenAsync(string refreshToken, string? ipAddress, string? userAgent, CancellationToken cancellationToken = default);
    Task<bool> LogoutAsync(string refreshToken, CancellationToken cancellationToken = default);
    Task<CurrentUserDto?> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<bool> ChangePasswordAsync(Guid userId, string currentPassword, string newPassword, CancellationToken cancellationToken = default);
}
