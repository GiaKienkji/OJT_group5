namespace SOMS.Domain.Entities;

public class Role
{
    public string Code { get; set; } = string.Empty;
    public string NameVi { get; set; } = string.Empty;
    public string? Description { get; set; }

    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
    public ICollection<SchoolMembership> SchoolMemberships { get; set; } = new List<SchoolMembership>();
}
