using SOMS.Application.Modules.Admin.DTOs;

namespace SOMS.Application.Modules.Admin.Interfaces;

public interface ISystemConfigService
{
    Task<SchoolConfigDto?> GetSchoolConfigAsync(Guid schoolId, CancellationToken cancellationToken = default);
    Task<List<SchoolConfigDto>> GetAllSchoolsAsync(CancellationToken cancellationToken = default);
    Task<SchoolConfigDto?> UpdateSchoolConfigAsync(Guid schoolId, UpdateSchoolConfigRequest request, CancellationToken cancellationToken = default);
    Task<List<AcademicYearDto>> GetAcademicYearsAsync(Guid schoolId, CancellationToken cancellationToken = default);
    Task<AcademicYearDto> CreateAcademicYearAsync(CreateAcademicYearRequest request, CancellationToken cancellationToken = default);
    Task<bool> SetActiveAcademicYearAsync(Guid schoolId, Guid academicYearId, CancellationToken cancellationToken = default);
}

