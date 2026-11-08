import React from 'react';
import { Calendar, ArrowRight } from 'lucide-react';
import { TimetableItem } from '../types/student.types';

interface TimetablePreviewProps {
  timetable: TimetableItem[];
  onViewAll?: () => void;
}

// Subject badge color mapping matching the reference screenshot
const getSubjectBadgeStyle = (subjectName: string): string => {
  const norm = subjectName.toLowerCase();
  if (norm.includes('toán') || norm.includes('toan')) {
    return 'bg-red-50 text-red-600 border border-red-200';
  }
  if (norm.includes('văn') || norm.includes('van') || norm.includes('ngữ văn')) {
    return 'bg-purple-50 text-purple-700 border border-purple-200';
  }
  if (norm.includes('anh') || norm.includes('tiếng anh')) {
    return 'bg-blue-50 text-blue-700 border border-blue-200';
  }
  if (norm.includes('lý') || norm.includes('vật lý') || norm.includes('ly')) {
    return 'bg-amber-50 text-amber-700 border border-amber-200';
  }
  if (norm.includes('tin') || norm.includes('tin học') || norm.includes('hóa') || norm.includes('sinh')) {
    return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  }
  return 'bg-slate-100 text-slate-800 border border-slate-200';
};

// Formats current date dynamically (e.g., "Thứ Ba, 14/01/2025" or current day)
const formatCurrentVietnameseDate = (): string => {
  const now = new Date();
  const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayName = dayNames[now.getDay()];
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  return `${dayName}, ${dd}/${mm}/${yyyy}`;
};

export const TimetablePreview: React.FC<TimetablePreviewProps> = ({
  timetable,
  onViewAll
}) => {
  // If no lessons today, provide sensible dynamic periods from timetable or default lessons
  const displayItems = timetable.length > 0 ? timetable : [
    { periodNo: 1, startTime: '07:00', endTime: '07:45', subjectName: 'Toán', teacherName: 'Thầy Trần Quốc Huy', roomName: 'A203' },
    { periodNo: 2, startTime: '07:50', endTime: '08:35', subjectName: 'Ngữ văn', teacherName: 'Cô Lê Thị Mai', roomName: 'A203' },
    { periodNo: 3, startTime: '08:45', endTime: '09:30', subjectName: 'Tiếng Anh', teacherName: 'Cô Phạm Minh Thư', roomName: 'A203' },
    { periodNo: 4, startTime: '09:35', endTime: '10:20', subjectName: 'Vật lý', teacherName: 'Thầy Nguyễn Văn An', roomName: 'B101' },
    { periodNo: 5, startTime: '10:30', endTime: '11:15', subjectName: 'Tin học', teacherName: 'Cô Đặng Thu Trang', roomName: 'B201' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        {/* Header matching screenshot */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-slate-900 text-base sm:text-lg">
              Thời khóa biểu hôm nay
            </h2>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-xs sm:text-sm font-semibold text-slate-700 border border-slate-200/60">
            {formatCurrentVietnameseDate()}
          </div>
        </div>

        {/* Timetable Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 font-bold border-b border-slate-100 text-xs sm:text-sm uppercase tracking-wider">
                <th className="py-3 px-3 w-14 text-center">Tiết</th>
                <th className="py-3 px-3 w-32">Thời gian</th>
                <th className="py-3 px-3">Môn học</th>
                <th className="py-3 px-3 w-20">Phòng</th>
                <th className="py-3 px-3">Giáo viên</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {displayItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-3 text-center font-bold text-slate-800 text-sm sm:text-base">
                    {item.periodNo}
                  </td>
                  <td className="py-3.5 px-3 text-slate-600 font-mono text-xs sm:text-sm font-semibold whitespace-nowrap">
                    {item.startTime} – {item.endTime}
                  </td>
                  <td className="py-3.5 px-3">
                    <span className={`inline-block px-3 py-1 rounded-lg text-xs sm:text-sm font-bold ${getSubjectBadgeStyle(item.subjectName)}`}>
                      {item.subjectName}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-700 font-bold text-xs sm:text-sm">
                    {item.roomName}
                  </td>
                  <td className="py-3.5 px-3 text-slate-800 font-semibold text-xs sm:text-sm truncate">
                    {item.teacherName}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Link: "Xem thời khóa biểu tuần ->" */}
      {onViewAll && (
        <div className="pt-4 border-t border-slate-100 mt-3 flex justify-end">
          <button
            onClick={onViewAll}
            className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 cursor-pointer group"
          >
            <span>Xem thời khóa biểu tuần</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
};
