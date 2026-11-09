using SOMS.Application.Modules.Admin.DTOs;

namespace SOMS.Application.Modules.Admin.Interfaces;

public interface IUserManagementService
{
    Task<PagedResult<UserItemDto>> GetUsersAsync(UserQueryFilter filter, CancellationToken cancellationToken = default);
    Task<UserItemDto?> GetUserByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<UserItemDto> CreateUserAsync(CreateUserRequest request, Guid? createdByUserId = null, CancellationToken cancellationToken = default);
    Task<UserItemDto?> UpdateUserAsync(Guid id, UpdateUserRequest request, CancellationToken cancellationToken = default);
    Task<bool> SetUserStatusAsync(Guid id, string status, CancellationToken cancellationToken = default);
    Task<bool> ResetPasswordAsync(Guid id, string newPassword, CancellationToken cancellationToken = default);
    Task<BulkImportResult> BulkImportUsersAsync(List<BulkImportUserItem> users, Guid schoolId, CancellationToken cancellationToken = default);
}

