using SOMS.Application.Modules.Management.DTOs;

namespace SOMS.Application.Modules.Management.Interfaces;

public interface ITaskManagementService
{
    Task<List<SchoolTaskDto>> GetTasksAsync(Guid schoolId, string? status = null, string? category = null, CancellationToken cancellationToken = default);
    Task<SchoolTaskDto?> GetTaskByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<SchoolTaskDto> CreateTaskAsync(CreateTaskRequest request, Guid creatorId, CancellationToken cancellationToken = default);
    Task<bool> UpdateProgressAsync(Guid taskId, Guid assigneeId, UpdateTaskProgressRequest request, CancellationToken cancellationToken = default);
    Task<bool> CompleteTaskAsync(Guid taskId, CancellationToken cancellationToken = default);
}

