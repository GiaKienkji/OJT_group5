namespace SOMS.Application.Modules.Admin.DTOs;

public class UserItemDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? AvatarPath { get; set; }
    public string Status { get; set; } = "active"; // "active", "locked", "inactive"
    public List<string> Roles { get; set; } = new();
    public List<string> RoleNamesVi { get; set; } = new();
    public Guid? SchoolId { get; set; }
    public string? SchoolName { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? LastLoginAt { get; set; }
}

public class CreateUserRequest
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Password { get; set; } = string.Empty;
    public List<string> RoleCodes { get; set; } = new();
    public Guid? SchoolId { get; set; }
}

public class UpdateUserRequest
{
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Status { get; set; } = "active";
    public List<string> RoleCodes { get; set; } = new();
}

public class UserQueryFilter
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SearchTerm { get; set; }
    public string? RoleCode { get; set; }
    public string? Status { get; set; }
    public Guid? SchoolId { get; set; }
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
}

public class ResetPasswordRequest
{
    public string NewPassword { get; set; } = string.Empty;
}

public class BulkImportUserItem
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string RoleCode { get; set; } = string.Empty;
    public string? Password { get; set; }
}

public class BulkImportResult
{
    public int TotalProcessed { get; set; }
    public int SuccessCount { get; set; }
    public int FailureCount { get; set; }
    public List<string> Errors { get; set; } = new();
}

