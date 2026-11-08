using System.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Google.Apis.Auth;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using SOMS.Application.Common.Interfaces;
using SOMS.Application.Common.Models;
using SOMS.Application.Common.Security;
using SOMS.Domain.Entities;
using SOMS.Infrastructure.Data;

namespace SOMS.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly SomsDbContext _dbContext;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        SomsDbContext dbContext,
        IConfiguration configuration,
        ILogger<AuthService> logger)
    {
        _dbContext = dbContext;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request, string? ipAddress, string? userAgent, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.EmailOrCode) || string.IsNullOrWhiteSpace(request.Password))
        {
            return null;
        }

        var normalizedInput = request.EmailOrCode.Trim();

        // 1. Query auth.users directly via db connection
        var conn = _dbContext.Database.GetDbConnection();
        if (conn.State != ConnectionState.Open)
        {
            await conn.OpenAsync(cancellationToken);
        }

        Guid? authUserId = null;
        string? userEmail = null;
        string? passwordHash = null;

        await using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = @"
                SELECT u.id, u.email, u.encrypted_password 
                FROM auth.users u
                LEFT JOIN public.staff st ON st.user_id = u.id
                LEFT JOIN public.students stu ON stu.user_id = u.id
                WHERE LOWER(u.email) = LOWER(@input)
                   OR LOWER(st.employee_code) = LOWER(@input)
                   OR LOWER(stu.student_code) = LOWER(@input)
                LIMIT 1;";
            
            var pInput = cmd.CreateParameter();
            pInput.ParameterName = "input";
            pInput.Value = normalizedInput;
            cmd.Parameters.Add(pInput);

            await using var rdr = await cmd.ExecuteReaderAsync(cancellationToken);
            if (await rdr.ReadAsync(cancellationToken))
            {
                authUserId = rdr.GetGuid(0);
                userEmail = rdr.IsDBNull(1) ? string.Empty : rdr.GetString(1);
                passwordHash = rdr.IsDBNull(2) ? string.Empty : rdr.GetString(2);
            }
        }

        if (authUserId == null || string.IsNullOrEmpty(passwordHash))
        {
            _logger.LogWarning("Login failed: User '{Input}' not found.", normalizedInput);
            return null;
        }

        // 2. Verify password with BCrypt (supports standard password and case-insensitive test password SOMS@2026)
        bool passwordMatches = false;
        try
        {
            passwordMatches = BCrypt.Net.BCrypt.Verify(request.Password, passwordHash);
            if (!passwordMatches && request.Password.Equals("Soms@2026", StringComparison.OrdinalIgnoreCase))
            {
                passwordMatches = BCrypt.Net.BCrypt.Verify("Soms@2026", passwordHash);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying password hash for user {UserId}", authUserId);
            return null;
        }

        if (!passwordMatches)
        {
            _logger.LogWarning("Login failed: Invalid password for user '{Input}'.", normalizedInput);
            return null;
        }

        // 3. Load user details, roles and permissions
        var currentUser = await GetCurrentUserInternalAsync(authUserId.Value, userEmail ?? string.Empty, cancellationToken);
        if (currentUser == null)
        {
            _logger.LogWarning("Login failed: User profile not found for {UserId}.", authUserId);
            return null;
        }

        // 4. Generate Tokens
        var accessToken = GenerateAccessToken(currentUser);
        var expiryDays = request.RememberMe ? 30 : 7;
        var refreshToken = GenerateRefreshTokenString();
        var expiresAt = DateTimeOffset.UtcNow.AddDays(expiryDays);

        // 5. Store session in user_sessions
        var session = new UserSession
        {
            Id = Guid.NewGuid(),
            UserId = currentUser.UserId,
            RefreshToken = refreshToken,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            ExpiresAt = expiresAt,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _dbContext.UserSessions.Add(session);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("User {Email} logged in successfully with roles [{Roles}].", 
            currentUser.Email, string.Join(", ", currentUser.Roles));

        return new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresIn = 3600,
            User = currentUser
        };
    }

    public async Task<LoginResponse?> LoginWithGoogleAsync(string idToken, string? ipAddress, string? userAgent, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(idToken)) return null;

        var googleClientId = _configuration["Google:ClientId"];
        GoogleJsonWebSignature.Payload payload;

        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = !string.IsNullOrEmpty(googleClientId) ? new[] { googleClientId } : null
            };
            payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Google token validation failed.");
            return null;
        }

        if (string.IsNullOrEmpty(payload.Email))
        {
            _logger.LogWarning("Google token did not contain an email.");
            return null;
        }

        var email = payload.Email.ToLowerInvariant();
        var name = !string.IsNullOrWhiteSpace(payload.Name) ? payload.Name : email.Split('@')[0];

        // Check if user exists in auth.users
        var conn = _dbContext.Database.GetDbConnection();
        if (conn.State != ConnectionState.Open)
        {
            await conn.OpenAsync(cancellationToken);
        }

        Guid? userId = null;
        await using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "SELECT id FROM auth.users WHERE LOWER(email) = LOWER(@email) LIMIT 1;";
            var pEmail = cmd.CreateParameter();
            pEmail.ParameterName = "email";
            pEmail.Value = email;
            cmd.Parameters.Add(pEmail);

            var res = await cmd.ExecuteScalarAsync(cancellationToken);
            if (res != null && res != DBNull.Value)
            {
                userId = (Guid)res;
            }
        }

        // If new user: create in auth.users and public.profiles, assign default role
        if (userId == null)
        {
            userId = Guid.NewGuid();
            await using (var cmd = conn.CreateCommand())
            {
                cmd.CommandText = @"
                    INSERT INTO auth.users (
                        id, instance_id, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
                        created_at, updated_at, aud, role
                    ) VALUES (
                        @id, '00000000-0000-0000-0000-000000000000', @email, now(),
                        '{\""provider\"":\""google\"",\""providers\"":[\""google\""]}'::jsonb,
                        jsonb_build_object('full_name', @name, 'avatar_url', @avatar),
                        now(), now(), 'authenticated', 'authenticated'
                    );";
                var pId = cmd.CreateParameter(); pId.ParameterName = "id"; pId.Value = userId.Value; cmd.Parameters.Add(pId);
                var pEmail = cmd.CreateParameter(); pEmail.ParameterName = "email"; pEmail.Value = email; cmd.Parameters.Add(pEmail);
                var pName = cmd.CreateParameter(); pName.ParameterName = "name"; pName.Value = name; cmd.Parameters.Add(pName);
                var pAvatar = cmd.CreateParameter(); pAvatar.ParameterName = "avatar"; pAvatar.Value = payload.Picture ?? ""; cmd.Parameters.Add(pAvatar);
                await cmd.ExecuteNonQueryAsync(cancellationToken);
            }

            // Ensure Profile exists
            var profile = await _dbContext.Profiles.FirstOrDefaultAsync(p => p.Id == userId.Value, cancellationToken);
            if (profile == null)
            {
                profile = new Profile
                {
                    Id = userId.Value,
                    FullName = name,
                    AvatarPath = payload.Picture,
                    Status = "active"
                };
                _dbContext.Profiles.Add(profile);
                await _dbContext.SaveChangesAsync(cancellationToken);
            }

            // Assign default School Membership (SystemAdmin for Google owner)
            var defaultSchool = await _dbContext.Schools.FirstOrDefaultAsync(cancellationToken);
            if (defaultSchool != null)
            {
                var membership = new SchoolMembership
                {
                    Id = Guid.NewGuid(),
                    SchoolId = defaultSchool.Id,
                    UserId = userId.Value,
                    RoleCode = RoleCodes.SystemAdmin,
                    Status = "active"
                };
                _dbContext.SchoolMemberships.Add(membership);
                await _dbContext.SaveChangesAsync(cancellationToken);
            }
        }

        var currentUser = await GetCurrentUserInternalAsync(userId.Value, email, cancellationToken);
        if (currentUser == null) return null;

        var accessToken = GenerateAccessToken(currentUser);
        var refreshToken = GenerateRefreshTokenString();
        var session = new UserSession
        {
            Id = Guid.NewGuid(),
            UserId = currentUser.UserId,
            RefreshToken = refreshToken,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(7),
            CreatedAt = DateTimeOffset.UtcNow
        };

        _dbContext.UserSessions.Add(session);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("User {Email} logged in with Google successfully.", email);

        return new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresIn = 3600,
            User = currentUser
        };
    }

    public async Task<LoginResponse?> RefreshTokenAsync(string refreshToken, string? ipAddress, string? userAgent, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(refreshToken)) return null;

        var session = await _dbContext.UserSessions
            .Include(s => s.Profile)
            .FirstOrDefaultAsync(s => s.RefreshToken == refreshToken, cancellationToken);

        if (session == null || session.RevokedAt != null || session.ExpiresAt <= DateTimeOffset.UtcNow)
        {
            return null;
        }

        // Token rotation: revoke current session
        session.RevokedAt = DateTimeOffset.UtcNow;

        // Get user details
        var currentUser = await GetCurrentUserAsync(session.UserId, cancellationToken);
        if (currentUser == null) return null;

        // Create new session
        var newRefreshToken = GenerateRefreshTokenString();
        var newSession = new UserSession
        {
            Id = Guid.NewGuid(),
            UserId = currentUser.UserId,
            RefreshToken = newRefreshToken,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(7),
            CreatedAt = DateTimeOffset.UtcNow
        };

        _dbContext.UserSessions.Add(newSession);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var newAccessToken = GenerateAccessToken(currentUser);

        return new LoginResponse
        {
            AccessToken = newAccessToken,
            RefreshToken = newRefreshToken,
            ExpiresIn = 3600,
            User = currentUser
        };
    }

    public async Task<bool> LogoutAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(refreshToken)) return false;

        var session = await _dbContext.UserSessions
            .FirstOrDefaultAsync(s => s.RefreshToken == refreshToken, cancellationToken);

        if (session != null && session.RevokedAt == null)
        {
            session.RevokedAt = DateTimeOffset.UtcNow;
            await _dbContext.SaveChangesAsync(cancellationToken);
            return true;
        }

        return false;
    }

    public async Task<CurrentUserDto?> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        // Get user email from auth.users
        var conn = _dbContext.Database.GetDbConnection();
        if (conn.State != ConnectionState.Open)
        {
            await conn.OpenAsync(cancellationToken);
        }

        string email = string.Empty;
        await using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "SELECT email FROM auth.users WHERE id = @id LIMIT 1;";
            var pId = cmd.CreateParameter();
            pId.ParameterName = "id";
            pId.Value = userId;
            cmd.Parameters.Add(pId);

            var res = await cmd.ExecuteScalarAsync(cancellationToken);
            if (res != null && res != DBNull.Value)
            {
                email = res.ToString() ?? string.Empty;
            }
        }

        return await GetCurrentUserInternalAsync(userId, email, cancellationToken);
    }

    public async Task<bool> ChangePasswordAsync(Guid userId, string currentPassword, string newPassword, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(currentPassword) || string.IsNullOrWhiteSpace(newPassword))
            return false;

        var conn = _dbContext.Database.GetDbConnection();
        if (conn.State != ConnectionState.Open)
        {
            await conn.OpenAsync(cancellationToken);
        }

        string? existingHash = null;
        await using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "SELECT encrypted_password FROM auth.users WHERE id = @id LIMIT 1;";
            var pId = cmd.CreateParameter();
            pId.ParameterName = "id";
            pId.Value = userId;
            cmd.Parameters.Add(pId);
            var res = await cmd.ExecuteScalarAsync(cancellationToken);
            if (res != null && res != DBNull.Value)
            {
                existingHash = res.ToString();
            }
        }

        if (string.IsNullOrEmpty(existingHash) || !BCrypt.Net.BCrypt.Verify(currentPassword, existingHash))
        {
            return false;
        }

        var newHash = BCrypt.Net.BCrypt.HashPassword(newPassword, 10);
        await using (var updateCmd = conn.CreateCommand())
        {
            updateCmd.CommandText = "UPDATE auth.users SET encrypted_password = @pwd, updated_at = now() WHERE id = @id;";
            var pPwd = updateCmd.CreateParameter();
            pPwd.ParameterName = "pwd";
            pPwd.Value = newHash;
            updateCmd.Parameters.Add(pPwd);

            var pId = updateCmd.CreateParameter();
            pId.ParameterName = "id";
            pId.Value = userId;
            updateCmd.Parameters.Add(pId);

            await updateCmd.ExecuteNonQueryAsync(cancellationToken);
        }

        return true;
    }

    private async Task<CurrentUserDto?> GetCurrentUserInternalAsync(Guid userId, string email, CancellationToken cancellationToken)
    {
        var profile = await _dbContext.Profiles
            .Include(p => p.SchoolMemberships.Where(m => m.Status == "active"))
                .ThenInclude(m => m.Role)
            .Include(p => p.SchoolMemberships.Where(m => m.Status == "active"))
                .ThenInclude(m => m.School)
            .FirstOrDefaultAsync(p => p.Id == userId, cancellationToken);

        if (profile == null) return null;

        var activeMemberships = profile.SchoolMemberships.ToList();
        var roles = activeMemberships
            .Select(m => m.RoleCode.ToLowerInvariant())
            .Distinct()
            .ToList();

        var school = activeMemberships.Select(m => m.School).FirstOrDefault();

        // Fetch permissions for all active roles
        var permissions = await _dbContext.RolePermissions
            .Where(rp => roles.Contains(rp.RoleCode.ToLower()))
            .Select(rp => rp.PermissionCode)
            .Distinct()
            .ToListAsync(cancellationToken);

        // Build available dashboards
        var availableDashboards = roles
            .Select(r => new DashboardOptionDto
            {
                RoleCode = r,
                RoleName = RoleCodes.GetRoleNameVi(r),
                Route = RoleCodes.GetDashboardRoute(r)
            })
            .ToList();

        var defaultDashboard = availableDashboards.FirstOrDefault()?.Route ?? "/login";

        return new CurrentUserDto
        {
            UserId = profile.Id,
            Email = email,
            FullName = profile.FullName,
            Phone = profile.Phone,
            AvatarPath = profile.AvatarPath,
            Roles = roles,
            Permissions = permissions,
            DefaultDashboard = defaultDashboard,
            AvailableDashboards = availableDashboards,
            SchoolId = school?.Id,
            SchoolName = school?.Name
        };
    }

    private string GenerateAccessToken(CurrentUserDto user)
    {
        var jwtSecret = _configuration["Jwt:Secret"] ?? "SOMS_SUPER_SECURE_JWT_SECRET_KEY_FOR_LOCAL_DEV_2026_MIN_32_CHARS!!";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new(ClaimTypes.Name, user.FullName),
            new("full_name", user.FullName)
        };

        if (user.SchoolId.HasValue)
        {
            claims.Add(new Claim("school_id", user.SchoolId.Value.ToString()));
        }

        foreach (var role in user.Roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
            claims.Add(new Claim("roles", role));
        }

        foreach (var perm in user.Permissions)
        {
            claims.Add(new Claim("permissions", perm));
        }

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"] ?? "soms-api",
            audience: _configuration["Jwt:Audience"] ?? "soms-app",
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(60),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string GenerateRefreshTokenString()
    {
        var bytes = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes).Replace("+", "-").Replace("/", "_").TrimEnd('=');
    }
}
