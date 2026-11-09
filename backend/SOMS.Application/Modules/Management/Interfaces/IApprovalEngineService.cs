using SOMS.Application.Modules.Management.DTOs;

namespace SOMS.Application.Modules.Management.Interfaces;

public interface IApprovalEngineService
{
    Task<List<ApprovalRequestItemDto>> GetApprovalRequestsAsync(ApprovalFilter filter, CancellationToken cancellationToken = default);
    Task<ApprovalRequestItemDto?> GetApprovalRequestByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApprovalRequestItemDto> CreateRequestAsync(CreateApprovalRequest request, Guid requesterId, CancellationToken cancellationToken = default);
    Task<bool> ProcessDecisionAsync(Guid id, ApprovalDecisionRequest decision, Guid approverId, CancellationToken cancellationToken = default);
}

