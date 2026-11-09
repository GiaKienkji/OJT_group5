using SOMS.Application.Modules.Admin.DTOs;

namespace SOMS.Application.Modules.Admin.Interfaces;

public interface IRolePermissionService
{
    Task<List<RoleDetailDto>> GetAllRolesAsync(CancellationToken cancellationToken = default);
    Task<List<PermissionDto>> GetAllPermissionsAsync(CancellationToken cancellationToken = default);
    Task<bool> UpdateRolePermissionsAsync(UpdateRolePermissionsRequest request, CancellationToken cancellationToken = default);
    Task<bool> AssignUserRoleAsync(AssignUserRoleRequest request, Guid? grantedBy = null, CancellationToken cancellationToken = default);
    Task<bool> RemoveUserRoleAsync(Guid userId, Guid schoolId, string roleCode, CancellationToken cancellationToken = default);
}

