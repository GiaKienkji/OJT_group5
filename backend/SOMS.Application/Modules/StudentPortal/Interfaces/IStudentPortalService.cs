using SOMS.Application.Modules.StudentPortal.DTOs;

namespace SOMS.Application.Modules.StudentPortal.Interfaces;

public interface IStudentPortalService
{
    Task<StudentProfileDto?> GetProfileAsync(Guid userId, CancellationToken ct = default);
    Task<StudentDashboardDto> GetDashboardAsync(Guid userId, CancellationToken ct = default);
    Task<StudentClassDto?> GetClassInfoAsync(Guid userId, CancellationToken ct = default);
    Task<List<TimetableItemDto>> GetTimetableAsync(Guid userId, int? weekday = null, string? session = null, CancellationToken ct = default);
    Task<List<TimetableChangeNotificationDto>> GetTimetableChangesAsync(Guid userId, CancellationToken ct = default);
    Task<AttendanceSummaryDto> GetAttendanceAsync(Guid userId, string? semester = null, string? month = null, string? academicYear = null, CancellationToken ct = default);
    Task<StudentAcademicSummaryDto> GetGradesAsync(Guid userId, string? semester = null, string? academicYear = null, CancellationToken ct = default);
    Task<List<ExamItemDto>> GetExamsAsync(Guid userId, CancellationToken ct = default);
    Task<ExamScheduleSummaryDto> GetExamScheduleSummaryAsync(Guid userId, string? semester = null, string? academicYear = null, string? examPeriod = null, CancellationToken ct = default);
    Task<List<AnnouncementItemDto>> GetAnnouncementsAsync(Guid userId, CancellationToken ct = default);
    Task<bool> MarkAnnouncementAsReadAsync(Guid userId, Guid announcementId, CancellationToken ct = default);
    Task<StudentFeeSummaryDto> GetFeesAsync(Guid userId, CancellationToken ct = default);
    Task<List<SupportRequestDto>> GetSupportRequestsAsync(Guid userId, CancellationToken ct = default);
    Task<SupportRequestDto> CreateSupportRequestAsync(Guid userId, CreateSupportRequestDto request, CancellationToken ct = default);
    Task<ProfileUpdateRequestDto> SubmitProfileUpdateRequestAsync(Guid userId, CreateProfileUpdateRequestInput input, CancellationToken ct = default);
    Task<bool> UpdateContactAsync(Guid userId, UpdateStudentContactDto input, CancellationToken ct = default);
    Task<bool> ChangePasswordAsync(Guid userId, ChangePasswordRequest input, CancellationToken ct = default);
}
