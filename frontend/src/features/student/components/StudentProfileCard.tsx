import React from 'react';
import { IdCard, Users, Calendar } from 'lucide-react';
import { StudentProfile } from '../types/student.types';

interface StudentProfileCardProps {
  profile?: StudentProfile | null;
  onViewProfile?: () => void;
}

export const StudentProfileCard: React.FC<StudentProfileCardProps> = ({
  profile,
  onViewProfile
}) => {
  const fullName = profile?.fullName || 'Nguyễn Minh Anh';
  const studentCode = profile?.studentCode || 'HS230145';
  const className = profile?.className || '11A1';
  const academicYear = profile?.academicYear || '2025 – 2026';
  const avatarUrl = profile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face';

  return (
    <div 
      onClick={onViewProfile}
      className="bg-white rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden cursor-pointer group hover:shadow-md transition-shadow"
    >
      {/* Background with school building & Vietnamese flag on right */}
      <div className="absolute inset-y-0 right-0 w-full sm:w-3/5 lg:w-1/2 pointer-events-none select-none overflow-hidden">
        {/* Fallback image with school campus & Vietnamese flag */}
        <div 
          className="w-full h-full bg-cover bg-right bg-no-repeat transition-transform duration-500 group-hover:scale-105"
          style={{ 
            backgroundImage: "url('/assets/clean-school-bg.jpg')",
            backgroundPosition: "right 20% center"
          }}
        />
        {/* Smooth gradient blend to white */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 via-30% to-transparent" />
      </div>

      {/* Content Area */}
      <div className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6 max-w-2xl">
        {/* Student Avatar */}
        <div className="relative shrink-0">
          <img
            src={avatarUrl}
            alt={fullName}
            className="w-20 h-20 sm:w-22 sm:h-22 rounded-full object-cover ring-4 ring-white shadow-md"
          />
        </div>

        {/* Text Details & Pills */}
        <div className="space-y-2">
          <div className="text-slate-500 text-sm font-medium leading-none">
            Xin chào,
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
            {fullName}
          </h1>

          {/* 3 Inline Badges matching screenshot */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/90 text-xs font-semibold text-slate-700 border border-slate-200/50">
              <IdCard className="w-3.5 h-3.5 text-slate-500" />
              <span>Mã HS: {studentCode}</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/90 text-xs font-semibold text-slate-700 border border-slate-200/50">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Lớp: {className}</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/90 text-xs font-semibold text-slate-700 border border-slate-200/50">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Năm học: {academicYear}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
