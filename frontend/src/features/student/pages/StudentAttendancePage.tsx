import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Info,
  Trophy,
  Megaphone,
  Lightbulb,
  ArrowRight,
  BarChart2,
  BookOpen
} from 'lucide-react';
import { studentApi } from '../services/studentApi';
import {
  AttendanceSummary,
  AttendanceDailyDetail,
  AttendanceMonthlyTrend,
  AttendanceWeeklyBreakdown
} from '../types/student.types';

export const StudentAttendancePage: React.FC = () => {
  // Task View Mode: 'task1' (Ảnh 1 - Nhật ký chi tiết & Donut) | 'task2' (Ảnh 2 - Thống kê xu hướng & Tuần)
  const [activeTask, setActiveTask] = useState<'task1' | 'task2'>('task1');

  // Filter states
  const [filterType, setFilterType] = useState<'month' | 'semester' | 'year'>('month');
  const [selectedMonth, setSelectedMonth] = useState('1/2026');
  const [selectedSemester, setSelectedSemester] = useState('hk1');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2025 – 2026');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Data states
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAttendance = async () => {
    setIsLoading(true);
    try {
      let data: AttendanceSummary;
      if (filterType === 'month') {
        data = await studentApi.getAttendance(undefined, selectedMonth, undefined);
      } else if (filterType === 'semester') {
        data = await studentApi.getAttendance(selectedSemester, undefined, undefined);
      } else {
        data = await studentApi.getAttendance(undefined, undefined, selectedAcademicYear);
      }
      setAttendance(data);
    } catch (err) {
      console.error('Failed fetching attendance data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [filterType, selectedMonth, selectedSemester, selectedAcademicYear]);

  const overviewTitle = useMemo(() => {
    if (filterType === 'month') {
      return `Tổng quan tháng ${selectedMonth}`;
    }
    if (filterType === 'semester') {
      return selectedSemester === 'hk2' ? 'Tổng quan Học kỳ II (2025 – 2026)' : 'Tổng quan Học kỳ I (2025 – 2026)';
    }
    return `Tổng quan ${selectedAcademicYear}`;
  }, [filterType, selectedMonth, selectedSemester, selectedAcademicYear]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAttendance();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-white rounded-3xl border border-slate-100" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-slate-100" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 h-96 bg-white rounded-2xl border border-slate-100" />
          <div className="lg:col-span-7 h-96 bg-white rounded-2xl border border-slate-100" />
        </div>
      </div>
    );
  }

  const dailyDetails: AttendanceDailyDetail[] = attendance?.dailyDetails || [];
  const monthlyTrends: AttendanceMonthlyTrend[] = attendance?.monthlyTrends || [];
  const weeklyBreakdowns: AttendanceWeeklyBreakdown[] = attendance?.weeklyBreakdowns || [];

  // Pagination for daily details table
  const totalPages = Math.ceil(dailyDetails.length / itemsPerPage) || 1;
  const paginatedDaily = dailyDetails.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      {/* ================= TASK / VIEW MODE SELECTOR ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-2xs">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200/60 w-full sm:w-auto">
          <button
            onClick={() => setActiveTask('task1')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTask === 'task1'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Chi tiết &amp; Tỷ lệ chuyên cần</span>
          </button>

          <button
            onClick={() => setActiveTask('task2')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTask === 'task2'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Thống kê xu hướng &amp; Theo tuần</span>
          </button>
        </div>

        <div className="text-right text-xs text-slate-500 font-medium hidden sm:block">
          Dữ liệu trực tiếp từ CSDL Cổng học sinh
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ============================== TASK 1 VIEW ============================== */}
      {/* ========================================================================= */}
      {activeTask === 'task1' && (
        <div className="space-y-6">
          {/* 1. Header Banner matching Image 1 */}
          <div className="bg-gradient-to-r from-blue-50 via-sky-50 to-blue-100/70 rounded-3xl border border-blue-100 shadow-2xs relative overflow-hidden p-6 sm:p-7">
            {/* Right Illustration: Checklist + Graduation cap + plant */}
            <div className="absolute right-4 bottom-0 h-full w-72 pointer-events-none select-none hidden md:flex items-end justify-end opacity-90">
              <svg viewBox="0 0 240 180" className="w-full h-44 drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Potted plant */}
                <path d="M210 145 H235 L230 175 H215 Z" fill="#E2E8F0" />
                <path d="M205 145 H240 V150 H205 Z" fill="#CBD5E1" />
                <path d="M222 145 Q210 120 205 105 Q220 115 222 145 Z" fill="#34D399" />
                <path d="M224 145 Q235 125 240 110 Q230 120 224 145 Z" fill="#10B981" />
                <path d="M222 145 Q220 100 223 85 Q226 100 224 145 Z" fill="#059669" />

                {/* Clipboard */}
                <rect x="70" y="30" width="95" height="135" rx="8" fill="#F8FAFC" stroke="#3B82F6" strokeWidth="2.5" />
                <rect x="95" y="20" width="45" height="18" rx="4" fill="#2563EB" />
                <circle cx="117.5" cy="29" r="3" fill="#FFFFFF" />
                {/* Check items */}
                <rect x="85" y="55" width="12" height="12" rx="3" fill="#D1FAE5" />
                <path d="M87 61 L90 64 L95 58" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="105" y="58" width="45" height="5" rx="2.5" fill="#94A3B8" />

                <rect x="85" y="77" width="12" height="12" rx="3" fill="#D1FAE5" />
                <path d="M87 83 L90 86 L95 80" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="105" y="80" width="40" height="5" rx="2.5" fill="#94A3B8" />

                <rect x="85" y="99" width="12" height="12" rx="3" fill="#D1FAE5" />
                <path d="M87 105 L90 108 L95 102" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="105" y="102" width="48" height="5" rx="2.5" fill="#94A3B8" />

                <rect x="85" y="121" width="12" height="12" rx="3" fill="#D1FAE5" />
                <path d="M87 127 L90 130 L95 124" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="105" y="124" width="35" height="5" rx="2.5" fill="#94A3B8" />

                {/* Graduation Mortarboard */}
                <polygon points="175,70 125,95 175,120 225,95" fill="#1E3A8A" />
                <polygon points="175,70 125,95 175,120 225,95" stroke="#1E293B" strokeWidth="1.5" />
                <path d="M145 105 V130 Q175 145 205 130 V105" fill="#0F172A" />
                <path d="M175 95 L225 105" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="225" cy="110" r="3" fill="#F59E0B" />
              </svg>
            </div>

            {/* Banner Left Content */}
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-13 h-13 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                <CalendarCheck className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  Chuyên cần
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                  Theo dõi tình hình chuyên cần của bạn
                </p>
              </div>
            </div>
          </div>

          {/* 2. Top 5 KPI Cards matching Image 1 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* KPI 1: Tỷ lệ chuyên cần */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-2xs flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 font-semibold mb-1">
                  Tỷ lệ chuyên cần
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {attendance?.attendanceRate ?? 98.2}%
                  </span>
                  <span className="inline-flex items-center text-[10px] sm:text-xs font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/60">
                    ▲ +1.2%
                  </span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 2: Có mặt */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-2xs flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 font-semibold mb-1">
                  Có mặt
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {attendance?.presentCount ?? 45} <span className="text-sm font-medium text-slate-500">buổi</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 3: Vắng có phép */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-2xs flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 font-semibold mb-1">
                  Vắng có phép
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {attendance?.excusedAbsenceCount ?? 1} <span className="text-sm font-medium text-slate-500">buổi</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/20">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 4: Vắng không phép */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-2xs flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 font-semibold mb-1">
                  Vắng không phép
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {attendance?.unexcusedAbsenceCount ?? 0} <span className="text-sm font-medium text-slate-500">buổi</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-rose-500/20">
                <XCircle className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 5: Đi muộn */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-2xs flex items-center justify-between col-span-2 sm:col-span-1">
              <div>
                <div className="text-xs text-slate-500 font-semibold mb-1">
                  Đi muộn
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {attendance?.lateCount ?? 2} <span className="text-sm font-medium text-slate-500">buổi</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-purple-500/20">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* 3. Filter Navigation Bar matching Image 1 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Left 3 tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => {
                  setFilterType('month');
                  setCurrentPage(1);
                }}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                  filterType === 'month'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Theo tháng</span>
              </button>

              <button
                onClick={() => {
                  setFilterType('semester');
                  setCurrentPage(1);
                }}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                  filterType === 'semester'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <BarChart2 className="w-4 h-4" />
                <span>Theo học kỳ</span>
              </button>

              <button
                onClick={() => {
                  setFilterType('year');
                  setCurrentPage(1);
                }}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                  filterType === 'year'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Theo năm học</span>
              </button>
            </div>

            {/* Right Dynamic Dropdown according to active filter tab */}
            <div className="flex items-center gap-2">
              <div className="relative inline-block">
                {filterType === 'month' && (
                  <select
                    value={selectedMonth}
                    onChange={(e) => {
                      setSelectedMonth(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="appearance-none bg-white border border-slate-200 text-slate-800 text-xs sm:text-sm font-bold py-2.5 pl-9 pr-9 rounded-xl hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs cursor-pointer"
                  >
                    <option value="1/2026">Tháng 1/2026</option>
                    <option value="12/2025">Tháng 12/2025</option>
                    <option value="11/2025">Tháng 11/2025</option>
                    <option value="10/2025">Tháng 10/2025</option>
                    <option value="9/2025">Tháng 9/2025</option>
                  </select>
                )}

                {filterType === 'semester' && (
                  <select
                    value={selectedSemester}
                    onChange={(e) => {
                      setSelectedSemester(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="appearance-none bg-white border border-slate-200 text-slate-800 text-xs sm:text-sm font-bold py-2.5 pl-9 pr-9 rounded-xl hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs cursor-pointer"
                  >
                    <option value="hk1">Học kỳ I (2025 – 2026)</option>
                    <option value="hk2">Học kỳ II (2025 – 2026)</option>
                  </select>
                )}

                {filterType === 'year' && (
                  <select
                    value={selectedAcademicYear}
                    onChange={(e) => {
                      setSelectedAcademicYear(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="appearance-none bg-white border border-slate-200 text-slate-800 text-xs sm:text-sm font-bold py-2.5 pl-9 pr-9 rounded-xl hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs cursor-pointer"
                  >
                    <option value="2025 – 2026">Năm học 2025 – 2026 (Lớp 11)</option>
                    <option value="2024 – 2025">Năm học 2024 – 2025 (Lớp 10)</option>
                    <option value="2023 – 2024">Năm học 2023 – 2024 (Lớp 9)</option>
                  </select>
                )}
                <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* 4. Main 2-Column Content Layout matching Image 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* LEFT COLUMN: Tổng quan (5 Cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <BarChart2 className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-base">
                    {overviewTitle}
                  </h3>
                </div>

                {/* Donut Chart & Breakdown */}
                <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-6">
                  {/* Circular Donut Ring */}
                  <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      {/* Background circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#F1F5F9"
                        strokeWidth="10"
                      />
                      {/* Có mặt segment */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="10"
                        strokeDasharray="251.2"
                        strokeDashoffset={251.2 - (251.2 * (attendance?.attendanceRate ?? 98.2)) / 100}
                        strokeLinecap="round"
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>

                    {/* Inside donut text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-2xl font-black text-slate-900 tracking-tight">
                        {attendance?.attendanceRate ?? 98.2}%
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        Có mặt
                      </span>
                    </div>
                  </div>

                  {/* Legend list */}
                  <div className="space-y-3 w-full sm:w-auto text-xs sm:text-sm">
                    <div className="flex items-center justify-between sm:justify-start gap-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="text-slate-700 font-medium">Có mặt</span>
                      </div>
                      <span className="font-bold text-slate-900">{attendance?.presentCount ?? 45} buổi</span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-start gap-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <span className="text-slate-700 font-medium">Đi muộn</span>
                      </div>
                      <span className="font-bold text-slate-900">{attendance?.lateCount ?? 2} buổi</span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-start gap-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <span className="text-slate-700 font-medium">Có phép</span>
                      </div>
                      <span className="font-bold text-slate-900">{attendance?.excusedAbsenceCount ?? 1} buổi</span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-start gap-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        <span className="text-slate-700 font-medium">Không phép</span>
                      </div>
                      <span className="font-bold text-slate-900">{attendance?.unexcusedAbsenceCount ?? 0} buổi</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Encouragement Box */}
              <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Trophy className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm text-amber-950">
                    Bạn có tỷ lệ chuyên cần rất tốt!
                  </div>
                  <div className="text-xs text-amber-800 font-medium mt-0.5">
                    Tiếp tục duy trì nhé!
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Chi tiết chuyên cần Table (7 Cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <CalendarCheck className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-slate-900 text-base">
                      Chi tiết chuyên cần
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    Tổng cộng: {dailyDetails.length} bản ghi
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-600 text-xs uppercase font-bold tracking-wider">
                        <th className="py-3 px-3">Ngày học</th>
                        <th className="py-3 px-3">Thứ</th>
                        <th className="py-3 px-3">Tiết học</th>
                        <th className="py-3 px-3">Môn học</th>
                        <th className="py-3 px-3 text-center">Trạng thái</th>
                        <th className="py-3 px-3 text-center">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                      {paginatedDaily.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                            {row.dateFormatted}
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-medium whitespace-nowrap">
                            {row.dayOfWeek}
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-mono text-xs whitespace-nowrap">
                            {row.periodRange}
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-800 max-w-[190px] truncate">
                            {row.subjectList}
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {row.status === 'present' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Có mặt</span>
                              </span>
                            )}
                            {row.status === 'late' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-xs border border-amber-200">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                <span>Đi muộn</span>
                              </span>
                            )}
                            {row.status === 'excused' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                                <span>Có phép</span>
                              </span>
                            )}
                            {row.status === 'unexcused' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-xs border border-rose-200">
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                <span>Không phép</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center text-slate-400 text-xs">
                            {row.note || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination controls matching Image 1 */}
              <div className="flex items-center justify-end gap-1.5 pt-4 border-t border-slate-100 mt-4">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 5. Footer Information Bar matching Image 1 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 px-1">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-500" />
              <span>Dữ liệu chuyên cần được cập nhật từ giáo viên và nhà trường.</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-1.5 hover:text-blue-600 cursor-pointer font-medium"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
                <span>Cập nhật lần cuối: {attendance?.lastUpdated || '09/01/2026 14:30'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ============================== TASK 2 VIEW ============================== */}
      {/* ========================================================================= */}
      {activeTask === 'task2' && (
        <div className="space-y-6">
          {/* 1. Header Banner matching Image 2 */}
          <div className="bg-gradient-to-r from-blue-50/80 via-sky-50 to-blue-100/60 rounded-3xl border border-blue-100 shadow-2xs p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  Chuyên cần
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                  Theo dõi tình hình điểm danh của bạn
                </p>
              </div>
            </div>

            {/* Right Academic Year Dropdown */}
            <div className="relative inline-block self-start sm:self-auto">
              <select
                value={selectedAcademicYear}
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                className="appearance-none bg-white border border-slate-200 text-slate-800 text-xs sm:text-sm font-bold py-2.5 pl-9 pr-9 rounded-xl hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs cursor-pointer"
              >
                <option value="2025 – 2026">Năm học: 2025 – 2026</option>
                <option value="2024 – 2025">Năm học: 2024 – 2025</option>
                <option value="2023 – 2024">Năm học: 2023 – 2024</option>
              </select>
              <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 2. Top 4 KPI Cards matching Image 2 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Tổng số buổi */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 font-semibold mb-1">
                  Tổng số buổi
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {attendance?.semesterSummary?.totalSessions ?? 72} <span className="text-sm font-medium text-slate-500">buổi</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
            </div>

            {/* Card 2: Có mặt */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 font-semibold mb-1">
                  Có mặt
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {attendance?.semesterSummary?.presentCount ?? 69} <span className="text-sm font-medium text-slate-500">buổi</span>
                  </span>
                  <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {attendance?.semesterSummary?.presentRate ?? 95.8}%
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            {/* Card 3: Đi muộn */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 font-semibold mb-1">
                  Đi muộn
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {attendance?.semesterSummary?.lateCount ?? 2} <span className="text-sm font-medium text-slate-500">buổi</span>
                  </span>
                  <span className="text-xs font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    {attendance?.semesterSummary?.lateRate ?? 2.8}%
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            {/* Card 4: Vắng mặt */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 font-semibold mb-1">
                  Vắng mặt
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {attendance?.semesterSummary?.absentCount ?? 1} <span className="text-sm font-medium text-slate-500">buổi</span>
                  </span>
                  <span className="text-xs font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                    {attendance?.semesterSummary?.absentRate ?? 1.4}%
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* 3. Main 2-Column Section matching Image 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* LEFT COLUMN: Thống kê chuyên cần & Line Chart (7 Cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
                  <BarChart2 className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-base">
                    Thống kê chuyên cần
                  </h3>
                </div>

                {/* Sub-tabs & Legend */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                    <button
                      onClick={() => setFilterType('month')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        filterType === 'month' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Theo tháng
                    </button>
                    <button
                      onClick={() => setFilterType('semester')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        filterType === 'semester' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Theo học kỳ
                    </button>
                    <button
                      onClick={() => setFilterType('year')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        filterType === 'year' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Theo năm học
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      <span>Có mặt</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span>Đi muộn</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span>Vắng mặt</span>
                    </div>
                  </div>
                </div>

                {/* SVG Line Chart */}
                {(() => {
                  const trendData = monthlyTrends.length > 0 ? monthlyTrends : [
                    { monthName: 'Tháng 8', presentRate: 94, lateRate: 3.5, absentRate: 2.5 },
                    { monthName: 'Tháng 9', presentRate: 96, lateRate: 2.5, absentRate: 1.5 },
                    { monthName: 'Tháng 10', presentRate: 95, lateRate: 3.0, absentRate: 2.0 },
                    { monthName: 'Tháng 11', presentRate: 97, lateRate: 1.8, absentRate: 1.2 },
                    { monthName: 'Tháng 12', presentRate: 96, lateRate: 2.2, absentRate: 1.8 }
                  ];

                  const xStep = trendData.length > 1 ? 410 / (trendData.length - 1) : 410;
                  const points = trendData.map((d, i) => ({
                    x: 60 + i * xStep,
                    yPresent: 190 - (d.presentRate / 100) * 160,
                    yLate: 190 - (d.lateRate / 100) * 160,
                    yAbsent: 190 - (d.absentRate / 100) * 160,
                    presentLabel: `${Math.round(d.presentRate)}%`,
                    month: d.monthName
                  }));

                  const presentPolyline = points.map(p => `${p.x},${p.yPresent}`).join(' ');
                  const presentArea = `60,190 ${presentPolyline} ${points[points.length - 1].x},190`;
                  const latePolyline = points.map(p => `${p.x},${p.yLate}`).join(' ');
                  const absentPolyline = points.map(p => `${p.x},${p.yAbsent}`).join(' ');

                  return (
                    <div className="h-64 w-full relative pt-4 pb-2">
                      <svg className="w-full h-full" viewBox="0 0 500 220">
                        {/* Horizontal grid lines */}
                        {[0, 20, 40, 60, 80, 100].map((val) => {
                          const y = 190 - (val / 100) * 160;
                          return (
                            <g key={val}>
                              <line x1="35" y1={y} x2="480" y2={y} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
                              <text x="25" y={y + 4} textAnchor="end" className="text-[10px] fill-slate-400 font-mono">
                                {val}
                              </text>
                            </g>
                          );
                        })}

                        {/* Gradient area under Present line */}
                        <defs>
                          <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Area fill */}
                        <polygon points={presentArea} fill="url(#presentGrad)" />

                        {/* Present Blue Line */}
                        <polyline fill="none" stroke="#2563EB" strokeWidth="2.5" points={presentPolyline} />

                        {/* Points & Labels for Present line */}
                        {points.map((pt, i) => (
                          <g key={i}>
                            <circle cx={pt.x} cy={pt.yPresent} r="4" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
                            <text
                              x={pt.x}
                              y={pt.yPresent - 8}
                              textAnchor="middle"
                              className="text-[11px] font-bold fill-slate-800 font-sans"
                            >
                              {pt.presentLabel}
                            </text>
                          </g>
                        ))}

                        {/* Late Amber Line */}
                        <polyline fill="none" stroke="#F59E0B" strokeWidth="2" points={latePolyline} />
                        {points.map((pt, i) => (
                          <circle key={`late-${i}`} cx={pt.x} cy={pt.yLate} r="3" fill="#F59E0B" />
                        ))}

                        {/* Absent Red Line */}
                        <polyline fill="none" stroke="#EF4444" strokeWidth="2" points={absentPolyline} />
                        {points.map((pt, i) => (
                          <circle key={`abs-${i}`} cx={pt.x} cy={pt.yAbsent} r="3" fill="#EF4444" />
                        ))}

                        {/* Month X Labels */}
                        {points.map((lbl, i) => (
                          <text
                            key={`lbl-${i}`}
                            x={lbl.x}
                            y="212"
                            textAnchor="middle"
                            className="text-[11px] font-semibold fill-slate-500"
                          >
                            {lbl.month}
                          </text>
                        ))}
                      </svg>
                    </div>
                  );
                })()}
              </div>

              <div className="pt-2 text-[11px] text-slate-400 font-medium">
                Biểu đồ tỷ lệ chuyên cần theo từng tháng trong năm học.
              </div>
            </div>

            {/* RIGHT COLUMN: Chi tiết chuyên cần tháng 10/2025 Table (5 Cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-slate-900 text-base">
                      Chi tiết chuyên cần tháng 10/2025
                    </h3>
                  </div>

                  <button
                    onClick={() => setActiveTask('task1')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Xem chi tiết</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-center border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-700 font-bold">
                        <th className="py-3 px-2 text-left">Tuần</th>
                        <th className="py-3 px-2">Tổng buổi</th>
                        <th className="py-3 px-2">Có mặt</th>
                        <th className="py-3 px-2">Đi muộn</th>
                        <th className="py-3 px-2">Vắng mặt</th>
                        <th className="py-3 px-2">Tỷ lệ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {weeklyBreakdowns.map((wk, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-2 text-left font-bold text-slate-900">
                            {wk.weekName}
                          </td>
                          <td className="py-3.5 px-2 font-medium text-slate-700">
                            {wk.totalSessions}
                          </td>
                          <td className="py-3.5 px-2 font-bold text-blue-600">
                            {wk.presentCount}
                          </td>
                          <td className="py-3.5 px-2 font-semibold text-amber-600">
                            {wk.lateCount}
                          </td>
                          <td className="py-3.5 px-2 font-semibold text-rose-600">
                            {wk.absentCount}
                          </td>
                          <td className="py-3.5 px-2 font-black text-slate-900">
                            {wk.rate}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 font-medium flex items-center justify-between">
                <span>Tổng cộng tháng: 20 buổi</span>
                <span className="font-bold text-emerald-600">Tỷ lệ tháng: 95.0%</span>
              </div>
            </div>
          </div>

          {/* 4. Bottom 2 Cards matching Image 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card Left: Ghi chú */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-blue-600">
                <Megaphone className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-base">
                  Ghi chú
                </h3>
              </div>

              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5 flex items-start gap-3">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                  Chuyên cần được tính dựa trên dữ liệu điểm danh từ giáo viên. Nếu có thắc mắc, vui lòng liên hệ giáo viên chủ nhiệm.
                </div>
              </div>
            </div>

            {/* Card Right: Quy định */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-blue-600">
                <Lightbulb className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-base">
                  Quy định
                </h3>
              </div>

              <div className="space-y-2 text-xs sm:text-sm text-slate-700">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">Đi muộn:</strong> Có mặt nhưng đến sau giờ bắt đầu tiết học
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">Vắng có phép:</strong> Có lý do được nhà trường chấp thuận
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">Vắng không phép:</strong> Không có lý do hợp lệ
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
