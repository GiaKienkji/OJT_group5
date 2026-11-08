using SOMS.Application.Common.Models;

namespace SOMS.Application.Common.Interfaces;

public interface IDatabaseHealthService
{
    Task<DatabaseHealthResult> CheckHealthAsync(CancellationToken cancellationToken = default);
}
