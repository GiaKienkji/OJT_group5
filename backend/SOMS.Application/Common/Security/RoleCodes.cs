namespace SOMS.Application.Common.Security;

public static class RoleCodes
{
    public const string SystemAdmin = "system_admin";
    public const string SchoolManagement = "school_management";
    public const string AcademicAffairs = "academic_affairs";
    public const string HeadOfDepartment = "head_of_department";
    public const string Teacher = "teacher";
    public const string Accountant = "accountant";
    public const string FacilityStaff = "facility_staff";
    public const string Student = "student";
    public const string Parent = "parent";

    public static readonly string[] All = new[]
    {
        SystemAdmin,
        SchoolManagement,
        AcademicAffairs,
        HeadOfDepartment,
        Teacher,
        Accountant,
        FacilityStaff,
        Student,
        Parent
    };

    public static string GetDashboardRoute(string roleCode) => roleCode.ToLowerInvariant() switch
    {
        SystemAdmin => "/admin/dashboard",
        SchoolManagement => "/management/dashboard",
        AcademicAffairs => "/academic/dashboard",
        HeadOfDepartment => "/department/dashboard",
        Teacher => "/teacher/dashboard",
        Accountant => "/accountant/dashboard",
        FacilityStaff => "/facilities/dashboard",
        Student => "/student/dashboard",
        Parent => "/parent/dashboard",
        _ => "/login"
    };

    public static string GetRoleNameVi(string roleCode) => roleCode.ToLowerInvariant() switch
    {
        SystemAdmin => "Quản trị hệ thống",
        SchoolManagement => "Ban giám hiệu",
        AcademicAffairs => "Giáo vụ",
        HeadOfDepartment => "Tổ trưởng chuyên môn",
        Teacher => "Giáo viên",
        Accountant => "Kế toán",
        FacilityStaff => "Nhân viên CSVC",
        Student => "Học sinh",
        Parent => "Phụ huynh",
        _ => roleCode
    };
}
