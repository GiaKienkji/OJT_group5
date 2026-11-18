namespace SOMS.Domain.Entities;

public class SchoolClass
{
    public Guid Id { get; set; }
    public Guid SchoolId { get; set; }
    public Guid AcademicYearId { get; set; }
    public Guid GradeLevelId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public Guid? HomeroomStaffId { get; set; }
    public int? Capacity { get; set; }
    public string Status { get; set; } = string.Empty;
    public uint Revision { get; set; }
}
