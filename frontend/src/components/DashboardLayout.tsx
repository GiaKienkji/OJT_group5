import React from 'react';
import { 
  LogOut, 
  User, 
  School, 
  Shield, 
  LayoutDashboard, 
  ChevronRight,
  BookOpen,
  Calendar,
  DollarSign,
  Wrench,
  GraduationCap,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DashboardLayoutProps {
  roleCode: string;
  roleName: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  roleCode,
  roleName,
  title,
  description,
  children
}) => {
  const { user, logout, setCurrentDashboard } = useAuth();

  const getRoleIcon = (code: string) => {
    switch (code.toLowerCase()) {
      case 'system_admin': return <Shield className="w-5 h-5 text-indigo-500" />;
      case 'school_management': return <School className="w-5 h-5 text-blue-500" />;
      case 'academic_affairs': return <BookOpen className="w-5 h-5 text-emerald-500" />;
      case 'head_of_department': return <Users className="w-5 h-5 text-amber-500" />;
      case 'teacher': return <Calendar className="w-5 h-5 text-teal-500" />;
      case 'accountant': return <DollarSign className="w-5 h-5 text-rose-500" />;
      case 'facility_staff': return <Wrench className="w-5 h-5 text-orange-500" />;
      case 'student': return <GraduationCap className="w-5 h-5 text-cyan-500" />;
      case 'parent': return <User className="w-5 h-5 text-purple-500" />;
      default: return <LayoutDashboard className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & School Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0B4F8A] text-white flex items-center justify-center font-bold text-lg shadow-sm">
              S
            </div>
            <div>
              <div className="font-extrabold text-slate-900 leading-tight">SOMS</div>
              <div className="text-[11px] text-slate-500 font-medium">
                {user?.schoolName || 'Trường THPT SOMS'}
              </div>
            </div>
          </div>

          {/* User Info & Dashboards Selector */}
          <div className="flex items-center gap-4">
            {/* Multiple Dashboards Selector if user has multiple roles */}
            {user && user.availableDashboards.length > 1 && (
              <div className="hidden sm:flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs">
                <span className="text-slate-500 pl-2 font-medium">Chuyển vai trò:</span>
                {user.availableDashboards.map(d => (
                  <button
                    key={d.roleCode}
                    onClick={() => setCurrentDashboard(d.route)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                      d.roleCode.toLowerCase() === roleCode.toLowerCase()
                        ? 'bg-white text-[#0B4F8A] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {d.roleName}
                  </button>
                ))}
              </div>
            )}

            {/* User Profile Badge */}
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
              <div className="w-9 h-9 rounded-full bg-blue-100 text-[#0B4F8A] font-bold flex items-center justify-center text-sm">
                {user?.fullName.charAt(0) || 'U'}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-bold text-slate-800 leading-tight">{user?.fullName}</div>
                <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{roleName}</span>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => logout()}
              title="Đăng xuất"
              className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors ml-1 cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Role Banner */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0 shadow-xs">
              {getRoleIcon(roleCode)}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#0B4F8A] mb-1">
                <span>Vai trò: {roleName}</span>
                <ChevronRight className="w-3 h-3" />
                <span className="font-mono text-[11px]">{roleCode}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
              <p className="text-sm text-slate-500 mt-1 max-w-2xl">{description}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
};
