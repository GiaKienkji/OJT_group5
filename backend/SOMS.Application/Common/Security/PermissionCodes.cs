namespace SOMS.Application.Common.Security;

public static class PermissionCodes
{
    // SYSTEM_ADMIN
    public const string UsersRead = "users.read";
    public const string UsersCreate = "users.create";
    public const string UsersUpdate = "users.update";
    public const string UsersDeactivate = "users.deactivate";
    public const string UsersResetPassword = "users.reset_password";
    public const string RolesManage = "roles.manage";
    public const string SystemConfigure = "system.configure";
    public const string AuditLogsRead = "audit_logs.read";
    public const string HealthView = "health.view";
    public const string IdentityManage = "identity.manage";
    public const string SchoolConfigure = "school.configure";

    // SCHOOL_MANAGEMENT
    public const string OperationsView = "operations.view";
    public const string AnalyticsView = "analytics.view";
    public const string AcademicPlansReview = "academic_plans.review";
    public const string TimetablesApprove = "timetables.approve";
    public const string LeaveRequestsApprove = "leave_requests.approve";
    public const string FacilitiesApprovePurchase = "facilities.approve_purchase";
    public const string FinanceSummaryView = "finance.summary_view";
    public const string AnnouncementsPublishSchool = "announcements.publish_school";
    public const string WorkflowApprove = "workflow.approve";
    public const string SchedulingApprove = "scheduling.approve";

    // ACADEMIC_AFFAIRS
    public const string StudentsManage = "students.manage";
    public const string ClassesManage = "classes.manage";
    public const string SubjectsManage = "subjects.manage";
    public const string TeachingAssignmentsManage = "teaching_assignments.manage";
    public const string HomeroomAssign = "homeroom.assign";
    public const string TimetablesDraft = "timetables.draft";
    public const string TimetablesPublish = "timetables.publish";
    public const string ExamsManage = "exams.manage";
    public const string AcademicManage = "academic.manage";
    public const string SchedulingManage = "scheduling.manage";

    // HEAD_OF_DEPARTMENT
    public const string DeptTeachersView = "dept_teachers.view";
    public const string DeptAssignmentsView = "dept_assignments.view";
    public const string DeptTimetablesView = "dept_timetables.view";
    public const string DeptTasksManage = "dept_tasks.manage";

    // TEACHER
    public const string TeachingScheduleView = "teaching_schedule.view";
    public const string AssignedClassesView = "assigned_classes.view";
    public const string AssignedStudentsView = "assigned_students.view";
    public const string AttendanceRecord = "attendance.record";
    public const string AttendanceUpdate = "attendance.update";
    public const string AssessmentsCreate = "assessments.create";
    public const string GradesEnter = "grades.enter";
    public const string GradesChangeRequest = "grades.change_request";
    public const string LeaveRequestsCreate = "leave_requests.create";
    public const string GradesWrite = "grades.write";
    public const string AttendanceWrite = "attendance.write";
    public const string WorkflowSubmit = "workflow.submit";

    // TEACHER - HOMEROOM
    public const string HomeroomClassView = "homeroom.class_view";
    public const string HomeroomAttendanceView = "homeroom.attendance_view";
    public const string HomeroomLeaveApprove = "homeroom.leave_approve";

    // ACCOUNTANT
    public const string FeeCategoriesManage = "fee_categories.manage";
    public const string FeeCampaignsManage = "fee_campaigns.manage";
    public const string PaymentsRecord = "payments.record";
    public const string PaymentsReconcile = "payments.reconcile";
    public const string DebtsTrack = "debts.track";
    public const string FinanceManage = "finance.manage";

    // FACILITY_STAFF
    public const string RoomsManage = "rooms.manage";
    public const string AssetsManage = "assets.manage";
    public const string RepairsManage = "repairs.manage";

    // STUDENT
    public const string StudentProfileView = "student_profile.view";
    public const string StudentTimetableView = "student_timetable.view";
    public const string StudentGradesView = "student_grades.view";
    public const string StudentAttendanceView = "student_attendance.view";

    // PARENT
    public const string ParentChildrenView = "parent_children.view";
    public const string ParentAcademicsView = "parent_academics.view";
    public const string ParentLeaveSubmit = "parent_leave.submit";
}
