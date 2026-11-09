using Microsoft.EntityFrameworkCore;
using SOMS.Application.Modules.Admin.DTOs;
using SOMS.Application.Modules.Admin.Interfaces;
using SOMS.Domain.Entities;
using SOMS.Infrastructure.Data;

namespace SOMS.Infrastructure.Services;

public class AuditLogService : IAuditLogService
{
    private readonly SomsDbContext _dbContext;

    public AuditLogService(SomsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PagedResult<AuditLogItemDto>> GetAuditLogsAsync(int page, int pageSize, string? actionFilter = null, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.AuditLogs
            .Include(l => l.User)
            .Include(l => l.School)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(actionFilter))
        {
            query = query.Where(l => l.Action == actionFilter);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var list = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<AuditLogItemDto>
        {
            Items = list.Select(l => new AuditLogItemDto
            {
                Id = l.Id,
                Action = l.Action,
                EntityName = l.EntityName,
                EntityId = l.EntityId,
                Details = l.Details,
                IpAddress = l.IpAddress,
                UserFullName = l.User?.FullName,
                SchoolName = l.School?.Name,
                CreatedAt = l.CreatedAt
            }).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task LogAsync(string action, string? entityName = null, string? entityId = null, string? details = null, Guid? userId = null, Guid? schoolId = null, string? ipAddress = null, string? userAgent = null, CancellationToken cancellationToken = default)
    {
        var log = new AuditLog
        {
            Id = Guid.NewGuid(),
            Action = action,
            EntityName = entityName,
            EntityId = entityId,
            Details = details,
            UserId = userId,
            SchoolId = schoolId,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _dbContext.AuditLogs.Add(log);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<List<UserSessionItemDto>> GetActiveSessionsAsync(Guid? schoolId = null, CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;
        var query = _dbContext.UserSessions
            .Include(s => s.Profile)
            .Where(s => s.RevokedAt == null && s.ExpiresAt > now)
            .AsNoTracking();

        var sessions = await query.OrderByDescending(s => s.CreatedAt).Take(50).ToListAsync(cancellationToken);

        return sessions.Select(s => new UserSessionItemDto
        {
            Id = s.Id,
            UserId = s.UserId,
            UserFullName = s.Profile?.FullName ?? "Unknown",
            IpAddress = s.IpAddress,
            UserAgent = s.UserAgent,
            IsRevoked = s.RevokedAt != null,
            CreatedAt = s.CreatedAt,
            ExpiresAt = s.ExpiresAt
        }).ToList();
    }

    public async Task<bool> RevokeSessionAsync(Guid sessionId, CancellationToken cancellationToken = default)
    {
        var session = await _dbContext.UserSessions.FirstOrDefaultAsync(s => s.Id == sessionId, cancellationToken);
        if (session == null) return false;

        session.RevokedAt = DateTimeOffset.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<SystemHealthStatusDto> GetSystemHealthAsync(CancellationToken cancellationToken = default)
    {
        var totalUsers = await _dbContext.Profiles.CountAsync(cancellationToken);
        var activeSessions = await _dbContext.UserSessions.CountAsync(s => s.RevokedAt == null && s.ExpiresAt > DateTimeOffset.UtcNow, cancellationToken);
        var totalSchools = await _dbContext.Schools.CountAsync(cancellationToken);

        return new SystemHealthStatusDto
        {
            Status = "Healthy",
            ServerTime = DateTime.UtcNow,
            TotalUsersCount = totalUsers,
            ActiveUsersCount = activeSessions,
            TotalSchoolsCount = totalSchools,
            DatabaseConnection = "Connected"
        };
    }
}
