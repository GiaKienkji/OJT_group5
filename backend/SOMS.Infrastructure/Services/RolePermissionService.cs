using Microsoft.EntityFrameworkCore;
using SOMS.Application.Common.Security;
using SOMS.Application.Modules.Admin.DTOs;
using SOMS.Application.Modules.Admin.Interfaces;
using SOMS.Domain.Entities;
using SOMS.Infrastructure.Data;

namespace SOMS.Infrastructure.Services;

public class RolePermissionService : IRolePermissionService
{
    private readonly SomsDbContext _dbContext;

    public RolePermissionService(SomsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<RoleDetailDto>> GetAllRolesAsync(CancellationToken cancellationToken = default)
    {
        var roles = await _dbContext.Roles
            .Include(r => r.RolePermissions)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var membershipCounts = await _dbContext.SchoolMemberships
            .GroupBy(m => m.RoleCode)
            .Select(g => new { RoleCode = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.RoleCode, x => x.Count, cancellationToken);

        return roles.Select(r => new RoleDetailDto
        {
            Code = r.Code,
            NameVi = r.NameVi,
            Description = r.Description,
            UserCount = membershipCounts.GetValueOrDefault(r.Code, 0),
            PermissionCodes = r.RolePermissions.Select(rp => rp.PermissionCode).ToList()
        }).ToList();
    }

    public async Task<List<PermissionDto>> GetAllPermissionsAsync(CancellationToken cancellationToken = default)
    {
        var permissions = await _dbContext.Permissions
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return permissions.Select(p =>
        {
            var parts = p.Code.Split('.');
            var module = parts.Length > 0 ? parts[0] : "general";
            return new PermissionDto
            {
                Code = p.Code,
                Description = p.Description,
                Module = module
            };
        }).OrderBy(p => p.Module).ThenBy(p => p.Code).ToList();
    }

    public async Task<bool> UpdateRolePermissionsAsync(UpdateRolePermissionsRequest request, CancellationToken cancellationToken = default)
    {
        var role = await _dbContext.Roles
            .Include(r => r.RolePermissions)
            .FirstOrDefaultAsync(r => r.Code == request.RoleCode, cancellationToken);

        if (role == null) return false;

        // Remove old permissions
        _dbContext.RolePermissions.RemoveRange(role.RolePermissions);

        // Add new permissions
        foreach (var pCode in request.PermissionCodes.Distinct())
        {
            _dbContext.RolePermissions.Add(new RolePermission
            {
                RoleCode = request.RoleCode,
                PermissionCode = pCode
            });
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> AssignUserRoleAsync(AssignUserRoleRequest request, Guid? grantedBy = null, CancellationToken cancellationToken = default)
    {
        var exists = await _dbContext.SchoolMemberships
            .AnyAsync(m => m.UserId == request.UserId && m.SchoolId == request.SchoolId && m.RoleCode == request.RoleCode, cancellationToken);

        if (exists) return true;

        _dbContext.SchoolMemberships.Add(new SchoolMembership
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            SchoolId = request.SchoolId,
            RoleCode = request.RoleCode,
            Status = "active",
            GrantedBy = grantedBy,
            CreatedAt = DateTimeOffset.UtcNow
        });

        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> RemoveUserRoleAsync(Guid userId, Guid schoolId, string roleCode, CancellationToken cancellationToken = default)
    {
        var membership = await _dbContext.SchoolMemberships
            .FirstOrDefaultAsync(m => m.UserId == userId && m.SchoolId == schoolId && m.RoleCode == roleCode, cancellationToken);

        if (membership == null) return false;

        _dbContext.SchoolMemberships.Remove(membership);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}

