namespace SOMS.Domain.Entities;

public class AcademicYear
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SchoolId { get; set; }
    public string Code { get; set; } = string.Empty; // e.g. "2025-2026"
    public string Name { get; set; } = string.Empty; // e.g. "Năm học 2025 - 2026"
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public School School { get; set; } = null!;
    public ICollection<Semester> Semesters { get; set; } = new List<Semester>();
}

public class Semester
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AcademicYearId { get; set; }
    public string Code { get; set; } = string.Empty; // e.g. "HK1", "HK2"
    public string Name { get; set; } = string.Empty; // e.g. "Học kỳ 1"
    public int TermNumber { get; set; } = 1; // 1 hoặc 2
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public bool IsCurrent { get; set; } = false;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public AcademicYear AcademicYear { get; set; } = null!;
}

