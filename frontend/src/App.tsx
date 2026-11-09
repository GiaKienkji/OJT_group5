import React from 'react';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { DashboardLayout } from './components/DashboardLayout';
import { StudentRoutes } from './features/student/routes/studentRoutes';
import { AdminRoutes } from './features/admin/routes/adminRoutes';
import { ManagementRoutes } from './features/management/routes/managementRoutes';
import { 
  Users, 
  FileText, 
  CheckCircle, 
  Calendar, 
  DollarSign, 
  Wrench, 
  GraduationCap, 
  Award,
  BookOpen,
  Clock
} from 'lucide-react';

export const App: React.FC = () => {
  const { user, isAuthenticated, isLoading, currentDashboard } = useAuth();

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
      return <AdminRoutes />;

    case '/management/dashboard':
      return <ManagementRoutes />;

    case '/academic/dashboard':
      return (
        <DashboardLayout
          roleCode="academic_affairs"
          roleName="Giáo vụ"
          title="Không gian làm việc Giáo vụ"
          description="Quản lý hồ sơ học sinh, phân lớp, lập dự thảo thời khóa biểu và lịch thi."
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <BookOpen className="w-6 h-6 text-emerald-600 mb-3" />
              <h3 className="font-bold text-lg text-slate-900 mb-1">Thời khóa biểu</h3>
              <p className="text-sm text-slate-500">Xếp lịch, kiểm tra trùng phòng, giáo viên và xuất bản TKB chính thức.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <Users className="w-6 h-6 text-blue-600 mb-3" />
              <h3 className="font-bold text-lg text-slate-900 mb-1">Hồ sơ Học sinh</h3>
              <p className="text-sm text-slate-500">Tiếp nhận, phân bổ lớp học, chuyển lớp và quản lý danh sách học sinh.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <Calendar className="w-6 h-6 text-amber-600 mb-3" />
              <h3 className="font-bold text-lg text-slate-900 mb-1">Kỳ thi &amp; Đánh giá</h3>
              <p className="text-sm text-slate-500">Lên lịch thi giữa kỳ, cuối kỳ, phân phòng thi và giám thị coi thi.</p>
            </div>
          </div>
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

    case '/teacher/dashboard':
      return (
        <DashboardLayout
          roleCode="teacher"
          roleName="Giáo viên"
          title="Không gian Giáo viên Giảng dạy"
          description="Lịch dạy cá nhân, ghi nhận chuyên cần, nhập điểm bài kiểm tra và công tác chủ nhiệm lớp."
        >
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
