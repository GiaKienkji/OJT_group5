import React from 'react';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { DashboardLayout } from './components/DashboardLayout';
import { StudentRoutes } from './features/student/routes/studentRoutes';
import { ClassesPage } from './features/academic/pages/ClassesPage';
import { SubjectsPage } from './features/academic/pages/SubjectsPage';
import { TimetablesPage } from './features/academic/pages/TimetablesPage';
import { PublishedSchedulePage } from './features/academic/pages/PublishedSchedulePage';
import { AcademicEventsPage } from './features/academic/pages/AcademicEventsPage';
import { AcademicDashboardSummary } from './features/academic/pages/AcademicDashboardSummary';
import { StudentsPage } from './features/academic/pages/StudentsPage';
import { 
  Users, 
  Settings, 
  FileText, 
  CheckCircle, 
  Calendar, 
  DollarSign, 
  Wrench, 
  GraduationCap, 
  Award,
  Clock,
  ShieldCheck
} from 'lucide-react';

export const App: React.FC = () => {
  const { user, isAuthenticated, isLoading, currentDashboard, setCurrentDashboard, hasPermission } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          <div className="text-white text-sm font-semibold tracking-wide">Đang tải hệ thống SOMS...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  const userRoles = user.roles.map(r => r.toLowerCase());
  const isStudent = userRoles.includes('student');

  // If user is currently on the Student Dashboard or is a student
  // Note: Only route to StudentRoutes if user explicitly navigated to student dashboard OR is a student
  const shouldRenderStudentPortal = 
    currentDashboard === '/student/dashboard' || 
    (isStudent && !currentDashboard.startsWith('/admin') && !currentDashboard.startsWith('/management') && !currentDashboard.startsWith('/academic') && !currentDashboard.startsWith('/teacher') && !currentDashboard.startsWith('/accountant') && !currentDashboard.startsWith('/facilities') && !currentDashboard.startsWith('/department') && !currentDashboard.startsWith('/parent'));

  if (shouldRenderStudentPortal) {
    return <StudentRoutes />;
  }

  // Render the appropriate dashboard based on currentDashboard route
  switch (currentDashboard) {
    case '/admin/dashboard':
      return (
        <DashboardLayout
          roleCode="system_admin"
          roleName="Quản trị hệ thống"
          title="Bảng điều khiển Quản trị viên"
          description="Quản lý tài khoản, phân quyền vai trò 9 nhóm người dùng, cấu hình bảo mật và giám sát hệ thống."
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3 mb-4 text-[#0B4F8A]">
                <Users className="w-6 h-6" />
                <h3 className="font-bold text-lg text-slate-900">Quản lý Người dùng</h3>
              </div>
              <p className="text-sm text-slate-500 mb-4">Quản lý danh sách tài khoản, kích hoạt, khóa hoặc cấp lại mật khẩu.</p>
              <span className="inline-block px-3 py-1 bg-blue-50 text-[#0B4F8A] text-xs font-semibold rounded-lg">9 vai trò lõi</span>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3 mb-4 text-emerald-600">
                <Settings className="w-6 h-6" />
                <h3 className="font-bold text-lg text-slate-900">Phân quyền RBAC</h3>
              </div>
              <p className="text-sm text-slate-500 mb-4">Ánh xạ danh mục quyền chi tiết và giám sát chính sách truy cập.</p>
              <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg">56 Permissions</span>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3 mb-4 text-purple-600">
                <ShieldCheck className="w-6 h-6" />
                <h3 className="font-bold text-lg text-slate-900">Nhật ký Kiểm toán</h3>
              </div>
              <p className="text-sm text-slate-500 mb-4">Theo dõi toàn bộ lịch sử thay đổi dữ liệu nhạy cảm và bảo mật.</p>
              <span className="inline-block px-3 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-lg">Audit Logs</span>
            </div>
          </div>
        </DashboardLayout>
      );

    case '/management/dashboard':
      return (
        <DashboardLayout
          roleCode="school_management"
          roleName="Ban giám hiệu"
          title="Bảng điều hành Ban giám hiệu"
          description="Giám sát toàn diện vận hành trường học, phê duyệt thời khóa biểu, lịch giảng dạy và báo cáo thống kê."
        >
          {hasPermission('timetables.approve') && <button className="mb-4 rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white"
            onClick={() => setCurrentDashboard('/management/timetables')}>Duyệt thời khóa biểu</button>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3 mb-3 text-blue-600">
                <CheckCircle className="w-6 h-6" />
                <h3 className="font-bold text-lg text-slate-900">Phê duyệt Điều hành</h3>
              </div>
              <p className="text-sm text-slate-500">Duyệt thời khóa biểu, lịch thi và các đề xuất chuyên môn theo thẩm quyền.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3 mb-3 text-teal-600">
                <Calendar className="w-6 h-6" />
                <h3 className="font-bold text-lg text-slate-900">Chuyên môn &amp; Giảng dạy</h3>
              </div>
              <p className="text-sm text-slate-500">Theo dõi tiến độ chương trình đào tạo và phân công chuyên môn nhà trường.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3 mb-3 text-amber-600">
                <FileText className="w-6 h-6" />
                <h3 className="font-bold text-lg text-slate-900">Báo cáo Toàn trường</h3>
              </div>
              <p className="text-sm text-slate-500">Tổng hợp sĩ số, chuyên cần, chất lượng học tập và tài chính tổng quát.</p>
            </div>
          </div>
        </DashboardLayout>
      );

    case '/academic/events':
      return <DashboardLayout roleCode="academic_affairs" roleName="Giáo vụ" title="Dạy thay và kiểm tra"
        description="Quản lý ca theo lịch công bố.">
        <button className="mb-4 font-semibold underline" onClick={() => setCurrentDashboard('/academic/dashboard')}>Về trang Giáo vụ</button>
        <AcademicEventsPage />
      </DashboardLayout>;

    case '/academic/timetables':
    case '/management/timetables': {
      const isManagement = currentDashboard.startsWith('/management');
      return (
        <DashboardLayout roleCode={isManagement ? 'school_management' : 'academic_affairs'}
          roleName={isManagement ? 'Quản lý trường' : 'Giáo vụ'} title="Thời khóa biểu" description="Quản lý các phiên bản theo học kỳ.">
          <button className="mb-4 font-semibold underline" onClick={() => setCurrentDashboard(isManagement ? '/management/dashboard' : '/academic/dashboard')}>Về tổng quan</button>
          <TimetablesPage />
        </DashboardLayout>
      );
    }

    case '/academic/subjects':
      return (
        <DashboardLayout roleCode="academic_affairs" roleName="Giáo vụ" title="Môn học" description="Quản lý danh mục môn học theo trường.">
          <button className="mb-4 font-semibold underline" onClick={() => setCurrentDashboard('/academic/dashboard')}>Về trang Giáo vụ</button>
          <SubjectsPage />
        </DashboardLayout>
      );

    case '/academic/students':
      return (
        <DashboardLayout roleCode="academic_affairs" roleName="Giáo vụ" title="Học sinh" description="Quản lý hồ sơ học sinh theo trường.">
          <button className="mb-4 font-semibold underline" onClick={() => setCurrentDashboard('/academic/dashboard')}>Về trang Giáo vụ</button>
          <StudentsPage />
        </DashboardLayout>
      );

    case '/academic/classes':
      return (
        <DashboardLayout roleCode="academic_affairs" roleName="Giáo vụ" title="Lớp học" description="Quản lý lớp theo trường và năm học.">
          <button className="mb-4 font-semibold underline" onClick={() => setCurrentDashboard('/academic/dashboard')}>Về trang Giáo vụ</button>
          <ClassesPage />
        </DashboardLayout>
      );

    case '/academic/dashboard':
      return (
        <DashboardLayout
          roleCode="academic_affairs"
          roleName="Giáo vụ"
          title="Không gian làm việc Giáo vụ"
          description="Quản lý hồ sơ học sinh, phân lớp, lập dự thảo thời khóa biểu và lịch thi."
        >
          {hasPermission('classes.manage') && (
            <button className="mb-4 rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white" onClick={() => setCurrentDashboard('/academic/classes')}>Lớp học</button>
          )}
          {(hasPermission('scheduling.manage') || hasPermission('exams.manage')) && (
            <button className="mb-4 ml-2 rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white" onClick={() => setCurrentDashboard('/academic/events')}>Dạy thay và kiểm tra</button>
          )}
          {hasPermission('timetables.draft') && (
            <button className="mb-4 ml-2 rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white" onClick={() => setCurrentDashboard('/academic/timetables')}>Thời khóa biểu</button>
          )}
          {hasPermission('subjects.manage') && (
            <button className="mb-4 ml-2 rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white" onClick={() => setCurrentDashboard('/academic/subjects')}>Môn học</button>
          )}
          {hasPermission('students.manage') && (
            <button className="mb-4 ml-2 rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white" onClick={() => setCurrentDashboard('/academic/students')}>Học sinh</button>
          )}
          {hasPermission('academic.manage') && <AcademicDashboardSummary />}
        </DashboardLayout>
      );

    case '/department/dashboard':
      return (
        <DashboardLayout
          roleCode="head_of_department"
          roleName="Tổ trưởng chuyên môn"
          title="Quản lý Tổ chuyên môn"
          description="Quản trị giáo viên trong tổ bộ môn, kế hoạch bài dạy, phân công giảng dạy và duyệt dạy thay."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <Users className="w-6 h-6 text-amber-600 mb-3" />
              <h3 className="font-bold text-lg text-slate-900 mb-1">Giáo viên trong tổ</h3>
              <p className="text-sm text-slate-500">Theo dõi định mức tiết dạy, lịch giảng dạy và tiến độ nhập điểm bộ môn.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <Clock className="w-6 h-6 text-blue-600 mb-3" />
              <h3 className="font-bold text-lg text-slate-900 mb-1">Đề xuất Dạy thay</h3>
              <p className="text-sm text-slate-500">Xử lý yêu cầu nghỉ phép và điều phối giáo viên dạy thay trong tổ bộ môn.</p>
            </div>
          </div>
        </DashboardLayout>
      );

    case '/teacher/schedule':
    case '/parent/schedule': {
      const isParent = currentDashboard.startsWith('/parent');
      return <DashboardLayout roleCode={isParent ? 'parent' : 'teacher'} roleName={isParent ? 'Phụ huynh' : 'Giáo viên'}
        title="Lịch đã công bố" description="Tra cứu lịch theo ngày.">
        <button className="mb-4 font-semibold underline" onClick={() => setCurrentDashboard(isParent ? '/parent/dashboard' : '/teacher/dashboard')}>Về tổng quan</button>
        <PublishedSchedulePage />
      </DashboardLayout>;
    }

    case '/teacher/dashboard':
      return (
        <DashboardLayout
          roleCode="teacher"
          roleName="Giáo viên"
          title="Không gian Giáo viên Giảng dạy"
          description="Lịch dạy cá nhân, ghi nhận chuyên cần, nhập điểm bài kiểm tra và công tác chủ nhiệm lớp."
        >
          {hasPermission('teaching_schedule.view') && <button className="mb-4 rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white"
            onClick={() => setCurrentDashboard('/teacher/schedule')}>Lịch đã công bố</button>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <Calendar className="w-6 h-6 text-teal-600 mb-3" />
              <h3 className="font-bold text-lg text-slate-900 mb-1">Lịch dạy hôm nay</h3>
              <p className="text-sm text-slate-500">Xem các tiết giảng dạy được phân công trong tuần theo thời khóa biểu.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <Award className="w-6 h-6 text-blue-600 mb-3" />
              <h3 className="font-bold text-lg text-slate-900 mb-1">Sổ Điểm Điện tử</h3>
              <p className="text-sm text-slate-500">Nhập điểm thường xuyên, định kỳ cho các lớp phụ trách đúng thẩm quyền.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <Users className="w-6 h-6 text-purple-600 mb-3" />
              <h3 className="font-bold text-lg text-slate-900 mb-1">Lớp Chủ nhiệm</h3>
              <p className="text-sm text-slate-500">Quản lý chuyên cần, hạnh kiểm, liên lạc phụ huynh cho lớp đang phụ trách.</p>
            </div>
          </div>
        </DashboardLayout>
      );

    case '/accountant/dashboard':
      return (
        <DashboardLayout
          roleCode="accountant"
          roleName="Kế toán"
          title="Bảng quản lý Thu chi &amp; Học phí"
          description="Quản lý danh mục học phí, chiến dịch thu, ghi nhận thanh toán và đối soát giao dịch."
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <DollarSign className="w-6 h-6 text-rose-600 mb-3" />
              <h3 className="font-bold text-lg text-slate-900 mb-1">Đợt thu Học phí</h3>
              <p className="text-sm text-slate-500">Tạo đợt thu, mức thu theo khối lớp và áp dụng chính sách miễn giảm.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <CheckCircle className="w-6 h-6 text-emerald-600 mb-3" />
              <h3 className="font-bold text-lg text-slate-900 mb-1">Đối soát Thanh toán</h3>
              <p className="text-sm text-slate-500">Khớp giao dịch ngân hàng, tạo biên lai và theo dõi công nợ học sinh.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <FileText className="w-6 h-6 text-blue-600 mb-3" />
              <h3 className="font-bold text-lg text-slate-900 mb-1">Báo cáo Tài chính</h3>
              <p className="text-sm text-slate-500">Tổng hợp thu theo tháng, học kỳ và tình trạng hoàn thành nghĩa vụ phí.</p>
            </div>
          </div>
        </DashboardLayout>
      );

    case '/facilities/dashboard':
      return (
        <DashboardLayout
          roleCode="facility_staff"
          roleName="Nhân viên CSVC"
          title="Quản lý Cơ sở vật chất &amp; Thiết bị"
          description="Quản lý phòng học, mượn trả thiết bị, tiếp nhận sự cố và lập lịch bảo trì định kỳ."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <Wrench className="w-6 h-6 text-orange-600 mb-3" />
              <h3 className="font-bold text-lg text-slate-900 mb-1">Sự cố &amp; Sửa chữa</h3>
              <p className="text-sm text-slate-500">Tiếp nhận báo hỏng thiết bị từ giáo viên, cập nhật tiến độ khắc phục.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <FileText className="w-6 h-6 text-blue-600 mb-3" />
              <h3 className="font-bold text-lg text-slate-900 mb-1">Danh mục Tài sản</h3>
              <p className="text-sm text-slate-500">Theo dõi số lượng, tình trạng sử dụng và phân bổ tài sản tại các phòng học.</p>
            </div>
          </div>
        </DashboardLayout>
      );

    case '/student/dashboard':
      return (
        <DashboardLayout
          roleCode="student"
          roleName="Học sinh"
          title="Không gian Học tập Học sinh"
          description="Tra cứu thời khóa biểu cá nhân, lịch thi, kết quả điểm số và thông báo nhà trường."
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <Calendar className="w-6 h-6 text-cyan-600 mb-3" />
              <h3 className="font-bold text-lg text-slate-900 mb-1">Thời khóa biểu của tôi</h3>
              <p className="text-sm text-slate-500">Xem lịch học từng ngày, phòng học và giáo viên giảng dạy môn học.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <Award className="w-6 h-6 text-blue-600 mb-3" />
              <h3 className="font-bold text-lg text-slate-900 mb-1">Bảng điểm Cá nhân</h3>
              <p className="text-sm text-slate-500">Tra cứu kết quả học tập, điểm các bài kiểm tra được giáo viên công bố.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <GraduationCap className="w-6 h-6 text-emerald-600 mb-3" />
              <h3 className="font-bold text-lg text-slate-900 mb-1">Chuyên cần &amp; Lịch thi</h3>
              <p className="text-sm text-slate-500">Xem số buổi học, số tiết vắng và lịch thi các môn học trong kỳ.</p>
            </div>
          </div>
        </DashboardLayout>
      );

    case '/parent/dashboard':
      return (
        <DashboardLayout
          roleCode="parent"
          roleName="Phụ huynh"
          title="Cổng thông tin Phụ huynh"
          description="Theo dõi quá trình học tập, chuyên cần của con em, nộp đơn xin phép nghỉ và tra cứu học phí."
        >
          {hasPermission('parent_academics.view') && <button className="mb-4 rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white"
            onClick={() => setCurrentDashboard('/parent/schedule')}>Lịch đã công bố</button>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <Award className="w-6 h-6 text-purple-600 mb-3" />
              <h3 className="font-bold text-lg text-slate-900 mb-1">Kết quả Học tập của Con</h3>
              <p className="text-sm text-slate-500">Xem điểm số, nhận xét của giáo viên bộ môn và giáo viên chủ nhiệm.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <Clock className="w-6 h-6 text-teal-600 mb-3" />
              <h3 className="font-bold text-lg text-slate-900 mb-1">Điểm danh &amp; Xin nghỉ</h3>
              <p className="text-sm text-slate-500">Nhận cảnh báo chuyên cần và gửi đơn xin phép nghỉ trực tuyến đến GVCN.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <DollarSign className="w-6 h-6 text-rose-600 mb-3" />
              <h3 className="font-bold text-lg text-slate-900 mb-1">Học phí &amp; Khoản thu</h3>
              <p className="text-sm text-slate-500">Tra cứu thông báo thu học phí, lịch sử giao dịch và biên lai thu tiền.</p>
            </div>
          </div>
        </DashboardLayout>
      );

    default:
      return <LoginPage />;
  }
};
