using System.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SOMS.Application.Common.Security;
using SOMS.Application.Modules.Admin.DTOs;
using SOMS.Application.Modules.Admin.Interfaces;
using SOMS.Domain.Entities;
using SOMS.Infrastructure.Data;

namespace SOMS.Infrastructure.Services;

public class UserManagementService : IUserManagementService
{
    private readonly SomsDbContext _dbContext;
    private readonly ILogger<UserManagementService> _logger;

    public UserManagementService(SomsDbContext dbContext, ILogger<UserManagementService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<PagedResult<UserItemDto>> GetUsersAsync(UserQueryFilter filter, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Profiles
            .Include(p => p.SchoolMemberships)
                .ThenInclude(m => m.Role)
            .Include(p => p.SchoolMemberships)
                .ThenInclude(m => m.School)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var term = filter.SearchTerm.Trim().ToLower();
            query = query.Where(p => p.FullName.ToLower().Contains(term) || (p.Phone != null && p.Phone.Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(filter.Status))
        {
            query = query.Where(p => p.Status == filter.Status);
        }

        if (!string.IsNullOrWhiteSpace(filter.RoleCode))
        {
            query = query.Where(p => p.SchoolMemberships.Any(m => m.RoleCode == filter.RoleCode));
        }

        if (filter.SchoolId.HasValue)
        {
            query = query.Where(p => p.SchoolMemberships.Any(m => m.SchoolId == filter.SchoolId.Value));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var profiles = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(cancellationToken);

        // Fetch emails from auth.users for these profiles
        var userIds = profiles.Select(p => p.Id).ToList();
        var emailMap = await GetEmailsForUsersAsync(userIds, cancellationToken);

        var items = profiles.Select(p =>
        {
            var primaryMembership = p.SchoolMemberships.FirstOrDefault();
            var roles = p.SchoolMemberships.Select(m => m.RoleCode).Distinct().ToList();
            var roleNamesVi = p.SchoolMemberships.Select(m => m.Role != null ? m.Role.NameVi : RoleCodes.GetRoleNameVi(m.RoleCode)).Distinct().ToList();

            emailMap.TryGetValue(p.Id, out var email);

            return new UserItemDto
            {
                Id = p.Id,
                FullName = p.FullName,
                Email = email ?? $"{p.Id.ToString()[..8]}@soms.edu.vn",
                Phone = p.Phone,
                AvatarPath = p.AvatarPath,
                Status = p.Status,
                Roles = roles,
                RoleNamesVi = roleNamesVi,
                SchoolId = primaryMembership?.SchoolId,
                SchoolName = primaryMembership?.School?.Name,
                CreatedAt = p.CreatedAt,
                LastLoginAt = p.UpdatedAt
            };
        }).ToList();

        return new PagedResult<UserItemDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = filter.Page,
            PageSize = filter.PageSize
        };
    }

    public async Task<UserItemDto?> GetUserByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var p = await _dbContext.Profiles
            .Include(x => x.SchoolMemberships)
                .ThenInclude(m => m.Role)
            .Include(x => x.SchoolMemberships)
                .ThenInclude(m => m.School)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (p == null) return null;

        var emailMap = await GetEmailsForUsersAsync(new List<Guid> { id }, cancellationToken);
        emailMap.TryGetValue(id, out var email);

        var primaryMembership = p.SchoolMemberships.FirstOrDefault();
        return new UserItemDto
        {
            Id = p.Id,
            FullName = p.FullName,
            Email = email ?? $"{p.Id.ToString()[..8]}@soms.edu.vn",
            Phone = p.Phone,
            AvatarPath = p.AvatarPath,
            Status = p.Status,
            Roles = p.SchoolMemberships.Select(m => m.RoleCode).Distinct().ToList(),
            RoleNamesVi = p.SchoolMemberships.Select(m => m.Role != null ? m.Role.NameVi : RoleCodes.GetRoleNameVi(m.RoleCode)).Distinct().ToList(),
            SchoolId = primaryMembership?.SchoolId,
            SchoolName = primaryMembership?.School?.Name,
            CreatedAt = p.CreatedAt,
            LastLoginAt = p.UpdatedAt
        };
    }

    public async Task<UserItemDto> CreateUserAsync(CreateUserRequest request, Guid? createdByUserId = null, CancellationToken cancellationToken = default)
    {
        var newUserId = Guid.NewGuid();
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(string.IsNullOrWhiteSpace(request.Password) ? "Soms@2026" : request.Password);

        // 1. Create entry in auth.users if available
        await InsertAuthUserRecordAsync(newUserId, request.Email, hashedPassword, cancellationToken);

        // 2. Create Profile
        var profile = new Profile
        {
            Id = newUserId,
            FullName = request.FullName,
            Phone = request.Phone,
            Status = "active",
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        _dbContext.Profiles.Add(profile);

        // 3. Assign School and Roles
        var schoolId = request.SchoolId ?? await GetDefaultSchoolIdAsync(cancellationToken);
        if (schoolId != Guid.Empty && request.RoleCodes.Any())
        {
            foreach (var role in request.RoleCodes)
            {
                _dbContext.SchoolMemberships.Add(new SchoolMembership
                {
                    Id = Guid.NewGuid(),
                    UserId = newUserId,
                    SchoolId = schoolId,
                    RoleCode = role,
                    Status = "active",
                    GrantedBy = createdByUserId,
                    CreatedAt = DateTimeOffset.UtcNow
                });
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return (await GetUserByIdAsync(newUserId, cancellationToken))!;
    }

    public async Task<UserItemDto?> UpdateUserAsync(Guid id, UpdateUserRequest request, CancellationToken cancellationToken = default)
    {
        var profile = await _dbContext.Profiles
            .Include(p => p.SchoolMemberships)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (profile == null) return null;

        profile.FullName = request.FullName;
        profile.Phone = request.Phone;
        profile.Status = request.Status;
        profile.UpdatedAt = DateTimeOffset.UtcNow;

        if (request.RoleCodes.Any())
        {
            var defaultSchoolId = profile.SchoolMemberships.FirstOrDefault()?.SchoolId ?? await GetDefaultSchoolIdAsync(cancellationToken);

            // Remove roles not in the new list
            var toRemove = profile.SchoolMemberships.Where(m => !request.RoleCodes.Contains(m.RoleCode)).ToList();
            _dbContext.SchoolMemberships.RemoveRange(toRemove);

            // Add missing roles
            var existingRoles = profile.SchoolMemberships.Select(m => m.RoleCode).ToHashSet();
            foreach (var r in request.RoleCodes)
            {
                if (!existingRoles.Contains(r))
                {
                    _dbContext.SchoolMemberships.Add(new SchoolMembership
                    {
                        Id = Guid.NewGuid(),
                        UserId = id,
                        SchoolId = defaultSchoolId,
                        RoleCode = r,
                        Status = "active",
                        CreatedAt = DateTimeOffset.UtcNow
                    });
                }
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return await GetUserByIdAsync(id, cancellationToken);
    }

    public async Task<bool> SetUserStatusAsync(Guid id, string status, CancellationToken cancellationToken = default)
    {
        var profile = await _dbContext.Profiles.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (profile == null) return false;

        profile.Status = status;
        profile.UpdatedAt = DateTimeOffset.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ResetPasswordAsync(Guid id, string newPassword, CancellationToken cancellationToken = default)
    {
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(newPassword);
        var conn = _dbContext.Database.GetDbConnection();
        if (conn.State != ConnectionState.Open)
        {
            await conn.OpenAsync(cancellationToken);
        }

        try
        {
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "UPDATE auth.users SET encrypted_password = @pwd, updated_at = NOW() WHERE id = @id;";
            
            var pPwd = cmd.CreateParameter();
            pPwd.ParameterName = "pwd";
            pPwd.Value = hashedPassword;
            cmd.Parameters.Add(pPwd);

            var pId = cmd.CreateParameter();
            pId.ParameterName = "id";
            pId.Value = id;
            cmd.Parameters.Add(pId);

            var rows = await cmd.ExecuteNonQueryAsync(cancellationToken);
            return rows > 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update password for user {UserId}", id);
            return false;
        }
    }

    public async Task<BulkImportResult> BulkImportUsersAsync(List<BulkImportUserItem> users, Guid schoolId, CancellationToken cancellationToken = default)
    {
        var result = new BulkImportResult { TotalProcessed = users.Count };
        foreach (var item in users)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(item.FullName) || string.IsNullOrWhiteSpace(item.Email))
                {
                    result.FailureCount++;
                    result.Errors.Add($"Bỏ qua dòng không có tên hoặc email: {item.Email}");
                    continue;
                }

                await CreateUserAsync(new CreateUserRequest
                {
                    FullName = item.FullName.Trim(),
                    Email = item.Email.Trim(),
                    Phone = item.Phone?.Trim(),
                    Password = string.IsNullOrWhiteSpace(item.Password) ? "Soms@2026" : item.Password,
                    RoleCodes = string.IsNullOrWhiteSpace(item.RoleCode) ? new List<string> { RoleCodes.Student } : new List<string> { item.RoleCode },
                    SchoolId = schoolId
                }, null, cancellationToken);

                result.SuccessCount++;
            }
            catch (Exception ex)
            {
                result.FailureCount++;
                result.Errors.Add($"Lỗi tạo user {item.Email}: {ex.Message}");
            }
        }

        return result;
    }

    private async Task<Dictionary<Guid, string>> GetEmailsForUsersAsync(List<Guid> userIds, CancellationToken cancellationToken)
    {
        var dict = new Dictionary<Guid, string>();
        if (!userIds.Any()) return dict;

        var conn = _dbContext.Database.GetDbConnection();
        if (conn.State != ConnectionState.Open)
        {
            await conn.OpenAsync(cancellationToken);
        }

        try
        {
            await using var cmd = conn.CreateCommand();
            var idList = string.Join(",", userIds.Select(id => $"'{id}'"));
            cmd.CommandText = $"SELECT id, email FROM auth.users WHERE id IN ({idList});";

            await using var rdr = await cmd.ExecuteReaderAsync(cancellationToken);
            while (await rdr.ReadAsync(cancellationToken))
            {
                var id = rdr.GetGuid(0);
                var email = rdr.IsDBNull(1) ? string.Empty : rdr.GetString(1);
                dict[id] = email;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not query auth.users emails. Fallback to placeholder.");
        }

        return dict;
    }

    private async Task InsertAuthUserRecordAsync(Guid userId, string email, string hashedPassword, CancellationToken cancellationToken)
    {
        var conn = _dbContext.Database.GetDbConnection();
        if (conn.State != ConnectionState.Open)
        {
            await conn.OpenAsync(cancellationToken);
        }

        try
        {
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = @"
                INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role)
                VALUES (@id, '00000000-0000-0000-0000-000000000000', @email, @pwd, NOW(), NOW(), NOW(), '{\""provider\"":\""email\""}', '{}', false, 'authenticated')
                ON CONFLICT (id) DO NOTHING;";

            var pId = cmd.CreateParameter();
            pId.ParameterName = "id";
            pId.Value = userId;
            cmd.Parameters.Add(pId);

            var pEmail = cmd.CreateParameter();
            pEmail.ParameterName = "email";
            pEmail.Value = email;
            cmd.Parameters.Add(pEmail);

            var pPwd = cmd.CreateParameter();
            pPwd.ParameterName = "pwd";
            pPwd.Value = hashedPassword;
            cmd.Parameters.Add(pPwd);

            await cmd.ExecuteNonQueryAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Insert into auth.users skipped or failed for {Email}", email);
        }
    }

    private async Task<Guid> GetDefaultSchoolIdAsync(CancellationToken cancellationToken)
    {
        var school = await _dbContext.Schools.FirstOrDefaultAsync(cancellationToken);
        return school?.Id ?? Guid.Empty;
    }
}

