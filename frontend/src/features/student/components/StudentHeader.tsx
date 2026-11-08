import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Bell, 
  Search, 
  GraduationCap, 
  User, 
  LogOut, 
  School
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { StudentProfile } from '../types/student.types';

interface StudentHeaderProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  onOpenMobile: () => void;
  profile?: StudentProfile | null;
  unreadCount?: number;
}

export const StudentHeader: React.FC<StudentHeaderProps> = ({
  onNavigate,
  onOpenMobile,
  profile,
  unreadCount = 2
}) => {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fullName = profile?.fullName || user?.fullName || 'Nguyễn Minh Anh';
  const className = profile?.className || '11A1';
  const schoolName = profile?.schoolName || user?.schoolName || 'Trường THPT Nguyễn Trãi';
  const avatarUrl = profile?.avatarUrl || user?.avatarPath || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face';

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase();
    if (q.includes('khoá') || q.includes('khoa') || q.includes('lịch') || q.includes('lich') || q.includes('tiết')) {
      onNavigate('/student/timetable');
    } else if (q.includes('điểm') || q.includes('diem') || q.includes('kết quả') || q.includes('hoc luc')) {
      onNavigate('/student/grades');
    } else if (q.includes('thi') || q.includes('kiểm tra') || q.includes('kiem tra')) {
      onNavigate('/student/exams');
    } else if (q.includes('tiền') || q.includes('học phí') || q.includes('thu') || q.includes('phi')) {
      onNavigate('/student/fees');
    } else if (q.includes('chuyên cần') || q.includes('vang') || q.includes('muon')) {
      onNavigate('/student/attendance');
    } else {
      onNavigate('/student/announcements');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger + School Branding */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobile}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            aria-label="Mở menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* School Name & Portal Tag matching screenshot */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <School className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2 truncate">
              <span className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight truncate">
                {schoolName}
              </span>
              <span className="text-slate-300 font-light hidden sm:inline">|</span>
              <span className="text-xs sm:text-sm text-slate-500 font-medium hidden sm:inline whitespace-nowrap">
                Cổng thông tin học sinh
              </span>
            </div>
          </div>
        </div>

        {/* Right: Search pill + Notification bell + User identity badge */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {/* Rounded Pill Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm (thời khóa biểu, thông báo...)"
              className="w-64 lg:w-80 pl-9 pr-4 py-2 bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-xs sm:text-sm text-slate-700 placeholder-slate-400 rounded-full border border-transparent focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </form>

          {/* Notification Bell with red badge showing unread count */}
          <button
            onClick={() => onNavigate('/student/announcements')}
            className="relative p-2 rounded-full text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title={unreadCount > 0 ? `Bạn có ${unreadCount} thông báo chưa đọc` : 'Thông báo'}
            aria-label="Thông báo"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white shadow-xs">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* User Profile Pill & Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2.5 p-1 rounded-full hover:bg-slate-50 transition-colors cursor-pointer text-left"
              aria-expanded={isDropdownOpen}
            >
              <img
                src={avatarUrl}
                alt={fullName}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/20 shrink-0"
              />
              <div className="hidden sm:block min-w-0 pr-1">
                <div className="text-xs font-bold text-slate-900 leading-tight truncate">
                  {fullName}
                </div>
                <div className="text-[11px] text-slate-500 font-medium leading-none mt-0.5">
                  Học sinh – {className}
                </div>
              </div>
            </button>

            {/* Profile Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-900">{fullName}</div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">Mã HS: {profile?.studentCode || 'HS230145'}</div>
                  <div className="text-[11px] text-blue-600 font-medium">Lớp {className} • {schoolName}</div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onNavigate('/student/profile');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 cursor-pointer"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Hồ sơ cá nhân</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onNavigate('/student/dashboard');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 cursor-pointer"
                  >
                    <GraduationCap className="w-4 h-4 text-slate-400" />
                    <span>Bảng điều khiển học tập</span>
                  </button>
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={() => logout()}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
