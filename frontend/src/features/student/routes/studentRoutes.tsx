import React, { useState, useEffect } from 'react';
import { StudentLayout } from '../layouts/StudentLayout';
import { StudentAnnouncementsProvider } from '../context/StudentAnnouncementsContext';
import { StudentDashboardPage } from '../pages/StudentDashboardPage';
import { StudentProfilePage } from '../pages/StudentProfilePage';
import { StudentTimetablePage } from '../pages/StudentTimetablePage';
import { StudentAttendancePage } from '../pages/StudentAttendancePage';
import { StudentGradesPage } from '../pages/StudentGradesPage';
import { StudentExamsPage } from '../pages/StudentExamsPage';
import { StudentAnnouncementsPage } from '../pages/StudentAnnouncementsPage';
import { StudentFeesPage } from '../pages/StudentFeesPage';
import { StudentSupportPage } from '../pages/StudentSupportPage';
import { useAuth } from '../../../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export const StudentRoutes: React.FC = () => {
  const { user, hasRole, logout, setCurrentDashboard } = useAuth();

  // Get initial route from window.location.pathname or default to /student/dashboard
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    const path = window.location.pathname;
    if (path.startsWith('/student/')) {
      return path;
    }
    return '/student/dashboard';
  });

  // Handle browser back / forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.startsWith('/student')) {
        setCurrentRoute(path);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (route: string) => {
    setCurrentRoute(route);
    if (window.location.pathname !== route) {
      window.history.pushState(null, '', route);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // RBAC Guard check
  const isStudent = hasRole('student') || hasRole('system_admin');
  if (!isStudent) {
    const fallbackDashboard = user?.defaultDashboard || '/admin/dashboard';
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 max-w-md w-full text-center shadow-lg">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Truy cập bị từ chối (403 Forbidden)</h2>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Tài khoản hiện tại ({user?.email}) thuộc vai trò <strong>{user?.roles?.join(', ')}</strong>, không có quyền truy cập Cổng thông tin học sinh SOMS.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => {
                setCurrentDashboard(fallbackDashboard);
              }}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Về Bảng điều khiển của bạn ({fallbackDashboard})
            </button>
            <button
              onClick={() => logout()}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Route Dispatcher
  const renderPage = () => {
    const route = currentRoute.toLowerCase().split('?')[0];

    switch (route) {
      case '/student/dashboard':
        return <StudentDashboardPage onNavigate={handleNavigate} />;

      case '/student/profile':
        return <StudentProfilePage />;

      case '/student/timetable':
        return <StudentTimetablePage />;

      case '/student/attendance':
        return <StudentAttendancePage />;

      case '/student/grades':
        return <StudentGradesPage />;

      case '/student/exams':
        return <StudentExamsPage />;

      case '/student/announcements':
        return <StudentAnnouncementsPage />;

      case '/student/fees':
        return <StudentFeesPage />;

      case '/student/support':
        return <StudentSupportPage />;

      default:
        return <StudentDashboardPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <StudentAnnouncementsProvider>
      <StudentLayout
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
      >
        {renderPage()}
      </StudentLayout>
    </StudentAnnouncementsProvider>
  );
};
