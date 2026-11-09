using Microsoft.EntityFrameworkCore;
using SOMS.Application.Common.Security;
using SOMS.Application.Modules.Management.DTOs;
using SOMS.Application.Modules.Management.Interfaces;
using SOMS.Domain.Entities;
using SOMS.Infrastructure.Data;

namespace SOMS.Infrastructure.Services;

public class ApprovalEngineService : IApprovalEngineService
{
    private readonly SomsDbContext _dbContext;

    public ApprovalEngineService(SomsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<ApprovalRequestItemDto>> GetApprovalRequestsAsync(ApprovalFilter filter, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.ApprovalRequests
            .Include(r => r.Requester)
            .Include(r => r.ApprovalHistories)
                .ThenInclude(h => h.Actor)
            .AsNoTracking();

        if (filter.SchoolId.HasValue)
        {
            query = query.Where(r => r.SchoolId == filter.SchoolId.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.Status))
        {
            query = query.Where(r => r.Status == filter.Status);
        }

        if (!string.IsNullOrWhiteSpace(filter.RequestType))
        {
            query = query.Where(r => r.RequestType == filter.RequestType);
        }

        if (!string.IsNullOrWhiteSpace(filter.Priority))
        {
            query = query.Where(r => r.Priority == filter.Priority);
        }

        if (filter.RequesterId.HasValue)
        {
            query = query.Where(r => r.RequesterId == filter.RequesterId.Value);
        }

        var list = await query.OrderByDescending(r => r.CreatedAt).ToListAsync(cancellationToken);

        return list.Select(MapToDto).ToList();
    }

    public async Task<ApprovalRequestItemDto?> GetApprovalRequestByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var item = await _dbContext.ApprovalRequests
            .Include(r => r.Requester)
            .Include(r => r.ApprovalHistories)
                .ThenInclude(h => h.Actor)
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        return item == null ? null : MapToDto(item);
    }

    public async Task<ApprovalRequestItemDto> CreateRequestAsync(CreateApprovalRequest request, Guid requesterId, CancellationToken cancellationToken = default)
    {
        var code = $"REQ-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}";
        var entity = new ApprovalRequest
        {
            Id = Guid.NewGuid(),
            SchoolId = request.SchoolId,
            RequestCode = code,
            RequestType = request.RequestType,
            RequesterId = requesterId,
            Title = request.Title,
            Description = request.Description,
            PayloadJson = request.PayloadJson,
            Priority = string.IsNullOrWhiteSpace(request.Priority) ? "medium" : request.Priority,
            Status = "pending",
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        entity.ApprovalHistories.Add(new ApprovalHistory
        {
            Id = Guid.NewGuid(),
            RequestId = entity.Id,
            Action = "created",
            PerformedBy = requesterId,
            Note = "Khởi tạo yêu cầu phê duyệt.",
            CreatedAt = DateTimeOffset.UtcNow
        });

        _dbContext.ApprovalRequests.Add(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return (await GetApprovalRequestByIdAsync(entity.Id, cancellationToken))!;
    }

    public async Task<bool> ProcessDecisionAsync(Guid id, ApprovalDecisionRequest decision, Guid approverId, CancellationToken cancellationToken = default)
    {
        var request = await _dbContext.ApprovalRequests.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
        if (request == null) return false;

        var normalizedStatus = decision.Decision.Equals("approved", StringComparison.OrdinalIgnoreCase) ? "approved" : "rejected";

        request.Status = normalizedStatus;
        request.CurrentApproverId = approverId;
        request.FinalDecisionAt = DateTimeOffset.UtcNow;
        request.UpdatedAt = DateTimeOffset.UtcNow;

        _dbContext.ApprovalHistories.Add(new ApprovalHistory
        {
            Id = Guid.NewGuid(),
            RequestId = request.Id,
            Action = normalizedStatus,
            PerformedBy = approverId,
            Note = decision.Note ?? (normalizedStatus == "approved" ? "Đã phê duyệt." : "Từ chối yêu cầu."),
            CreatedAt = DateTimeOffset.UtcNow
        });

        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static ApprovalRequestItemDto MapToDto(ApprovalRequest r)
    {
        var typeNameVi = r.RequestType switch
        {
            "leave_teacher" => "Nghỉ phép giáo viên",
            "leave_student" => "Học sinh xin nghỉ",
            "timetable_change" => "Đổi tiết giảng dạy",
            "substitute_teaching" => "Đề xuất dạy thay",
            "facility_purchase" => "Đề xuất mua sắm CSVC",
            "facility_repair" => "Báo hỏng / Sửa chữa CSVC",
            "grade_change" => "Chỉnh sửa điểm đã khóa",
            _ => "Yêu cầu hành chính"
        };

        return new ApprovalRequestItemDto
        {
            Id = r.Id,
            RequestCode = r.RequestCode,
            RequestType = r.RequestType,
            RequestTypeNameVi = typeNameVi,
            RequesterId = r.RequesterId,
            RequesterName = r.Requester?.FullName ?? "Người dùng",
            Title = r.Title,
            Description = r.Description,
            PayloadJson = r.PayloadJson,
            Status = r.Status,
            Priority = r.Priority,
            CreatedAt = r.CreatedAt,
            FinalDecisionAt = r.FinalDecisionAt,
            Histories = r.ApprovalHistories.OrderByDescending(h => h.CreatedAt).Select(h => new ApprovalHistoryItemDto
            {
                Id = h.Id,
                Action = h.Action,
                ActorName = h.Actor?.FullName ?? "Hệ thống",
                Note = h.Note,
                CreatedAt = h.CreatedAt
            }).ToList()
        };
    }
}

