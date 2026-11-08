import React from 'react';
import { 
  Calendar, 
  ShieldCheck, 
  BarChart2, 
  Bell, 
  ChevronRight 
} from 'lucide-react';

interface StudentOverviewCardsProps {
  todayLessonsCount: number;
  attendanceRate: number;
  averageScore?: number | null;
  unreadAnnouncementsCount: number;
  onNavigate: (route: string) => void;
}

export const StudentOverviewCards: React.FC<StudentOverviewCardsProps> = ({
  todayLessonsCount,
  attendanceRate,
  averageScore = 8.6,
  unreadAnnouncementsCount,
  onNavigate
}) => {
  // Format percentage with Vietnamese comma (e.g., 98,2%)
  const formattedAttendance = attendanceRate ? `${attendanceRate.toFixed(1).replace('.', ',')}%` : '98,2%';
  const formattedScore = averageScore !== null && averageScore !== undefined ? averageScore.toFixed(1).replace('.', ',') : '8,6';

  const cards = [
    {
      id: 'lessons',
      title: 'Môn học hôm nay',
      value: `${todayLessonsCount || 5} môn`,
      icon: Calendar,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      route: '/student/timetable'
    },
    {
      id: 'attendance',
      title: 'Tỷ lệ chuyên cần',
      value: formattedAttendance,
      icon: ShieldCheck,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      route: '/student/attendance'
    },
    {
      id: 'gpa',
      title: 'Điểm trung bình kỳ I',
      value: formattedScore,
      icon: BarChart2,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      route: '/student/grades'
    },
    {
      id: 'announcements',
      title: 'Thông báo mới',
      value: `${unreadAnnouncementsCount || 3}`,
      icon: Bell,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      route: '/student/announcements'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            onClick={() => onNavigate(card.route)}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className={`w-13 h-13 rounded-2xl ${card.iconBg} ${card.iconColor} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm text-slate-500 font-semibold truncate">
                  {card.title}
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                  {card.value}
                </div>
              </div>
            </div>

            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all shrink-0" />
          </div>
        );
      })}
    </div>
  );
};
