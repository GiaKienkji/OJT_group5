using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SOMS.Api.Authorization;
using SOMS.Application.Common.Security;
using SOMS.Application.Modules.Admin.DTOs;
using SOMS.Application.Modules.Admin.Interfaces;

namespace SOMS.Api.Controllers;

[ApiController]
[Route("api/admin/config")]
[Authorize]
public class AdminConfigController : ControllerBase
{
    private readonly ISystemConfigService _configService;
    private readonly IAuditLogService _auditLogService;

    public AdminConfigController(ISystemConfigService configService, IAuditLogService auditLogService)
    {
        _configService = configService;
        _auditLogService = auditLogService;
    }

    [HttpGet("schools")]
    [RequirePermission(PermissionCodes.SchoolConfigure)]
    public async Task<IActionResult> GetAllSchools(CancellationToken cancellationToken)
    {
        var schools = await _configService.GetAllSchoolsAsync(cancellationToken);
        return Ok(schools);
    }

    [HttpGet("schools/{schoolId:guid}")]
    [RequirePermission(PermissionCodes.SchoolConfigure)]
    public async Task<IActionResult> GetSchoolConfig(Guid schoolId, CancellationToken cancellationToken)
    {
        var school = await _configService.GetSchoolConfigAsync(schoolId, cancellationToken);
        if (school == null) return NotFound(new { message = "Không tìm thấy thông tin trường học." });
        return Ok(school);
    }

    [HttpPut("schools/{schoolId:guid}")]
    [RequirePermission(PermissionCodes.SchoolConfigure)]
    public async Task<IActionResult> UpdateSchoolConfig(Guid schoolId, [FromBody] UpdateSchoolConfigRequest request, CancellationToken cancellationToken)
    {
        var updated = await _configService.UpdateSchoolConfigAsync(schoolId, request, cancellationToken);
        if (updated == null) return NotFound(new { message = "Không tìm thấy thông tin trường để cập nhật." });

        var currentUserId = GetCurrentUserId();
        await _auditLogService.LogAsync(
            action: "UPDATE_SCHOOL_CONFIG",
            entityName: "School",
            entityId: schoolId.ToString(),
            details: $"Cập nhật thông tin trường: {updated.Name}",
            userId: currentUserId,
            schoolId: schoolId,
            cancellationToken: cancellationToken
        );

        return Ok(updated);
    }

    [HttpGet("academic-years/{schoolId:guid}")]
    [RequirePermission(PermissionCodes.SchoolConfigure)]
    public async Task<IActionResult> GetAcademicYears(Guid schoolId, CancellationToken cancellationToken)
    {
        var years = await _configService.GetAcademicYearsAsync(schoolId, cancellationToken);
        return Ok(years);
    }

    [HttpPost("academic-years")]
    [RequirePermission(PermissionCodes.SchoolConfigure)]
    public async Task<IActionResult> CreateAcademicYear([FromBody] CreateAcademicYearRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Code) || string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new { message = "Mã năm học và tên năm học không được để trống." });
        }

        var year = await _configService.CreateAcademicYearAsync(request, cancellationToken);

        var currentUserId = GetCurrentUserId();
        await _auditLogService.LogAsync(
            action: "CREATE_ACADEMIC_YEAR",
            entityName: "AcademicYear",
            entityId: year.Id.ToString(),
            details: $"Tạo niên khóa mới: {year.Name} ({year.Code})",
            userId: currentUserId,
            schoolId: request.SchoolId,
            cancellationToken: cancellationToken
        );

        return Ok(year);
    }

    [HttpPost("academic-years/{academicYearId:guid}/activate")]
    [RequirePermission(PermissionCodes.SchoolConfigure)]
    public async Task<IActionResult> SetActiveAcademicYear([FromQuery] Guid schoolId, Guid academicYearId, CancellationToken cancellationToken)
    {
        var success = await _configService.SetActiveAcademicYearAsync(schoolId, academicYearId, cancellationToken);
        if (!success) return BadRequest(new { message = "Không thể kích hoạt năm học này." });

        return Ok(new { message = "Đã kích hoạt năm học thành công." });
    }

    private Guid? GetCurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return Guid.TryParse(sub, out var g) ? g : null;
    }
}

