using Microsoft.EntityFrameworkCore;
using SOMS.Application.Modules.Management.DTOs;
using SOMS.Application.Modules.Management.Interfaces;
using SOMS.Domain.Entities;
using SOMS.Infrastructure.Data;

namespace SOMS.Infrastructure.Services;

public class TaskManagementService : ITaskManagementService
{
    private readonly SomsDbContext _dbContext;

    public TaskManagementService(SomsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<SchoolTaskDto>> GetTasksAsync(Guid schoolId, string? status = null, string? category = null, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.SchoolTasks
            .Include(t => t.Creator)
            .Include(t => t.Assignments)
                .ThenInclude(a => a.Assignee)
            .Where(t => t.SchoolId == schoolId)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(t => t.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(t => t.Category == category);
        }

        var list = await query.OrderByDescending(t => t.CreatedAt).ToListAsync(cancellationToken);
        return list.Select(MapToDto).ToList();
    }

    public async Task<SchoolTaskDto?> GetTaskByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var t = await _dbContext.SchoolTasks
            .Include(t => t.Creator)
            .Include(t => t.Assignments)
                .ThenInclude(a => a.Assignee)
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

        return t == null ? null : MapToDto(t);
    }

    public async Task<SchoolTaskDto> CreateTaskAsync(CreateTaskRequest request, Guid creatorId, CancellationToken cancellationToken = default)
    {
        var task = new SchoolTask
        {
            Id = Guid.NewGuid(),
            SchoolId = request.SchoolId,
            Title = request.Title,
            Description = request.Description,
            Category = string.IsNullOrWhiteSpace(request.Category) ? "general" : request.Category,
            Priority = string.IsNullOrWhiteSpace(request.Priority) ? "medium" : request.Priority,
            Status = "not_started",
            CreatedBy = creatorId,
            DueDate = request.DueDate,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        if (request.AssigneeIds.Any())
        {
            foreach (var assigneeId in request.AssigneeIds)
            {
                task.Assignments.Add(new TaskAssignment
                {
                    Id = Guid.NewGuid(),
                    TaskId = task.Id,
                    AssigneeId = assigneeId,
                    RoleInTask = "owner",
                    ProgressPercent = 0,
                    AssignedAt = DateTimeOffset.UtcNow
                });
            }
        }

        _dbContext.SchoolTasks.Add(task);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return (await GetTaskByIdAsync(task.Id, cancellationToken))!;
    }

    public async Task<bool> UpdateProgressAsync(Guid taskId, Guid assigneeId, UpdateTaskProgressRequest request, CancellationToken cancellationToken = default)
    {
        var assignment = await _dbContext.TaskAssignments
            .Include(a => a.Task)
            .FirstOrDefaultAsync(a => a.TaskId == taskId && a.AssigneeId == assigneeId, cancellationToken);

        if (assignment == null) return false;

        assignment.ProgressPercent = Math.Clamp(request.ProgressPercent, 0, 100);
        if (!string.IsNullOrWhiteSpace(request.Note))
        {
            assignment.Note = request.Note;
        }

        if (assignment.Task != null)
        {
            if (assignment.ProgressPercent >= 100)
            {
                assignment.Task.Status = "completed";
                assignment.Task.CompletedAt = DateTimeOffset.UtcNow;
            }
            else if (assignment.ProgressPercent > 0)
            {
                assignment.Task.Status = "in_progress";
            }
            assignment.Task.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> CompleteTaskAsync(Guid taskId, CancellationToken cancellationToken = default)
    {
        var task = await _dbContext.SchoolTasks.Include(t => t.Assignments).FirstOrDefaultAsync(t => t.Id == taskId, cancellationToken);
        if (task == null) return false;

        task.Status = "completed";
        task.CompletedAt = DateTimeOffset.UtcNow;
        task.UpdatedAt = DateTimeOffset.UtcNow;

        foreach (var a in task.Assignments)
        {
            a.ProgressPercent = 100;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static SchoolTaskDto MapToDto(SchoolTask t)
    {
        var catVi = t.Category switch
        {
            "academic" => "Chuyên môn",
            "facility" => "Cơ sở vật chất",
            "administrative" => "Hành chính",
            "event" => "Sự kiện",
            _ => "Tổng hợp"
        };

        return new SchoolTaskDto
        {
            Id = t.Id,
            Title = t.Title,
            Description = t.Description,
            Category = t.Category,
            CategoryNameVi = catVi,
            CreatedBy = t.CreatedBy,
            CreatorName = t.Creator?.FullName ?? "Ban giám hiệu",
            Priority = t.Priority,
            Status = t.Status,
            DueDate = t.DueDate,
            CompletedAt = t.CompletedAt,
            CreatedAt = t.CreatedAt,
            Assignments = t.Assignments.Select(a => new TaskAssignmentDto
            {
                Id = a.Id,
                AssigneeId = a.AssigneeId,
                AssigneeName = a.Assignee?.FullName ?? "Cán bộ phụ trách",
                RoleInTask = a.RoleInTask,
                ProgressPercent = a.ProgressPercent,
                Note = a.Note,
                AssignedAt = a.AssignedAt
            }).ToList()
        };
    }
}

