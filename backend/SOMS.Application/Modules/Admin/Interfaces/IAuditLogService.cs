using SOMS.Application.Modules.Admin.DTOs;

namespace SOMS.Application.Modules.Admin.Interfaces;

public interface IAuditLogService
{
    Task<PagedResult<AuditLogItemDto>> GetAuditLogsAsync(int page, int pageSize, string? actionFilter = null, CancellationToken cancellationToken = default);
    Task LogAsync(string action, string? entityName = null, string? entityId = null, string? details = null, Guid? userId = null, Guid? schoolId = null, string? ipAddress = null, string? userAgent = null, CancellationToken cancellationToken = default);
    Task<List<UserSessionItemDto>> GetActiveSessionsAsync(Guid? schoolId = null, CancellationToken cancellationToken = default);
    Task<bool> RevokeSessionAsync(Guid sessionId, CancellationToken cancellationToken = default);
    Task<SystemHealthStatusDto> GetSystemHealthAsync(CancellationToken cancellationToken = default);
}

