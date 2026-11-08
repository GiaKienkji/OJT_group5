import React from 'react';
import { 
  GraduationCap, 
  LogOut, 
  ChevronLeft, 
  X
} from 'lucide-react';
import { STUDENT_NAV_ITEMS } from '../constants/studentNavigation';
import { useAuth } from '../../../context/AuthContext';

const SIDEBAR_BG_URL = '/assets/student-sidebar-bg.jpg';

interface StudentSidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  schoolName?: string;
  unreadCount?: number;
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({
  currentRoute,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  schoolName,
  unreadCount
}) => {
  const { user, logout } = useAuth();
  const displaySchool = schoolName || user?.schoolName || 'Trường THPT Nguyễn Trãi';

  const handleItemClick = (route: string) => {
    onNavigate(route);
    onCloseMobile();
  };

  const sidebarContent = (
    <div 
      className="flex flex-col h-full text-white select-none relative overflow-hidden bg-[#071F4F]"
      style={{
        backgroundImage: `url(${SIDEBAR_BG_URL})`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Brand & Logo Header without dividing line */}
      <div className={`h-20 flex items-center justify-between px-4 shrink-0 transition-all duration-300 ${isCollapsed ? 'justify-center px-2' : ''}`}>
        <div 
          onClick={() => handleItemClick('/student/dashboard')}
          className="flex items-center gap-3 cursor-pointer group min-w-0"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/25 border border-white/20 backdrop-blur-xs text-white flex items-center justify-center shadow-inner shrink-0 group-hover:bg-blue-500/35 transition-colors">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div className={`min-w-0 transition-all duration-300 ease-in-out ${
            isCollapsed ? 'opacity-0 w-0 max-w-0 overflow-hidden pointer-events-none' : 'opacity-100 max-w-[150px]'
          }`}>
            <div className="font-black text-white tracking-wider text-xl leading-none">SOMS</div>
            <div className="text-[11px] text-blue-200/80 truncate mt-1" title={displaySchool}>
              {displaySchool}
            </div>
          </div>
        </div>

        {/* Mobile Close Button */}
        <button
          onClick={onCloseMobile}
          className="md:hidden p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
          aria-label="Đóng thanh menu"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className={`hidden md:flex p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/15 active:scale-95 transition-all duration-300 cursor-pointer shadow-2xs ${
            isCollapsed ? 'mt-0' : ''
          }`}
          title={isCollapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
        >
          <div className={`transition-transform duration-300 ease-in-out ${isCollapsed ? 'rotate-180' : 'rotate-0'}`}>
            <ChevronLeft className="w-4 h-4" />
          </div>
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto scrollbar-none">
        {STUDENT_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute.toLowerCase() === item.route.toLowerCase();

          // Calculate dynamic badge for announcements if unreadCount is provided
          const badgeToDisplay =
            item.id === 'announcements' && unreadCount !== undefined
              ? unreadCount > 0
                ? unreadCount > 99
                  ? '99+'
                  : String(unreadCount)
                : undefined
              : item.badge;

          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.route)}
              title={isCollapsed ? item.title : undefined}
              className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ease-in-out cursor-pointer text-left relative overflow-hidden group ${
                isActive
                  ? 'bg-[#1877F2] text-white font-semibold shadow-md shadow-blue-950/40'
                  : 'text-blue-100/85 hover:text-white hover:bg-white/10'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-blue-200 group-hover:text-white'}`} />
              
              <span className={`truncate transition-all duration-300 ease-in-out ${
                isCollapsed ? 'opacity-0 w-0 max-w-0 pointer-events-none' : 'flex-1 opacity-100 max-w-[160px]'
              }`}>
                {item.title}
              </span>

              {!isCollapsed && badgeToDisplay && (
                <span className="min-w-5 h-5 px-1.5 rounded-full bg-rose-500 text-white text-[11px] font-black flex items-center justify-center shrink-0 shadow-xs transition-opacity duration-300">
                  {badgeToDisplay}
                </span>
              )}
              {!isCollapsed && !badgeToDisplay && item.hasNotificationDot && (
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-[#0B3E75] shrink-0" />
              )}
              {isCollapsed && badgeToDisplay && (
                <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                  {badgeToDisplay}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Spacer giving room to the books illustration at bottom of sidebar image */}
      {!isCollapsed && (
        <div className="h-16 sm:h-20 shrink-0 pointer-events-none transition-all duration-300" />
      )}

      {/* Logout button at bottom - NỔI BẬT VỚI HIỆU ỨNG GRADIENT & KÍNH MỜ */}
      <div className="px-3 pb-4 pt-2 relative z-10 shrink-0">
        <button
          onClick={() => logout()}
          title="Đăng xuất khỏi hệ thống"
          className={`w-full flex items-center gap-2.5 rounded-2xl transition-all duration-300 ease-in-out cursor-pointer relative group overflow-hidden ${
            isCollapsed
              ? 'w-11 h-11 mx-auto justify-center px-0 bg-white/15 hover:bg-gradient-to-r hover:from-rose-500 hover:to-rose-600 text-white border border-white/20 shadow-md shadow-blue-950/40 hover:scale-105 hover:shadow-rose-900/50'
              : 'px-4 py-3 justify-center bg-white/15 hover:bg-gradient-to-r hover:from-rose-500 hover:to-rose-600 text-white border border-white/25 shadow-md shadow-blue-950/30 hover:shadow-lg hover:shadow-rose-950/40 backdrop-blur-md active:scale-98'
          }`}
        >
          {/* Subtle background glow effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-rose-500/0 via-rose-500/20 to-rose-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Icon with container */}
          <div className="p-1 rounded-lg bg-white/10 group-hover:bg-white/20 transition-all duration-200 shrink-0 flex items-center justify-center">
            <LogOut className="w-4 h-4 text-white group-hover:-translate-x-0.5 group-hover:scale-110 transition-transform duration-200" />
          </div>

          {/* Label with smooth text collapse */}
          <span className={`font-bold text-sm tracking-wide text-white transition-all duration-300 ease-in-out whitespace-nowrap ${
            isCollapsed ? 'opacity-0 w-0 max-w-0 overflow-hidden pointer-events-none' : 'opacity-100 max-w-[120px]'
          }`}>
            Đăng xuất
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:block shrink-0 sticky top-0 h-screen transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] z-20 overflow-hidden ${
          isCollapsed ? 'w-[76px]' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="md:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Container */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-[#0A2E68] z-50 transform transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-2xl ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
};
