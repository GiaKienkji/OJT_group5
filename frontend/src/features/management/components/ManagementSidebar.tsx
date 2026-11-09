import React from 'react';
import { 
  LayoutDashboard, 
  CheckCircle2, 
  CheckSquare, 
  FileText, 
  LogOut, 
  ChevronRight,
  School
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

interface ManagementSidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  pendingCount?: number;
}

export const ManagementSidebar: React.FC<ManagementSidebarProps> = ({ currentTab, onSelectTab, pendingCount = 0 }) => {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Bảng Điều hành Toàn trường', icon: LayoutDashboard, badge: 'KPIs' },
    { id: 'approvals', label: 'Trung tâm Phê duyệt', icon: CheckCircle2, badge: pendingCount > 0 ? `${pendingCount} chờ` : undefined, alert: pendingCount > 0 },
    { id: 'tasks', label: 'Giao việc & Giám sát Tiến độ', icon: CheckSquare, badge: 'BF08' },
    { id: 'reports', label: 'Báo cáo Vận hành & Niên khóa', icon: FileText, badge: 'BGH' },
  ];

  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col min-h-screen text-slate-300">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
          <School className="w-5 h-5" />
        </div>
        <div>
          <div className="font-bold text-white text-base tracking-wide flex items-center gap-2">
            SOMS GOVERN
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">BGH</span>
          </div>
          <p className="text-xs text-slate-400">Ban Giám Hiệu Nhà Trường</p>
        </div>
      </div>

      {/* User Mini Profile */}
      <div className="p-4 mx-4 my-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
          {user?.fullName?.charAt(0) || 'B'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white truncate">{user?.fullName || 'Hiệu Trưởng'}</div>
          <div className="text-xs text-indigo-400 font-medium">Hội đồng Điều hành</div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 space-y-1.5">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Nghiệp vụ Điều hành
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                    item.alert 
                      ? 'bg-rose-500 text-white font-bold animate-pulse'
                      : isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-4 h-4 text-white/70" />}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span>Đăng xuất hệ thống</span>
        </button>
      </div>
    </aside>
  );
};
