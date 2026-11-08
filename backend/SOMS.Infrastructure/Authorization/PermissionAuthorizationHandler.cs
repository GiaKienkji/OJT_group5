using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SOMS.Infrastructure.Data;

namespace SOMS.Infrastructure.Authorization;

public class PermissionRequirement : IAuthorizationRequirement
{
    public string Permission { get; }

    public PermissionRequirement(string permission)
    {
        Permission = permission;
    }
}

public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    private readonly IServiceScopeFactory _scopeFactory;

    public PermissionAuthorizationHandler(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        var user = context.User;
        if (user.Identity == null || !user.Identity.IsAuthenticated)
        {
            return;
        }

        // 1. Fast path: Check permission claim from JWT
        var permClaims = user.FindAll("permissions").Select(c => c.Value);
        if (permClaims.Contains(requirement.Permission, StringComparer.OrdinalIgnoreCase))
        {
            context.Succeed(requirement);
            return;
        }

        // 2. Dynamic DB path: revalidate permissions against database (anti-stale / role change check)
        var userIdStr = user.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdStr, out var userId))
        {
            return;
        }

        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SomsDbContext>();

        var hasPermission = await db.SchoolMemberships
            .Where(m => m.UserId == userId && m.Status == "active")
            .Join(db.RolePermissions,
                m => m.RoleCode.ToLower(),
                rp => rp.RoleCode.ToLower(),
                (m, rp) => rp.PermissionCode)
            .AnyAsync(p => p.ToLower() == requirement.Permission.ToLower());

        if (hasPermission)
        {
            context.Succeed(requirement);
        }
    }
}
