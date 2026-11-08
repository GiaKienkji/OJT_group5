import React, { useState } from 'react';
import { StudentSidebar } from '../components/StudentSidebar';
import { StudentHeader } from '../components/StudentHeader';
import { useStudentProfile } from '../hooks/useStudentProfile';
import { useStudentAnnouncements } from '../context/StudentAnnouncementsContext';

interface StudentLayoutProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  children: React.ReactNode;
  unreadCount?: number;
}

export const StudentLayout: React.FC<StudentLayoutProps> = ({
  currentRoute,
  onNavigate,
  children,
  unreadCount: propUnreadCount
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { profile } = useStudentProfile();

  // Try to use unreadCount from context for real-time reactivity
  let contextUnreadCount: number | undefined;
  try {
    const announcementsContext = useStudentAnnouncements();
    contextUnreadCount = announcementsContext.unreadCount;
  } catch {
    // If not wrapped in provider, fallback to prop
  }

  const effectiveUnreadCount = propUnreadCount !== undefined ? propUnreadCount : (contextUnreadCount ?? 3);

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex font-['Plus_Jakarta_Sans',sans-serif] text-slate-900 antialiased">
      {/* Sidebar (Desktop persistent + Mobile drawer) */}
      <StudentSidebar
        currentRoute={currentRoute}
        onNavigate={onNavigate}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        schoolName={profile?.schoolName}
        unreadCount={effectiveUnreadCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Header */}
        <StudentHeader
          currentRoute={currentRoute}
          onNavigate={onNavigate}
          onOpenMobile={() => setIsMobileOpen(true)}
          profile={profile}
          unreadCount={effectiveUnreadCount}
        />

        {/* Page Content Viewport */}
        <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-7">
          {children}
        </main>

        {/* Enterprise Footer */}
        <footer className="border-t border-slate-200/60 bg-white/70 py-4 px-4 sm:px-6 lg:px-8 text-center sm:text-left text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            &copy; 2026 SOMS – Cổng Thông Tin Học Sinh (School Operations Management System).
          </div>
          <div className="flex items-center gap-4 text-slate-500 font-medium">
            <span>{profile?.schoolName || 'Trường THPT Nguyễn Trãi'}</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
