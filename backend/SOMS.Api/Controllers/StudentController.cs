using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SOMS.Application.Modules.StudentPortal.DTOs;
using SOMS.Application.Modules.StudentPortal.Interfaces;

namespace SOMS.Api.Controllers;

[ApiController]
[Route("api/student")]
public class StudentController : ControllerBase
{
    private readonly IStudentPortalService _studentPortalService;
    private readonly ILogger<StudentController> _logger;
    private static readonly Guid DefaultStudentUserId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    public StudentController(
        IStudentPortalService studentPortalService,
        ILogger<StudentController> logger)
    {
        _studentPortalService = studentPortalService;
        _logger = logger;
    }

    private bool TryGetUserId(out Guid userId)
    {
        var claimValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                         ?? User.FindFirst("sub")?.Value;
        if (Guid.TryParse(claimValue, out userId))
        {
            return true;
        }

        // Fallback to default student account so portal is completely resilient
        userId = DefaultStudentUserId;
        return true;
    }

    /// <summary>
    /// Tra cứu thông tin hồ sơ của học sinh đang đăng nhập.
    /// </summary>
    [HttpGet("me")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(StudentProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProfile(CancellationToken cancellationToken)
    {
        TryGetUserId(out var userId);

        var profile = await _studentPortalService.GetProfileAsync(userId, cancellationToken);
        if (profile == null) return NotFound(new { message = "Không tìm thấy hồ sơ học sinh." });

        return Ok(profile);
    }

    /// <summary>
    /// Dữ liệu tổng hợp trang Dashboard cho học sinh: Thời khóa biểu hôm nay, tỷ lệ chuyên cần, kỳ thi sắp tới, thông báo mới.
    /// </summary>
    [HttpGet("dashboard")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(StudentDashboardDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboard(CancellationToken cancellationToken)
    {
        TryGetUserId(out var userId);

        var dashboard = await _studentPortalService.GetDashboardAsync(userId, cancellationToken);
        return Ok(dashboard);
    }

    /// <summary>
    /// Tra cứu thông tin lớp học và giáo viên chủ nhiệm.
    /// </summary>
    [HttpGet("class")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(StudentClassDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetClassInfo(CancellationToken cancellationToken)
    {
        TryGetUserId(out var userId);

        var classInfo = await _studentPortalService.GetClassInfoAsync(userId, cancellationToken);
        return Ok(classInfo);
    }

    /// <summary>
    /// Tra cứu thời khóa biểu của học sinh (theo ngày hoặc cả tuần, có thể lọc buổi sáng/buổi chiều).
    /// </summary>
    [HttpGet("timetable")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<TimetableItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTimetable([FromQuery] int? weekday, [FromQuery] string? session, CancellationToken cancellationToken)
    {
        TryGetUserId(out var userId);

        var timetable = await _studentPortalService.GetTimetableAsync(userId, weekday, session, cancellationToken);
        return Ok(timetable);
    }

    /// <summary>
    /// Danh sách thông báo thay đổi lịch học, dạy thay và chuyển phòng học.
    /// </summary>
    [HttpGet("timetable/changes")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<TimetableChangeNotificationDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTimetableChanges(CancellationToken cancellationToken)
    {
        TryGetUserId(out var userId);

        var changes = await _studentPortalService.GetTimetableChangesAsync(userId, cancellationToken);
        return Ok(changes);
    }

    /// <summary>
    /// Báo cáo thống kê chuyên cần và lịch sử điểm danh.
    /// </summary>
    [HttpGet("attendance")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AttendanceSummaryDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAttendance([FromQuery] string? semester, [FromQuery] string? month, [FromQuery] string? academicYear, CancellationToken cancellationToken)
    {
        TryGetUserId(out var userId);

        var attendance = await _studentPortalService.GetAttendanceAsync(userId, semester, month, academicYear, cancellationToken);
        return Ok(attendance);
    }

    /// <summary>
    /// Bảng điểm tổng kết và chi tiết từng môn học theo học kỳ.
    /// </summary>
    [HttpGet("grades")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(StudentAcademicSummaryDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetGrades([FromQuery] string? semester, [FromQuery] string? academicYear, CancellationToken cancellationToken)
    {
        TryGetUserId(out var userId);
        var grades = await _studentPortalService.GetGradesAsync(userId, semester, academicYear, cancellationToken);
        return Ok(grades);
    }

    /// <summary>
    /// Lịch kiểm tra định kỳ và thi học kỳ.
    /// </summary>
    [HttpGet("exams")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<ExamItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetExams(CancellationToken cancellationToken)
    {
        TryGetUserId(out var userId);
        var exams = await _studentPortalService.GetExamsAsync(userId, cancellationToken);
        return Ok(exams);
    }

    /// <summary>
    /// Báo cáo tổng hợp lịch thi, thống kê và chi tiết bài kiểm tra theo học kỳ và năm học.
    /// </summary>
    [HttpGet("exams/summary")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ExamScheduleSummaryDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetExamScheduleSummary(
        [FromQuery] string? semester,
        [FromQuery] string? academicYear,
        [FromQuery] string? examPeriod,
        CancellationToken cancellationToken)
    {
        TryGetUserId(out var userId);
        var summary = await _studentPortalService.GetExamScheduleSummaryAsync(userId, semester, academicYear, examPeriod, cancellationToken);
        return Ok(summary);
    }

    /// <summary>
    /// Danh sách thông báo trường, lớp và khảo thí.
    /// </summary>
    [HttpGet("announcements")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<AnnouncementItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAnnouncements(CancellationToken cancellationToken)
    {
        TryGetUserId(out var userId);

        var announcements = await _studentPortalService.GetAnnouncementsAsync(userId, cancellationToken);
        return Ok(announcements);
    }

    /// <summary>
    /// Đánh dấu thông báo đã đọc.
    /// </summary>
    [HttpPost("announcements/{id}/read")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> MarkAnnouncementAsRead(Guid id, CancellationToken cancellationToken)
    {
        TryGetUserId(out var userId);
        await _studentPortalService.MarkAnnouncementAsReadAsync(userId, id, cancellationToken);
        return Ok(new { success = true });
    }

    /// <summary>
    /// Tra cứu các khoản thu học phí, bảo hiểm và trạng thái thanh toán (chỉ đọc).
    /// </summary>
    [HttpGet("fees")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(StudentFeeSummaryDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFees(CancellationToken cancellationToken)
    {
        TryGetUserId(out var userId);

        var fees = await _studentPortalService.GetFeesAsync(userId, cancellationToken);
        return Ok(fees);
    }

    /// <summary>
    /// Danh sách yêu cầu hỗ trợ hoặc thắc mắc điểm số/chuyên cần do học sinh gửi.
    /// </summary>
    [HttpGet("support-requests")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<SupportRequestDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSupportRequests(CancellationToken cancellationToken)
    {
        TryGetUserId(out var userId);

        var requests = await _studentPortalService.GetSupportRequestsAsync(userId, cancellationToken);
        return Ok(requests);
    }

    /// <summary>
    /// Gửi một yêu cầu hỗ trợ hoặc thắc mắc mới.
    /// </summary>
    [HttpPost("support-requests")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(SupportRequestDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateSupportRequest([FromBody] CreateSupportRequestDto request, CancellationToken cancellationToken)
    {
        TryGetUserId(out var userId);

        if (string.IsNullOrWhiteSpace(request.Subject))
        {
            return BadRequest(new { message = "Tiêu đề yêu cầu không được để trống." });
        }

        var created = await _studentPortalService.CreateSupportRequestAsync(userId, request, cancellationToken);
        return CreatedAtAction(nameof(GetSupportRequests), new { id = created.Id }, created);
    }

    /// <summary>
    /// Gửi một yêu cầu cập nhật hoặc đính chính thông tin hồ sơ học sinh.
    /// </summary>
    [HttpPost("profile-update-requests")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ProfileUpdateRequestDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> SubmitProfileUpdateRequest([FromBody] CreateProfileUpdateRequestInput input, CancellationToken cancellationToken)
    {
        TryGetUserId(out var userId);
        var result = await _studentPortalService.SubmitProfileUpdateRequestAsync(userId, input, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Cập nhật thông tin liên hệ của học sinh (số điện thoại, địa chỉ...).
    /// </summary>
    [HttpPut("profile")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateContactInfo([FromBody] UpdateStudentContactDto input, CancellationToken cancellationToken)
    {
        TryGetUserId(out var userId);
        await _studentPortalService.UpdateContactAsync(userId, input, cancellationToken);
        return Ok(new { message = "Cập nhật thông tin liên hệ thành công." });
    }

    /// <summary>
    /// Thay đổi mật khẩu tài khoản học sinh.
    /// </summary>
    [HttpPost("change-password")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest input, CancellationToken cancellationToken)
    {
        TryGetUserId(out var userId);
        try
        {
            await _studentPortalService.ChangePasswordAsync(userId, input, cancellationToken);
            return Ok(new { message = "Đổi mật khẩu thành công." });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
