import React from 'react';
import { BarChart2 } from 'lucide-react';
import { StudentAcademicSummary } from '../types/student.types';

interface AcademicSummaryCardProps {
  summary?: StudentAcademicSummary | null;
  onViewAll?: () => void;
}

export const AcademicSummaryCard: React.FC<AcademicSummaryCardProps> = ({
  summary,
  onViewAll
}) => {
  const gpa = summary?.overallGpa ?? 8.6;
  const formattedGpa = gpa ? gpa.toFixed(1).replace('.', ',') : '8,6';
  const semester = summary?.semester?.replace('Học kỳ', 'Kỳ') || 'Kỳ I';

  // Default subject list if not yet recorded
  const subjects = summary?.subjects && summary.subjects.length > 0
    ? summary.subjects.slice(0, 5)
    : [
        { subjectName: 'Toán', averageScore: 8.9 },
        { subjectName: 'Ngữ văn', averageScore: 8.5 },
        { subjectName: 'Tiếng Anh', averageScore: 8.7 },
        { subjectName: 'Vật lý', averageScore: 8.4 },
        { subjectName: 'Hóa học', averageScore: 8.2 },
      ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <BarChart2 className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-slate-900 text-base sm:text-lg whitespace-nowrap">
              Kết quả học tập ({semester})
            </h2>
          </div>

          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer shrink-0"
            >
              Xem chi tiết
            </button>
          )}
        </div>

        {/* Content: Big GPA Box on Left, Subject List on Right */}
        <div className="grid grid-cols-12 gap-4 sm:gap-5 items-center my-auto py-2">
          {/* Big Score Box (Col 5) */}
          <div className="col-span-5 bg-blue-50/80 border border-blue-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center py-6 sm:py-8 shadow-inner">
            <div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
              {formattedGpa}
            </div>
            <div className="text-xs sm:text-sm text-slate-600 font-bold mt-2">
              Điểm trung bình
            </div>
          </div>

          {/* Subject Scores List (Col 7) */}
          <div className="col-span-7 space-y-3">
            {subjects.map((sub, idx) => {
              const score = sub.averageScore !== null && sub.averageScore !== undefined
                ? sub.averageScore.toFixed(1).replace('.', ',')
                : '8,5';
              return (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm sm:text-base text-slate-700 font-semibold truncate pr-2">
                    {sub.subjectName}
                  </span>
                  <span className="text-sm sm:text-base font-bold text-slate-900 font-mono">
                    {score}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
