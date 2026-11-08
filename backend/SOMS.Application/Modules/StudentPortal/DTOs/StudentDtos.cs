namespace SOMS.Application.Modules.StudentPortal.DTOs;

public class StudentProfileDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string StudentCode { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; }
    public string Gender { get; set; } = "Nữ";
    public string Status { get; set; } = "Đang học";
    public string ClassName { get; set; } = string.Empty;
    public string GradeLevel { get; set; } = string.Empty;
    public string AcademicYear { get; set; } = string.Empty;
    public string HomeroomTeacher { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string SchoolName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }

    // Detailed identity & personal
    public string BirthPlace { get; set; } = "Hà Nội";
    public string NationalId { get; set; } = "001308012345";
    public string PermanentAddress { get; set; } = "Số 36, ngõ 105 đường Nguyễn Trãi, P. Thanh Xuân, TP. Hà Nội";
    public string ContactAddress { get; set; } = "Số 36, ngõ 105 đường Nguyễn Trãi, P. Thanh Xuân, TP. Hà Nội";
    public string StudentEmail { get; set; } = "minhanh.hs230145@nguyentrai.edu.vn";
    public string Ethnicity { get; set; } = "Kinh";
    public string Religion { get; set; } = "Không";
    public string Nationality { get; set; } = "Việt Nam";
    public string UnionMember { get; set; } = "Đoàn viên TNCS Hồ Chí Minh (Ngày vào Đoàn: 26/03/2024)";
    public string BloodType { get; set; } = "O+";
    public string HealthInsuranceNo { get; set; } = "HS4010234567890";
    public string HealthStatus { get; set; } = "Tốt, thị lực 10/10, không có bệnh lý nền";

    // Academic specifics
    public DateTime? AdmissionDate { get; set; } = new DateTime(2023, 9, 5);
    public string ClassRoom { get; set; } = "Phòng A203 - Tầng 2 Dãy A";
    public string Combination { get; set; } = "Khoa học Tự nhiên (Toán, Vật lý, Hóa học, Sinh học)";
    public string StudentRole { get; set; } = "Lớp phó Học tập";

    // Sub-collections
    public List<StudentGuardianDto> Guardians { get; set; } = new();
    public List<AcademicHistoryItemDto> AcademicHistory { get; set; } = new();
    public List<ProfileUpdateRequestDto> UpdateRequests { get; set; } = new();
    public List<StudentAwardDto> Awards { get; set; } = new();
    public List<StudentDocumentDto> Documents { get; set; } = new();
    public StudentAccountSecurityDto AccountSecurity { get; set; } = new();
}

public class StudentGuardianDto
{
    public string Relationship { get; set; } = string.Empty; // Cha, Mẹ, Người giám hộ
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? Occupation { get; set; }
    public bool IsPrimaryContact { get; set; }
}

public class AcademicHistoryItemDto
{
    public string AcademicYear { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string SchoolName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty; // Hoàn thành, Đang học
    public double? Gpa { get; set; }
    public string? AcademicRank { get; set; }
    public string? ConductRank { get; set; }
    public string? Notes { get; set; }
}

public class ProfileUpdateRequestDto
{
    public int OrderNo { get; set; }
    public string RequestContent { get; set; } = string.Empty;
    public string SubmittedAt { get; set; } = string.Empty;
    public string Status { get; set; } = "pending"; // approved, pending, rejected
    public string StatusTextVi { get; set; } = "Đang xử lý";
    public string? ReviewedBy { get; set; }
    public string? Note { get; set; }
}

public class CreateProfileUpdateRequestInput
{
    public string RequestCategory { get; set; } = "contact"; // contact, identity, personal, parent
    public string RequestContent { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
}

public class ChangePasswordRequest
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class UpdateStudentContactDto
{
    public string? Phone { get; set; }
    public string? ContactAddress { get; set; }
    public string? StudentEmail { get; set; }
}

public class StudentAwardDto
{
    public string Title { get; set; } = string.Empty;
    public string AcademicYear { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Type { get; set; } = "award"; // award, commendation
    public string DateAchieved { get; set; } = string.Empty;
}

public class StudentDocumentDto
{
    public string DocumentName { get; set; } = string.Empty;
    public string DocumentType { get; set; } = string.Empty;
    public string VerifiedDate { get; set; } = string.Empty;
    public string Status { get; set; } = "verified"; // verified, pending
    public string FileSize { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
}

public class StudentAccountSecurityDto
{
    public string Username { get; set; } = "hs230145";
    public string LoginEmail { get; set; } = "minhanh.hs230145@nguyentrai.edu.vn";
    public bool GoogleLinked { get; set; } = true;
    public string GoogleEmail { get; set; } = "minhanh.hs230145@nguyentrai.edu.vn";
    public bool IsVerified { get; set; } = true;
    public string LastLogin { get; set; } = "Hôm nay - 07:42 (trên trình duyệt Chrome, Windows)";
    public string CurrentDevice { get; set; } = "Chrome 122 • Windows 11 (IP: 14.161.42.10)";
}

public class TimetableItemDto
{
    public int PeriodNo { get; set; }
    public string PeriodName { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public string SubjectCode { get; set; } = string.Empty;
    public string TeacherName { get; set; } = string.Empty;
    public string RoomName { get; set; } = string.Empty;
    public int Weekday { get; set; } // 2 = Thứ 2, 7 = Thứ 7
    public bool IsSubstitute { get; set; }
    public string? SubstituteTeacherName { get; set; }
    public string? Note { get; set; }
    public string Session { get; set; } = "morning"; // morning, afternoon
}

public class TimetableChangeNotificationDto
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Title { get; set; } = string.Empty;
    public string Type { get; set; } = "substitute"; // substitute, room_change
    public string BadgeText { get; set; } = "Dạy thay";
    public string Description { get; set; } = string.Empty;
    public string Detail { get; set; } = string.Empty;
    public string EffectiveDate { get; set; } = string.Empty;
}

public class AttendanceSummaryDto
{
    public int TotalSessions { get; set; } = 48;
    public int PresentCount { get; set; } = 45;
    public int ExcusedAbsenceCount { get; set; } = 1;
    public int UnexcusedAbsenceCount { get; set; } = 0;
    public int LateCount { get; set; } = 2;
    public double AttendanceRate { get; set; } = 98.2;
    public string RateDelta { get; set; } = "+1.2%";
    public string Month { get; set; } = "Tháng 1/2026";
    public string AcademicYear { get; set; } = "2025 – 2026";
    public string LastUpdated { get; set; } = "09/01/2026 14:30";
    public List<AttendanceRecordItemDto> History { get; set; } = new();
    public List<AttendanceDailyDetailDto> DailyDetails { get; set; } = new();
    public List<AttendanceMonthlyTrendDto> MonthlyTrends { get; set; } = new();
    public List<AttendanceWeeklyBreakdownDto> WeeklyBreakdowns { get; set; } = new();
    public TermSummaryDto SemesterSummary { get; set; } = new();
}

public class TermSummaryDto
{
    public int TotalSessions { get; set; } = 72;
    public int PresentCount { get; set; } = 69;
    public double PresentRate { get; set; } = 95.8;
    public int LateCount { get; set; } = 2;
    public double LateRate { get; set; } = 2.8;
    public int AbsentCount { get; set; } = 1;
    public double AbsentRate { get; set; } = 1.4;
}

public class AttendanceDailyDetailDto
{
    public string DateFormatted { get; set; } = string.Empty;
    public string DayOfWeek { get; set; } = string.Empty;
    public string PeriodRange { get; set; } = "Tiết 1 – 5";
    public string SubjectList { get; set; } = string.Empty;
    public string Status { get; set; } = "present"; // present, late, excused, unexcused
    public string StatusTextVi { get; set; } = "Có mặt";
    public string? Note { get; set; } = "-";
}

public class AttendanceMonthlyTrendDto
{
    public string MonthName { get; set; } = string.Empty;
    public double PresentRate { get; set; }
    public double LateRate { get; set; }
    public double AbsentRate { get; set; }
}

public class AttendanceWeeklyBreakdownDto
{
    public string WeekName { get; set; } = string.Empty;
    public int TotalSessions { get; set; } = 5;
    public int PresentCount { get; set; } = 5;
    public int LateCount { get; set; } = 0;
    public int AbsentCount { get; set; } = 0;
    public double Rate { get; set; } = 100;
}

public class AttendanceRecordItemDto
{
    public Guid Id { get; set; }
    public DateTime Date { get; set; }
    public string SessionName { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public string Status { get; set; } = "present"; // present, excused, unexcused, late
    public string StatusTextVi { get; set; } = "Có mặt";
    public string? Note { get; set; }
}

public class ExamItemDto
{
    public Guid Id { get; set; }
    public int Stt { get; set; }
    public string SubjectName { get; set; } = string.Empty;
    public string SubjectCode { get; set; } = string.Empty;
    public string ExamTitle { get; set; } = string.Empty;
    public string ExamType { get; set; } = "Cuối kỳ"; // Giữa kỳ, Cuối kỳ, Đánh giá
    public string ExamDateFormatted { get; set; } = string.Empty;
    public string DurationFormatted { get; set; } = "45 phút";
    public DateTime StartsAt { get; set; }
    public DateTime EndsAt { get; set; }
    public string RoomName { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public string ExamFormat { get; set; } = "Tự luận & Trắc nghiệm";
    public string Status { get; set; } = "scheduled"; // completed, upcoming, pending
    public string StatusTextVi { get; set; } = "Chưa diễn ra";
    public string Semester { get; set; } = "Học kỳ I";
    public string AcademicYear { get; set; } = "2025 – 2026";
    public string Invigilator { get; set; } = string.Empty;
    public string AllowedMaterials { get; set; } = string.Empty;
}

public class ExamScheduleSummaryDto
{
    public string Semester { get; set; } = "Học kỳ I";
    public string AcademicYear { get; set; } = "2025 – 2026";
    public string CurrentExamPeriod { get; set; } = "Kiểm tra cuối kỳ I";
    public int TotalExams { get; set; } = 10;
    public int CompletedExams { get; set; } = 4;
    public int UpcomingExams { get; set; } = 3;
    public int RemainingExams { get; set; } = 3;
    public List<ExamItemDto> Exams { get; set; } = new();
    public ExamItemDto? NextExam { get; set; }
    public List<ExamItemDto> UpcomingList { get; set; } = new();
}

public class AnnouncementTableRowDto
{
    public string Col1 { get; set; } = string.Empty;
    public string Col2 { get; set; } = string.Empty;
    public string Col3 { get; set; } = string.Empty;
    public string Col4 { get; set; } = string.Empty;
}

public class AnnouncementAttachmentDto
{
    public string FileName { get; set; } = string.Empty;
    public string FileSize { get; set; } = "1.2 MB";
    public string FileType { get; set; } = "pdf";
    public string FileUrl { get; set; } = string.Empty;
}

public class AnnouncementItemDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string Audience { get; set; } = "school"; // school, class, department
    public DateTime PublishedAt { get; set; }
    public string PublishedDateFormatted { get; set; } = string.Empty;
    public string PublishedTimeFormatted { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public bool IsImportant { get; set; }
    public bool IsRead { get; set; }
    public bool IsBookmarked { get; set; }
    public int ViewsCount { get; set; } = 112;
    public string Category { get; set; } = "all"; // all, important, study, exam, activity, union, other
    public string CategoryNameVi { get; set; } = "Chung";
    public string Salutation { get; set; } = string.Empty;
    public string Intro { get; set; } = string.Empty;
    public List<AnnouncementTableRowDto> TableRows { get; set; } = new();
    public List<string> Notes { get; set; } = new();
    public List<AnnouncementAttachmentDto> Attachments { get; set; } = new();
}

public class SubjectGradeDto
{
    public int Stt { get; set; }
    public string SubjectName { get; set; } = string.Empty;
    public string SubjectCode { get; set; } = string.Empty;
    public string DdgTx1 { get; set; } = string.Empty;
    public string DdgTx2 { get; set; } = string.Empty;
    public string DdgTx3 { get; set; } = string.Empty;
    public string DdgGk { get; set; } = string.Empty;
    public string DdgCk { get; set; } = string.Empty;
    public string DiemTb { get; set; } = string.Empty;
    public double? ScoreNumeric { get; set; }
    public string Evaluation { get; set; } = "Giỏi";
    public string EvaluationBadge { get; set; } = "gioi"; // gioi, xuat_sac, dat
    public List<double> OralScores { get; set; } = new();       // Điểm miệng (hệ số 1)
    public List<double> QuizScores { get; set; } = new();       // Kiểm tra 15 phút (hệ số 1)
    public List<double> MidtermScores { get; set; } = new();    // Kiểm tra giữa kỳ (hệ số 2)
    public List<double> FinalScores { get; set; } = new();      // Kiểm tra cuối kỳ (hệ số 3)
    public double? AverageScore { get; set; }
    public string? TeacherFeedback { get; set; }
}

public class GpaHistoryItemDto
{
    public string TermName { get; set; } = string.Empty;
    public double Gpa { get; set; }
}

public class YearSubjectGradeDto
{
    public int Stt { get; set; }
    public string SubjectName { get; set; } = string.Empty;
    public string SubjectCode { get; set; } = string.Empty;
    public string Semester1Gpa { get; set; } = string.Empty;
    public string Semester2Gpa { get; set; } = string.Empty;
    public string YearGpa { get; set; } = string.Empty;
    public double? Semester1Numeric { get; set; }
    public double? Semester2Numeric { get; set; }
    public double? YearNumeric { get; set; }
    public string Trend { get; set; } = "stable"; // up, down, stable
    public string TrendDiff { get; set; } = "0,0";
    public string Evaluation { get; set; } = "Giỏi";
    public string EvaluationBadge { get; set; } = "gioi"; // gioi, xuat_sac, dat
}

public class YearAcademicSummaryDto
{
    public string AcademicYear { get; set; } = "2025 – 2026";
    public string ClassName { get; set; } = "11A1";
    public string GradeLevel { get; set; } = "Lớp 11";
    public string HomeroomTeacher { get; set; } = "Cô Phạm Minh Thư";
    public double OverallYearGpa { get; set; } = 8.7;
    public double Semester1Gpa { get; set; } = 8.6;
    public double Semester2Gpa { get; set; } = 8.8;
    public string ClassRank { get; set; } = "2 / 42";
    public string GradeRank { get; set; } = "15 / 320";
    public string AcademicRank { get; set; } = "Giỏi";
    public string ConductRank { get; set; } = "Tốt";
    public string TitleAward { get; set; } = "Học sinh Giỏi cấp Trường";
    public string PromotionStatus { get; set; } = "Được lên lớp thẳng";
    public int TotalSubjects { get; set; } = 10;
    public string PassRate { get; set; } = "100%";
    public string TeacherFeedback { get; set; } = "Học sinh có ý thức tự giác cao, tư duy logic tốt và luôn tích cực tham gia xây dựng bài. Hoàn thành xuất sắc nhiệm vụ Lớp phó học tập.";
    public List<YearSubjectGradeDto> Subjects { get; set; } = new();
}

public class ProgressionRecordDto
{
    public string AcademicYear { get; set; } = string.Empty;
    public string Grade { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string SchoolName { get; set; } = string.Empty;
    public double? Semester1Gpa { get; set; }
    public double? Semester2Gpa { get; set; }
    public double YearGpa { get; set; }
    public string AcademicRank { get; set; } = "Giỏi";
    public string ConductRank { get; set; } = "Tốt";
    public string ClassRank { get; set; } = string.Empty;
    public string AwardTitle { get; set; } = string.Empty;
    public string HomeroomTeacher { get; set; } = string.Empty;
    public string TeacherComment { get; set; } = string.Empty;
    public string Status { get; set; } = "completed"; // completed, in_progress
}

public class StudentAcademicSummaryDto
{
    public string AcademicYear { get; set; } = "2025 – 2026";
    public string Semester { get; set; } = "Học kỳ I";
    public string ClassName { get; set; } = "11A1";
    public string GradeLevel { get; set; } = "Lớp 11";
    public string HomeroomTeacher { get; set; } = "Cô Phạm Minh Thư";
    public double? OverallGpa { get; set; } = 8.6;
    public string ClassRank { get; set; } = "3 / 42";
    public string GradeRank { get; set; } = "18 / 320";
    public int TotalSubjects { get; set; } = 10;
    public string PassRate { get; set; } = "100%";
    public string AcademicRank { get; set; } = "Giỏi"; // Xuất sắc / Giỏi / Khá / Đạt / Chưa đạt
    public string ConductRank { get; set; } = "Tốt";
    public bool IsPublished { get; set; } = true;
    public List<SubjectGradeDto> Subjects { get; set; } = new();
    public List<GpaHistoryItemDto> GpaHistory { get; set; } = new();
    public YearAcademicSummaryDto? YearSummary { get; set; }
    public List<ProgressionRecordDto> ProgressionHistory { get; set; } = new();
}

public class StudentFeeItemDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal Discount { get; set; }
    public decimal FinalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public DateTime? DueDate { get; set; }
    public string Status { get; set; } = "unpaid"; // paid, partially_paid, unpaid
    public string StatusTextVi { get; set; } = "Chưa nộp";
    public string? ReceiptCode { get; set; }
    public DateTime? PaidAt { get; set; }
}

public class StudentFeeSummaryDto
{
    public decimal TotalPayable { get; set; }
    public decimal TotalPaid { get; set; }
    public decimal RemainingBalance { get; set; }
    public List<StudentFeeItemDto> FeeItems { get; set; } = new();
}

public class SupportRequestDto
{
    public Guid Id { get; set; }
    public string RequestCode { get; set; } = string.Empty;
    public string RequestType { get; set; } = string.Empty;
    public string RequestTypeTextVi { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = "pending"; // pending, processing, resolved, completed, rejected
    public string StatusTextVi { get; set; } = "Đang chờ xử lý";
    public string Department { get; set; } = "Phòng Giáo vụ";
    public string Priority { get; set; } = "normal";
    public DateTime CreatedAt { get; set; }
    public DateTime? DecidedAt { get; set; }
    public string? ResponseNote { get; set; }
    public string? AttachmentFileName { get; set; }
}

public class CreateSupportRequestDto
{
    public string RequestType { get; set; } = "academic";
    public string Subject { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Department { get; set; }
    public string? Priority { get; set; }
    public string? AttachmentFileName { get; set; }
}

public class StudentDashboardDto
{
    public StudentProfileDto Profile { get; set; } = new();
    public int TodayLessonsCount { get; set; }
    public double AttendanceRate { get; set; }
    public int UpcomingExamsCount { get; set; }
    public int UnreadAnnouncementsCount { get; set; }
    public List<TimetableItemDto> TodayTimetable { get; set; } = new();
    public List<ExamItemDto> UpcomingExams { get; set; } = new();
    public List<AnnouncementItemDto> RecentAnnouncements { get; set; } = new();
    public StudentAcademicSummaryDto AcademicSummary { get; set; } = new();
    public AttendanceSummaryDto AttendanceSummary { get; set; } = new();
    public StudentFeeItemDto? LatestFee { get; set; }
}

public class StudentClassDto
{
    public Guid ClassId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public string GradeLevel { get; set; } = string.Empty;
    public string AcademicYear { get; set; } = string.Empty;
    public string HomeroomTeacherName { get; set; } = string.Empty;
    public string? HomeroomTeacherPhone { get; set; }
    public string? HomeroomTeacherEmail { get; set; }
    public int TotalStudents { get; set; }
    public string RoomName { get; set; } = string.Empty;
}
