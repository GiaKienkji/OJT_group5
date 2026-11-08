import React from 'react';
import { UserCheck } from 'lucide-react';
import { AttendanceSummary as AttendanceSummaryType } from '../types/student.types';

interface AttendanceSummaryProps {
  attendance?: AttendanceSummaryType | null;
  onViewAll?: () => void;
}

export const AttendanceSummaryCard: React.FC<AttendanceSummaryProps> = ({
  attendance,
  onViewAll
}) => {
  const rate = attendance?.attendanceRate ?? 98.2;
  const formattedRate = rate.toFixed(1).replace('.', ',');
  const present = attendance?.presentCount ?? 196;
  const late = attendance?.lateCount ?? 2;
  const excused = attendance?.excusedAbsenceCount ?? 1;
  const unexcused = attendance?.unexcusedAbsenceCount ?? 1;

  // Donut SVG circumference calculation (r = 40 => 2 * PI * 40 ≈ 251.32)
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (rate / 100) * circumference;

  return (
    <div 
      onClick={onViewAll}
      className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm flex flex-col justify-between h-full cursor-pointer group hover:shadow-md transition-shadow"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-slate-900 text-base sm:text-lg">
              Chuyên cần
            </h2>
          </div>
        </div>

        {/* Content: Donut Chart on Left, Breakdown List on Right */}
        <div className="grid grid-cols-12 gap-3 sm:gap-4 items-center my-auto py-2">
          {/* Donut Chart (Col 5) */}
          <div className="col-span-5 flex items-center justify-center relative">
            <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
              {/* Background Track */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-slate-100"
                strokeWidth="10"
                fill="transparent"
              />
              {/* Active Emerald Progress Ring */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-emerald-500 transition-all duration-1000 ease-out"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            {/* Center Text inside Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                {formattedRate}%
              </span>
              <span className="text-xs text-slate-600 font-semibold leading-tight mt-0.5">
                Có mặt
              </span>
            </div>
          </div>

          {/* Breakdown List with Colored Dots (Col 7) */}
          <div className="col-span-7 space-y-2.5">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-slate-700 font-semibold truncate">Có mặt</span>
              </div>
              <span className="font-bold text-slate-900 font-mono ml-2 shrink-0">{present} buổi</span>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                <span className="text-slate-700 font-semibold truncate">Đi muộn</span>
              </div>
              <span className="font-bold text-slate-900 font-mono ml-2 shrink-0">{late} buổi</span>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                <span className="text-slate-700 font-semibold truncate">Nghỉ có phép</span>
              </div>
              <span className="font-bold text-slate-900 font-mono ml-2 shrink-0">{excused} buổi</span>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
                <span className="text-slate-700 font-semibold truncate" title="Nghỉ không phép">K.phép</span>
              </div>
              <span className="font-bold text-slate-900 font-mono ml-2 shrink-0">{unexcused} buổi</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
