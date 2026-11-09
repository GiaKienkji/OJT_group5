namespace SOMS.Application.Modules.Admin.DTOs;

public class SchoolConfigDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Level { get; set; } = "THPT";
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string Status { get; set; } = "active";
}

public class UpdateSchoolConfigRequest
{
    public string Name { get; set; } = string.Empty;
    public string Level { get; set; } = "THPT";
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
}

public class AcademicYearDto
{
    public Guid Id { get; set; }
    public Guid SchoolId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public bool IsActive { get; set; }
    public List<SemesterDto> Semesters { get; set; } = new();
}

public class SemesterDto
{
    public Guid Id { get; set; }
    public Guid AcademicYearId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int TermNumber { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public bool IsCurrent { get; set; }
}

public class CreateAcademicYearRequest
{
    public Guid SchoolId { get; set; }
    public string Code { get; set; } = string.Empty; // e.g. "2025-2026"
    public string Name { get; set; } = string.Empty; // e.g. "Năm học 2025 - 2026"
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public bool IsActive { get; set; } = true;
    public List<CreateSemesterRequest> Semesters { get; set; } = new();
}

public class CreateSemesterRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int TermNumber { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public bool IsCurrent { get; set; }
}

