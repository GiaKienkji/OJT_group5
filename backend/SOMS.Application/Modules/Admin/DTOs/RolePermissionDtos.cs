namespace SOMS.Application.Modules.Admin.DTOs;

public class RoleDetailDto
{
    public string Code { get; set; } = string.Empty;
    public string NameVi { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int UserCount { get; set; }
    public List<string> PermissionCodes { get; set; } = new();
}

public class PermissionDto
{
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Module { get; set; } = "general";
}

public class UpdateRolePermissionsRequest
{
    public string RoleCode { get; set; } = string.Empty;
    public List<string> PermissionCodes { get; set; } = new();
}

public class AssignUserRoleRequest
{
    public Guid UserId { get; set; }
    public Guid SchoolId { get; set; }
    public string RoleCode { get; set; } = string.Empty;
}

