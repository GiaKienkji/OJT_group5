import React from 'react';
import { 
  Users, 
  ShieldCheck, 
  Building2, 
  History, 
  LayoutDashboard, 
  LogOut,
  ChevronRight,
  Server
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

interface AdminSidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ currentTab, onSelectTab }) => {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Tổng quan hệ thống', icon: LayoutDashboard, badge: 'KPI' },
    { id: 'users', label: 'Quản lý Người dùng', icon: Users, badge: 'ADM-04' },
    { id: 'roles', label: 'Phân quyền RBAC', icon: ShieldCheck, badge: '9 Roles' },
    { id: 'config', label: 'Cấu hình Trường & Niên khóa', icon: Building2, badge: '2025-26' },
    { id: 'audit', label: 'Nhật ký & Giám sát', icon: History, badge: 'Audit' },
  ];

  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col min-h-screen text-slate-300">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
          <Server className="w-5 h-5" />
        </div>
        <div>
          <div className="font-bold text-white text-base tracking-wide flex items-center gap-2">
            SOMS ADMIN
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono">v1.0</span>
          </div>
          <p className="text-xs text-slate-400">Quản trị & Phân quyền</p>
        </div>
      </div>

      {/* User Mini Profile */}
      <div className="p-4 mx-4 my-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
          {user?.fullName?.charAt(0) || 'A'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white truncate">{user?.fullName || 'System Admin'}</div>
          <div className="text-xs text-blue-400 font-mono">Quản trị tối cao</div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 space-y-1.5">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Quản trị vận hành
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
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
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
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
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

