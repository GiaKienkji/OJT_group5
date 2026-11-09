using Microsoft.EntityFrameworkCore;
using SOMS.Application.Modules.Admin.DTOs;
using SOMS.Application.Modules.Admin.Interfaces;
using SOMS.Domain.Entities;
using SOMS.Infrastructure.Data;

namespace SOMS.Infrastructure.Services;

public class SystemConfigService : ISystemConfigService
{
    private readonly SomsDbContext _dbContext;

    public SystemConfigService(SomsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<SchoolConfigDto?> GetSchoolConfigAsync(Guid schoolId, CancellationToken cancellationToken = default)
    {
        var s = await _dbContext.Schools.AsNoTracking().FirstOrDefaultAsync(x => x.Id == schoolId, cancellationToken);
        if (s == null) return null;

        return new SchoolConfigDto
        {
            Id = s.Id,
            Code = s.Code,
            Name = s.Name,
            Level = s.Level,
            Email = s.Email,
            Phone = s.Phone,
            Address = s.Address,
            Status = s.Status
        };
    }

    public async Task<List<SchoolConfigDto>> GetAllSchoolsAsync(CancellationToken cancellationToken = default)
    {
        var schools = await _dbContext.Schools.AsNoTracking().ToListAsync(cancellationToken);
        return schools.Select(s => new SchoolConfigDto
        {
            Id = s.Id,
            Code = s.Code,
            Name = s.Name,
            Level = s.Level,
            Email = s.Email,
            Phone = s.Phone,
            Address = s.Address,
            Status = s.Status
        }).ToList();
    }

    public async Task<SchoolConfigDto?> UpdateSchoolConfigAsync(Guid schoolId, UpdateSchoolConfigRequest request, CancellationToken cancellationToken = default)
    {
        var s = await _dbContext.Schools.FirstOrDefaultAsync(x => x.Id == schoolId, cancellationToken);
        if (s == null) return null;

        s.Name = request.Name;
        s.Level = request.Level;
        s.Email = request.Email;
        s.Phone = request.Phone;
        s.Address = request.Address;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return await GetSchoolConfigAsync(schoolId, cancellationToken);
    }

    public async Task<List<AcademicYearDto>> GetAcademicYearsAsync(Guid schoolId, CancellationToken cancellationToken = default)
    {
        var list = await _dbContext.AcademicYears
            .Include(y => y.Semesters)
            .Where(y => y.SchoolId == schoolId)
            .OrderByDescending(y => y.StartDate)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return list.Select(y => new AcademicYearDto
        {
            Id = y.Id,
            SchoolId = y.SchoolId,
            Code = y.Code,
            Name = y.Name,
            StartDate = y.StartDate,
            EndDate = y.EndDate,
            IsActive = y.IsActive,
            Semesters = y.Semesters.OrderBy(s => s.TermNumber).Select(s => new SemesterDto
            {
                Id = s.Id,
                AcademicYearId = s.AcademicYearId,
                Code = s.Code,
                Name = s.Name,
                TermNumber = s.TermNumber,
                StartDate = s.StartDate,
                EndDate = s.EndDate,
                IsCurrent = s.IsCurrent
            }).ToList()
        }).ToList();
    }

    public async Task<AcademicYearDto> CreateAcademicYearAsync(CreateAcademicYearRequest request, CancellationToken cancellationToken = default)
    {
        var year = new AcademicYear
        {
            Id = Guid.NewGuid(),
            SchoolId = request.SchoolId,
            Code = request.Code,
            Name = request.Name,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            IsActive = request.IsActive,
            CreatedAt = DateTimeOffset.UtcNow
        };

        if (request.Semesters.Any())
        {
            foreach (var s in request.Semesters)
            {
                year.Semesters.Add(new Semester
                {
                    Id = Guid.NewGuid(),
                    AcademicYearId = year.Id,
                    Code = s.Code,
                    Name = s.Name,
                    TermNumber = s.TermNumber,
                    StartDate = s.StartDate,
                    EndDate = s.EndDate,
                    IsCurrent = s.IsCurrent,
                    CreatedAt = DateTimeOffset.UtcNow
                });
            }
        }
        else
        {
            // Create default Semester 1 & 2
            year.Semesters.Add(new Semester
            {
                Id = Guid.NewGuid(),
                AcademicYearId = year.Id,
                Code = "HK1",
                Name = "Học kỳ 1",
                TermNumber = 1,
                StartDate = request.StartDate,
                EndDate = request.StartDate.AddMonths(5),
                IsCurrent = true,
                CreatedAt = DateTimeOffset.UtcNow
            });
            year.Semesters.Add(new Semester
            {
                Id = Guid.NewGuid(),
                AcademicYearId = year.Id,
                Code = "HK2",
                Name = "Học kỳ 2",
                TermNumber = 2,
                StartDate = request.StartDate.AddMonths(5).AddDays(1),
                EndDate = request.EndDate,
                IsCurrent = false,
                CreatedAt = DateTimeOffset.UtcNow
            });
        }

        _dbContext.AcademicYears.Add(year);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return (await GetAcademicYearsAsync(request.SchoolId, cancellationToken)).First(y => y.Id == year.Id);
    }

    public async Task<bool> SetActiveAcademicYearAsync(Guid schoolId, Guid academicYearId, CancellationToken cancellationToken = default)
    {
        var years = await _dbContext.AcademicYears.Where(y => y.SchoolId == schoolId).ToListAsync(cancellationToken);
        foreach (var y in years)
        {
            y.IsActive = (y.Id == academicYearId);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}

