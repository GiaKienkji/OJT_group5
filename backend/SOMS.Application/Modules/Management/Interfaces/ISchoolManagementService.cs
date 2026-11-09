using SOMS.Application.Modules.Management.DTOs;

namespace SOMS.Application.Modules.Management.Interfaces;

public interface ISchoolManagementService
{
    Task<ExecutiveDashboardSummaryDto> GetExecutiveSummaryAsync(Guid schoolId, CancellationToken cancellationToken = default);
}

