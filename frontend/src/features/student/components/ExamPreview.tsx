import React from 'react';
import { CalendarCheck, Clock, MapPin } from 'lucide-react';
import { ExamItem } from '../types/student.types';

interface ExamPreviewProps {
  exams: ExamItem[];
  onViewAll?: () => void;
}

export const ExamPreview: React.FC<ExamPreviewProps> = ({
  exams,
  onViewAll
}) => {
  const displayExams = exams.length > 0 ? exams.slice(0, 3) : [
    {
      id: '1',
      subjectName: 'Toán',
      examTitle: 'Kiểm tra giữa kỳ',
      startsAt: '2025-01-17T07:00:00',
      endsAt: '2025-01-17T08:45:00',
      roomName: 'A203'
    },
    {
      id: '2',
      subjectName: 'Tiếng Anh',
      examTitle: 'Kiểm tra giữa kỳ',
      startsAt: '2025-01-18T09:00:00',
      endsAt: '2025-01-18T10:45:00',
      roomName: 'A203'
    },
    {
      id: '3',
      subjectName: 'Vật lý',
      examTitle: 'Kiểm tra giữa kỳ',
      startsAt: '2025-01-21T07:00:00',
      endsAt: '2025-01-21T08:45:00',
      roomName: 'B101'
    }
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-slate-900 text-base sm:text-lg">
              Lịch kiểm tra sắp tới
            </h2>
          </div>

          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
            >
              Xem chi tiết
            </button>
          )}
        </div>

        {/* Exams List */}
        <div className="space-y-4 my-auto">
          {displayExams.map((exam, idx) => {
            const date = new Date(exam.startsAt);
            const day = date.getDate();
            const month = `Th${String(date.getMonth() + 1).padStart(2, '0')}`;
            const startTime = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            const endDate = exam.endsAt ? new Date(exam.endsAt) : new Date(date.getTime() + 90 * 60000);
            const endTime = endDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            const cleanRoom = exam.roomName ? exam.roomName.replace(/^phòng\s*/i, '') : 'A203';

            return (
              <div key={exam.id || idx} className="flex items-center gap-3.5">
                {/* Date Badge Box */}
                <div className="w-12 h-14 rounded-xl bg-slate-100/90 border border-slate-200/60 flex flex-col items-center justify-center shrink-0">
                  <span className="text-base sm:text-lg font-black text-slate-900 leading-none">
                    {day}
                  </span>
                  <span className="text-xs font-bold text-slate-600 uppercase mt-1 leading-none">
                    {month}
                  </span>
                </div>

                {/* Exam Details */}
                <div className="min-w-0 flex-1">
                  <div className="text-sm sm:text-base font-bold text-slate-900 truncate">
                    {exam.subjectName} – {exam.examTitle}
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 font-semibold mt-1">
                    <div className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{startTime} – {endTime}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>Phòng {cleanRoom}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
