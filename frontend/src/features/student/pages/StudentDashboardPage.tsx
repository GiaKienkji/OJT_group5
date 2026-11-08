import React from 'react';
import { useStudentDashboard } from '../hooks/useStudentDashboard';
import { StudentProfileCard } from '../components/StudentProfileCard';
import { StudentOverviewCards } from '../components/StudentOverviewCard';
import { TimetablePreview } from '../components/TimetablePreview';
import { AcademicSummaryCard } from '../components/AcademicSummary';
import { AttendanceSummaryCard } from '../components/AttendanceSummary';
import { AnnouncementList } from '../components/AnnouncementList';
import { ExamPreview } from '../components/ExamPreview';
import { StudentFeeCard } from '../components/StudentFeeCard';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface StudentDashboardPageProps {
  onNavigate: (route: string) => void;
}

export const StudentDashboardPage: React.FC<StudentDashboardPageProps> = ({ onNavigate }) => {
  const { data, isLoading, error, refetch } = useStudentDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Skeleton Profile Banner */}
        <div className="h-36 bg-white rounded-3xl border border-slate-100" />
        
        {/* Skeleton KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100" />
          ))}
        </div>

        {/* Skeleton Middle Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 h-80 bg-white rounded-2xl border border-slate-100" />
          <div className="lg:col-span-4 h-80 bg-white rounded-2xl border border-slate-100" />
          <div className="lg:col-span-3 h-80 bg-white rounded-2xl border border-slate-100" />
        </div>

        {/* Skeleton Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 h-80 bg-white rounded-2xl border border-slate-100" />
          <div className="lg:col-span-4 h-80 bg-white rounded-2xl border border-slate-100" />
          <div className="lg:col-span-3 h-80 bg-white rounded-2xl border border-slate-100" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-slate-100 text-center max-w-lg mx-auto my-12 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-extrabold text-slate-900 mb-1">Không thể tải dữ liệu Bảng điều khiển</h3>
        <p className="text-xs text-slate-500 mb-4">{error || 'Đã có lỗi xảy ra khi truy vấn dữ liệu từ máy chủ.'}</p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Thử lại</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Row 0: Hero Welcome & Identity Banner */}
      <StudentProfileCard
        profile={data.profile}
        onViewProfile={() => onNavigate('/student/profile')}
      />

      {/* Row 1: 4 KPI Overview Cards */}
      <StudentOverviewCards
        todayLessonsCount={data.todayLessonsCount}
        attendanceRate={data.attendanceRate}
        averageScore={data.academicSummary?.overallGpa ?? 8.6}
        unreadAnnouncementsCount={data.unreadAnnouncementsCount}
        onNavigate={onNavigate}
      />

      {/* Row 2: Equal Height 3-Card Grid (5 cols | 4 cols | 3 cols = 12 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Today's Timetable */}
        <div className="lg:col-span-5 h-full">
          <TimetablePreview
            timetable={data.todayTimetable}
            onViewAll={() => onNavigate('/student/timetable')}
          />
        </div>

        {/* Academic Results Summary */}
        <div className="lg:col-span-4 h-full">
          <AcademicSummaryCard
            summary={data.academicSummary}
            onViewAll={() => onNavigate('/student/grades')}
          />
        </div>

        {/* Attendance Donut & Breakdown */}
        <div className="lg:col-span-3 h-full">
          <AttendanceSummaryCard
            attendance={data.attendanceSummary}
            onViewAll={() => onNavigate('/student/attendance')}
          />
        </div>
      </div>

      {/* Row 3: Equal Height 3-Card Grid (5 cols | 4 cols | 3 cols = 12 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Latest Announcements */}
        <div className="lg:col-span-5 h-full">
          <AnnouncementList
            announcements={data.recentAnnouncements}
            onViewAll={() => onNavigate('/student/announcements')}
            onSelect={() => onNavigate('/student/announcements')}
          />
        </div>

        {/* Upcoming Examination Schedule */}
        <div className="lg:col-span-4 h-full">
          <ExamPreview
            exams={data.upcomingExams}
            onViewAll={() => onNavigate('/student/exams')}
          />
        </div>

        {/* School Fees */}
        <div className="lg:col-span-3 h-full">
          <StudentFeeCard
            fee={data.latestFee}
            onViewAll={() => onNavigate('/student/fees')}
          />
        </div>
      </div>
    </div>
  );
};
