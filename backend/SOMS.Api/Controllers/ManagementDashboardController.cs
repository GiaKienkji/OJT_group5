using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SOMS.Api.Authorization;
using SOMS.Application.Common.Security;
using SOMS.Application.Modules.Management.Interfaces;

namespace SOMS.Api.Controllers;

[ApiController]
[Route("api/management/dashboard")]
[Authorize]
public class ManagementDashboardController : ControllerBase
{
    private readonly ISchoolManagementService _managementService;

    public ManagementDashboardController(ISchoolManagementService managementService)
    {
        _managementService = managementService;
    }

    [HttpGet("summary")]
    [RequirePermission(PermissionCodes.OperationsView)]
    public async Task<IActionResult> GetExecutiveSummary([FromQuery] Guid schoolId, CancellationToken cancellationToken)
    {
        var summary = await _managementService.GetExecutiveSummaryAsync(schoolId, cancellationToken);
        return Ok(summary);
    }
}

