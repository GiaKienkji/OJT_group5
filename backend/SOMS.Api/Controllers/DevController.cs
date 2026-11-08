using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using SOMS.Application.Common.Interfaces;
using SOMS.Application.Common.Models;

namespace SOMS.Api.Controllers;

[ApiController]
[Route("api/dev")]
public class DevController : ControllerBase
{
    private readonly IDatabaseHealthService _databaseHealthService;
    private readonly IWebHostEnvironment _environment;

    public DevController(
        IDatabaseHealthService databaseHealthService,
        IWebHostEnvironment environment)
    {
        _databaseHealthService = databaseHealthService;
        _environment = environment;
    }

    /// <summary>
    /// Development-only endpoint to verify connectivity to the Supabase PostgreSQL database.
    /// Safe: Never returns database passwords, hosts, or raw exception stack traces.
    /// </summary>
    [HttpGet("database-health")]
    [ProducesResponseType(typeof(DatabaseHealthResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(DatabaseHealthResult), StatusCodes.Status503ServiceUnavailable)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDatabaseHealth(CancellationToken cancellationToken)
    {
        // Enforce Development-only access
        if (!_environment.IsDevelopment())
        {
            return NotFound("Diagnostic endpoints are strictly restricted to the Development environment.");
        }

        var result = await _databaseHealthService.CheckHealthAsync(cancellationToken);

        if (result.Connected)
        {
            return Ok(result);
        }

        return StatusCode(StatusCodes.Status503ServiceUnavailable, result);
    }
}
