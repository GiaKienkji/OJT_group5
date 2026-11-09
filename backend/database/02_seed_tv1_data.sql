-- ==============================================================================
-- SOMS (School Operations Management System)
-- SCRIPT SEED DỮ LIỆU MẪU BAN ĐẦU CHO TV1 (SYSTEM ADMIN & SCHOOL MANAGEMENT)
-- ==============================================================================

-- 1. SEED 09 ROLES CHÍNH THỨC
INSERT INTO public.roles (code, name_vi, description) VALUES
('system_admin', 'Quản trị hệ thống', 'Quản trị toàn bộ người dùng, phân quyền RBAC và cấu hình hệ thống'),
('school_management', 'Ban giám hiệu', 'Điều hành toàn diện trường học, phê duyệt thời khóa biểu, đơn từ và báo cáo'),
('academic_affairs', 'Giáo vụ', 'Quản lý học sinh, lớp học, phân công giảng dạy, thời khóa biểu và thi cử'),
('head_of_department', 'Tổ trưởng chuyên môn', 'Quản lý hoạt động chuyên môn tổ, phân công bài dạy và đề xuất dạy thay'),
('teacher', 'Giáo viên', 'Giảng dạy, ghi nhận điểm danh, nhập sổ điểm điện tử và công tác chủ nhiệm'),
('accountant', 'Kế toán', 'Quản lý thu học phí, công nợ học sinh, đối soát giao dịch ngân hàng'),
('facility_staff', 'Nhân viên CSVC', 'Quản lý phòng học, cơ sở vật chất, thiết bị dạy học và xử lý sự cố'),
('student', 'Học sinh', 'Tra cứu thời khóa biểu, bảng điểm, lịch thi và điểm danh cá nhân'),
('parent', 'Phụ huynh', 'Theo dõi tình hình học tập của con, nộp đơn xin phép nghỉ và tra cứu học phí')
ON CONFLICT (code) DO UPDATE SET 
    name_vi = EXCLUDED.name_vi, 
    description = EXCLUDED.description;

-- 2. SEED CÁC MÃ QUYỀN HẠN CHÍNH THỨC (PERMISSIONS)
INSERT INTO public.permissions (code, description) VALUES
-- System Admin
('users.read', 'Xem danh sách và thông tin tài khoản người dùng'),
('users.create', 'Tạo mới tài khoản người dùng'),
('users.update', 'Cập nhật thông tin tài khoản người dùng'),
('users.deactivate', 'Khóa hoặc mở khóa tài khoản người dùng'),
('users.reset_password', 'Đặt lại mật khẩu cho tài khoản người dùng'),
('roles.manage', 'Quản trị vai trò và ma trận phân quyền RBAC'),
('system.configure', 'Cấu hình tham số hệ thống chung'),
('audit_logs.read', 'Xem nhật ký kiểm toán và lịch sử thao tác hệ thống'),
('health.view', 'Xem tình trạng sức khỏe máy chủ và cơ sở dữ liệu'),
('identity.manage', 'Quản lý định danh và phiên đăng nhập người dùng'),
('school.configure', 'Cấu hình thông tin trường học, niên khóa và học kỳ'),

-- School Management
('operations.view', 'Xem tổng quan bức tranh vận hành toàn trường'),
('analytics.view', 'Xem báo cáo phân tích thống kê và cảnh báo thông minh'),
('academic_plans.review', 'Xem xét kế hoạch đào tạo và giảng dạy'),
('timetables.approve', 'Phê duyệt thời khóa biểu toàn trường'),
('leave_requests.approve', 'Phê duyệt đơn xin nghỉ phép của giáo viên'),
('facilities.approve_purchase', 'Phê duyệt đề xuất mua sắm và sửa chữa cơ sở vật chất'),
('finance.summary_view', 'Xem tổng quan số liệu tài chính và công nợ'),
('announcements.publish_school', 'Phát thông báo chung toàn trường'),
('workflow.approve', 'Thẩm quyền phê duyệt quy trình đơn từ hợp nhất'),
('scheduling.approve', 'Phê duyệt phương án điều chỉnh lịch dạy và dạy thay'),

-- Academic Affairs
('students.manage', 'Quản lý hồ sơ và phân lớp học sinh'),
('classes.manage', 'Tạo và cập nhật danh sách lớp học'),
('subjects.manage', 'Quản lý danh mục môn học và phân phối chương trình'),
('teaching_assignments.manage', 'Thiết lập phân công chuyên môn giảng dạy'),
('homeroom.assign', 'Phân công giáo viên chủ nhiệm lớp'),
('timetables.draft', 'Lập dự thảo và xếp thời khóa biểu nháp'),
('timetables.publish', 'Công bố thời khóa biểu chính thức đã duyệt'),
('exams.manage', 'Tạo và xếp lịch thi, kiểm tra định kỳ'),
('academic.manage', 'Nghiệp vụ giáo vụ tổng hợp'),
('scheduling.manage', 'Điều phối lịch dạy thay và đổi tiết'),

-- Head of Department
('dept_teachers.view', 'Xem danh sách giáo viên trong tổ chuyên môn'),
('dept_assignments.view', 'Xem phân công giảng dạy thuộc tổ'),
('dept_timetables.view', 'Xem thời khóa biểu của các giáo viên trong tổ'),
('dept_tasks.manage', 'Quản lý và giao nhiệm vụ chuyên môn trong tổ'),

-- Teacher
('teaching_schedule.view', 'Xem lịch giảng dạy cá nhân'),
('assigned_classes.view', 'Xem danh sách các lớp được phân công dạy'),
('assigned_students.view', 'Xem danh sách học sinh theo lớp giảng dạy'),
('attendance.record', 'Ghi nhận điểm danh chuyên cần học sinh'),
('attendance.update', 'Chỉnh sửa dữ liệu điểm danh theo quy định'),
('assessments.create', 'Tạo bài kiểm tra và cột điểm đánh giá'),
('grades.enter', 'Nhập điểm học sinh vào sổ điểm điện tử'),
('grades.change_request', 'Gửi yêu cầu chỉnh sửa điểm đã khóa'),
('leave_requests.create', 'Tạo đơn xin nghỉ phép'),
('grades.write', 'Quyền ghi điểm học sinh'),
('attendance.write', 'Quyền ghi chuyên cần'),
('workflow.submit', 'Gửi đơn từ vào hệ thống phê duyệt'),

-- Teacher - Homeroom
('homeroom.class_view', 'Xem hồ sơ lớp chủ nhiệm'),
('homeroom.attendance_view', 'Theo dõi chuyên cần tổng thể lớp chủ nhiệm'),
('homeroom.leave_approve', 'Xác nhận đơn xin phép nghỉ của học sinh'),

-- Accountant
('fee_categories.manage', 'Quản lý danh mục các khoản thu học phí'),
('fee_campaigns.manage', 'Tạo và cấu hình các đợt thu học phí'),
('payments.record', 'Ghi nhận giao dịch đóng tiền'),
('payments.reconcile', 'Đối soát thanh toán với ngân hàng'),
('debts.track', 'Theo dõi công nợ học sinh quá hạn'),
('finance.manage', 'Nghiệp vụ tài chính kế toán'),

-- Facility Staff
('rooms.manage', 'Quản lý danh mục phòng học và phòng chức năng'),
('assets.manage', 'Quản lý hồ sơ thiết bị và tài sản nhà trường'),
('repairs.manage', 'Tiếp nhận báo hỏng và lập phiếu sửa chữa bảo trì'),

-- Student
('student_profile.view', 'Xem hồ sơ học sinh cá nhân'),
('student_timetable.view', 'Xem thời khóa biểu học tập'),
('student_grades.view', 'Tra cứu bảng điểm học tập'),
('student_attendance.view', 'Xem lịch sử chuyên cần cá nhân'),

-- Parent
('parent_children.view', 'Xem danh sách con em được liên kết'),
('parent_academics.view', 'Theo dõi kết quả học tập của con'),
('parent_leave.submit', 'Gửi đơn xin phép nghỉ học cho con')
ON CONFLICT (code) DO NOTHING;

-- 3. GÁN QUYỀN CHO SYSTEM ADMIN & SCHOOL MANAGEMENT
-- Admin có toàn bộ quyền quản trị
INSERT INTO public.role_permissions (role_code, permission_code)
SELECT 'system_admin', code FROM public.permissions
ON CONFLICT DO NOTHING;

-- BGH có các quyền điều hành và phê duyệt
INSERT INTO public.role_permissions (role_code, permission_code)
VALUES
('school_management', 'operations.view'),
('school_management', 'analytics.view'),
('school_management', 'academic_plans.review'),
('school_management', 'timetables.approve'),
('school_management', 'leave_requests.approve'),
('school_management', 'facilities.approve_purchase'),
('school_management', 'finance.summary_view'),
('school_management', 'announcements.publish_school'),
('school_management', 'workflow.approve'),
('school_management', 'scheduling.approve')
ON CONFLICT DO NOTHING;

-- 4. SEED TRƯỜNG HỌC MẪU
INSERT INTO public.schools (id, code, name, level, email, phone, address, status)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'SOMS-HN-001',
    'Trường THPT Chuyên Thực Nghiệm SOMS',
    'THPT',
    'contact@soms.edu.vn',
    '024.3856.9999',
    'Số 50 Đường Liễu Giai, Ba Đình, Hà Nội',
    'active'
) ON CONFLICT (code) DO NOTHING;

-- 5. SEED NIÊN KHÓA & HỌC KỲ
INSERT INTO public.academic_years (id, school_id, code, name, start_date, end_date, is_active)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    '2025-2026',
    'Năm học 2025 - 2026',
    '2025-09-01',
    '2026-05-31',
    TRUE
) ON CONFLICT DO NOTHING;

INSERT INTO public.semesters (id, academic_year_id, code, name, term_number, start_date, end_date, is_current)
VALUES 
(
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'HK1',
    'Học kỳ 1',
    1,
    '2025-09-01',
    '2026-01-15',
    TRUE
),
(
    'c0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000001',
    'HK2',
    'Học kỳ 2',
    2,
    '2026-01-16',
    '2026-05-31',
    FALSE
) ON CONFLICT DO NOTHING;
