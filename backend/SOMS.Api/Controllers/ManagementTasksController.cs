using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SOMS.Api.Authorization;
using SOMS.Application.Common.Security;
using SOMS.Application.Modules.Admin.Interfaces;
using SOMS.Application.Modules.Management.DTOs;
using SOMS.Application.Modules.Management.Interfaces;

namespace SOMS.Api.Controllers;

[ApiController]
[Route("api/management/tasks")]
[Authorize]
public class ManagementTasksController : ControllerBase
{
    private readonly ITaskManagementService _taskService;
    private readonly IAuditLogService _auditLogService;

    public ManagementTasksController(ITaskManagementService taskService, IAuditLogService auditLogService)
    {
        _taskService = taskService;
        _auditLogService = auditLogService;
    }

    [HttpGet]
    public async Task<IActionResult> GetTasks([FromQuery] Guid schoolId, [FromQuery] string? status = null, [FromQuery] string? category = null, CancellationToken cancellationToken = default)
    {
        var tasks = await _taskService.GetTasksAsync(schoolId, status, category, cancellationToken);
        return Ok(tasks);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetTaskById(Guid id, CancellationToken cancellationToken)
    {
        var task = await _taskService.GetTaskByIdAsync(id, cancellationToken);
        if (task == null) return NotFound(new { message = "Không tìm thấy nhiệm vụ." });
        return Ok(task);
    }

    [HttpPost]
    [RequirePermission(PermissionCodes.OperationsView)]
    public async Task<IActionResult> CreateTask([FromBody] CreateTaskRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest(new { message = "Tiêu đề nhiệm vụ không được để trống." });
        }

        var currentUserId = GetCurrentUserId();
        if (currentUserId == null) return Unauthorized();

        var created = await _taskService.CreateTaskAsync(request, currentUserId.Value, cancellationToken);

        await _auditLogService.LogAsync(
            action: "CREATE_TASK",
            entityName: "SchoolTask",
            entityId: created.Id.ToString(),
            details: $"Giao nhiệm vụ: {created.Title}",
            userId: currentUserId,
            schoolId: request.SchoolId,
            cancellationToken: cancellationToken
        );

        return CreatedAtAction(nameof(GetTaskById), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}/progress")]
    public async Task<IActionResult> UpdateProgress(Guid id, [FromBody] UpdateTaskProgressRequest request, CancellationToken cancellationToken)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null) return Unauthorized();

        var success = await _taskService.UpdateProgressAsync(id, currentUserId.Value, request, cancellationToken);
        if (!success) return BadRequest(new { message = "Không thể cập nhật tiến độ nhiệm vụ." });

        return Ok(new { message = "Cập nhật tiến độ thành công." });
    }

    [HttpPost("{id:guid}/complete")]
    [RequirePermission(PermissionCodes.OperationsView)]
    public async Task<IActionResult> CompleteTask(Guid id, CancellationToken cancellationToken)
    {
        var success = await _taskService.CompleteTaskAsync(id, cancellationToken);
        if (!success) return NotFound(new { message = "Không tìm thấy nhiệm vụ." });

        return Ok(new { message = "Đã xác nhận hoàn thành nhiệm vụ." });
    }

    private Guid? GetCurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return Guid.TryParse(sub, out var g) ? g : null;
    }
}

