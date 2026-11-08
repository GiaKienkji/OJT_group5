import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarDays,
  Calendar,
  Clock,
  MapPin,
  User,
  Printer,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  ArrowLeftRight,
  BookOpen,
  CheckCircle2,
  Megaphone,
  History,
  X,
  ChevronDown,
  ArrowRight
} from 'lucide-react';
import { studentApi } from '../services/studentApi';
import { TimetableItem, TimetableChangeNotification } from '../types/student.types';

// Subject badge color helper matching exact screenshot styling
const getSubjectCellBadge = (subjectName: string) => {
  const norm = subjectName.toLowerCase();
  if (norm.includes('toán') || norm.includes('toan')) {
    return {
      bg: 'bg-red-50 hover:bg-red-100/80 border-red-100 text-red-600',
      iconColor: 'text-red-500',
      boxBg: 'bg-red-50 text-red-600'
    };
  }
  if (norm.includes('văn') || norm.includes('van') || norm.includes('ngữ văn') || norm.includes('nghệ thuật') || norm.includes('âm nhạc')) {
    return {
      bg: 'bg-purple-50 hover:bg-purple-100/80 border-purple-100 text-purple-700',
      iconColor: 'text-purple-500',
      boxBg: 'bg-purple-50 text-purple-700'
    };
  }
  if (norm.includes('anh') || norm.includes('tiếng anh') || norm.includes('ielts')) {
    return {
      bg: 'bg-blue-50 hover:bg-blue-100/80 border-blue-100 text-blue-700',
      iconColor: 'text-blue-500',
      boxBg: 'bg-blue-50 text-blue-700'
    };
  }
  if (norm.includes('lý') || norm.includes('vật lý') || norm.includes('lịch sử') || norm.includes('sử')) {
    return {
      bg: 'bg-amber-50 hover:bg-amber-100/80 border-amber-100 text-amber-700',
      iconColor: 'text-amber-500',
      boxBg: 'bg-amber-50 text-amber-700'
    };
  }
  if (norm.includes('hóa') || norm.includes('hóa học')) {
    return {
      bg: 'bg-sky-50 hover:bg-sky-100/80 border-sky-100 text-sky-700',
      iconColor: 'text-sky-500',
      boxBg: 'bg-sky-50 text-sky-700'
    };
  }
  if (norm.includes('sinh') || norm.includes('địa') || norm.includes('tin') || norm.includes('gdtc') || norm.includes('thể thao') || norm.includes('stem') || norm.includes('quốc phòng')) {
    return {
      bg: 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-100 text-emerald-700',
      iconColor: 'text-emerald-500',
      boxBg: 'bg-emerald-50 text-emerald-700'
    };
  }
  if (norm.includes('tn-hn') || norm.includes('hướng nghiệp') || norm.includes('kỹ năng') || norm.includes('tự học') || norm.includes('tự chọn') || norm.includes('đoàn') || norm.includes('tổng kết')) {
    return {
      bg: 'bg-indigo-50 hover:bg-indigo-100/80 border-indigo-100 text-indigo-700',
      iconColor: 'text-indigo-500',
      boxBg: 'bg-indigo-50 text-indigo-700'
    };
  }
  return {
    bg: 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700',
    iconColor: 'text-slate-500',
    boxBg: 'bg-slate-100 text-slate-700'
  };
};

const FALLBACK_TIMETABLE_ITEMS: TimetableItem[] = [
  // Thứ Hai
  { weekday: 2, periodNo: 1, periodName: 'Tiết 1', startTime: '07:00', endTime: '07:45', subjectName: 'Toán', subjectCode: 'TOAN', teacherName: 'Thầy Trần Quốc Huy', roomName: 'A203', session: 'morning' },
  { weekday: 2, periodNo: 2, periodName: 'Tiết 2', startTime: '07:50', endTime: '08:35', subjectName: 'Ngữ văn', subjectCode: 'VAN', teacherName: 'Cô Lê Thị Mai', roomName: 'A203', session: 'morning' },
  { weekday: 2, periodNo: 3, periodName: 'Tiết 3', startTime: '08:45', endTime: '09:30', subjectName: 'Tiếng Anh', subjectCode: 'ANH', teacherName: 'Cô Phạm Minh Thư', roomName: 'A203', session: 'morning' },
  { weekday: 2, periodNo: 4, periodName: 'Tiết 4', startTime: '09:35', endTime: '10:20', subjectName: 'Lịch sử', subjectCode: 'SU', teacherName: 'Cô Phan Hoàng Oanh', roomName: 'B201', session: 'morning' },
  { weekday: 2, periodNo: 5, periodName: 'Tiết 5', startTime: '10:30', endTime: '11:15', subjectName: 'Tin học', subjectCode: 'TIN', teacherName: 'Cô Đặng Thu Trang', roomName: 'B201', session: 'morning' },
  { weekday: 2, periodNo: 1, periodName: 'Tiết 1', startTime: '13:30', endTime: '14:15', subjectName: 'Bồi dưỡng Toán', subjectCode: 'TOAN_NC', teacherName: 'Thầy Trần Quốc Huy', roomName: 'A203', session: 'afternoon' },
  { weekday: 2, periodNo: 2, periodName: 'Tiết 2', startTime: '14:20', endTime: '15:05', subjectName: 'Bồi dưỡng Toán', subjectCode: 'TOAN_NC', teacherName: 'Thầy Trần Quốc Huy', roomName: 'A203', session: 'afternoon' },
  { weekday: 2, periodNo: 3, periodName: 'Tiết 3', startTime: '15:15', endTime: '16:00', subjectName: 'Tiếng Anh tăng cường', subjectCode: 'ANH_TC', teacherName: 'Cô Phạm Minh Thư', roomName: 'Phòng Lab 1', session: 'afternoon' },
  { weekday: 2, periodNo: 4, periodName: 'Tiết 4', startTime: '16:05', endTime: '16:50', subjectName: 'Hoạt động TN-HN', subjectCode: 'HDTN', teacherName: 'Cô Lê Thị Mai', roomName: 'Hội trường', session: 'afternoon' },
  { weekday: 2, periodNo: 5, periodName: 'Tiết 5', startTime: '16:55', endTime: '17:40', subjectName: 'Tự học có hướng dẫn', subjectCode: 'TU_HOC', teacherName: 'Cô Lê Thị Mai', roomName: 'A203', session: 'afternoon' },

  // Thứ Ba (Hôm nay)
  { weekday: 3, periodNo: 1, periodName: 'Tiết 1', startTime: '07:00', endTime: '07:45', subjectName: 'Ngữ văn', subjectCode: 'VAN', teacherName: 'Cô Lê Thị Mai', roomName: 'A203', session: 'morning' },
  { weekday: 3, periodNo: 2, periodName: 'Tiết 2', startTime: '07:50', endTime: '08:35', subjectName: 'Toán', subjectCode: 'TOAN', teacherName: 'Thầy Trần Quốc Huy', roomName: 'A203', session: 'morning' },
  { weekday: 3, periodNo: 3, periodName: 'Tiết 3', startTime: '08:45', endTime: '09:30', subjectName: 'Vật lý', subjectCode: 'LY', teacherName: 'Thầy Nguyễn Văn An', roomName: 'B101', session: 'morning' },
  { weekday: 3, periodNo: 4, periodName: 'Tiết 4', startTime: '09:35', endTime: '10:20', subjectName: 'Địa lý', subjectCode: 'DIA', teacherName: 'Cô Đặng Thu Trang', roomName: 'B201', session: 'morning' },
  { weekday: 3, periodNo: 5, periodName: 'Tiết 5', startTime: '10:30', endTime: '11:15', subjectName: 'Ngữ văn', subjectCode: 'VAN', teacherName: 'Cô Lê Thị Mai', roomName: 'A203', session: 'morning' },
  { weekday: 3, periodNo: 1, periodName: 'Tiết 1', startTime: '13:30', endTime: '14:15', subjectName: 'Ôn tập Vật lý', subjectCode: 'LY_OT', teacherName: 'Thầy Nguyễn Văn An', roomName: 'B101', session: 'afternoon' },
  { weekday: 3, periodNo: 2, periodName: 'Tiết 2', startTime: '14:20', endTime: '15:05', subjectName: 'Ôn tập Hóa học', subjectCode: 'HOA_OT', teacherName: 'Cô Nguyễn Thanh Tâm', roomName: 'B101', session: 'afternoon' },
  { weekday: 3, periodNo: 3, periodName: 'Tiết 3', startTime: '15:15', endTime: '16:00', subjectName: 'CLB Thể thao', subjectCode: 'CLB_TT', teacherName: 'Thầy Mai Văn Trọng', roomName: 'Sân bóng rổ', session: 'afternoon' },
  { weekday: 3, periodNo: 4, periodName: 'Tiết 4', startTime: '16:05', endTime: '16:50', subjectName: 'CLB Tin học - STEM', subjectCode: 'CLB_STEM', teacherName: 'Cô Đặng Thu Trang', roomName: 'Phòng Lab Tin 2', session: 'afternoon' },
  { weekday: 3, periodNo: 5, periodName: 'Tiết 5', startTime: '16:55', endTime: '17:40', subjectName: 'Sinh hoạt chuyên đề', subjectCode: 'SHCD', teacherName: 'Cô Phạm Minh Thư', roomName: 'A203', session: 'afternoon' },

  // Thứ Tư
  { weekday: 4, periodNo: 1, periodName: 'Tiết 1', startTime: '07:00', endTime: '07:45', subjectName: 'Tiếng Anh', subjectCode: 'ANH', teacherName: 'Cô Phạm Minh Thư', roomName: 'A203', session: 'morning' },
  { weekday: 4, periodNo: 2, periodName: 'Tiết 2', startTime: '07:50', endTime: '08:35', subjectName: 'Hóa học', subjectCode: 'HOA', teacherName: 'Cô Nguyễn Thanh Tâm', roomName: 'B101', session: 'morning' },
  { weekday: 4, periodNo: 3, periodName: 'Tiết 3', startTime: '08:45', endTime: '09:30', subjectName: 'Toán', subjectCode: 'TOAN', teacherName: 'Thầy Trần Quốc Huy', roomName: 'A203', session: 'morning' },
  { weekday: 4, periodNo: 4, periodName: 'Tiết 4', startTime: '09:35', endTime: '10:20', subjectName: 'Toán', subjectCode: 'TOAN', teacherName: 'Thầy Trần Quốc Huy', roomName: 'A203', session: 'morning' },
  { weekday: 4, periodNo: 5, periodName: 'Tiết 5', startTime: '10:30', endTime: '11:15', subjectName: 'Sinh học', subjectCode: 'SINH', teacherName: 'Thầy Bùi Minh Đức', roomName: 'B201', session: 'morning' },
  { weekday: 4, periodNo: 1, periodName: 'Tiết 1', startTime: '13:30', endTime: '14:15', subjectName: 'Chuyên đề Ngữ văn', subjectCode: 'VAN_CD', teacherName: 'Cô Lê Thị Mai', roomName: 'A203', session: 'afternoon' },
  { weekday: 4, periodNo: 2, periodName: 'Tiết 2', startTime: '14:20', endTime: '15:05', subjectName: 'Chuyên đề Ngữ văn', subjectCode: 'VAN_CD', teacherName: 'Cô Lê Thị Mai', roomName: 'A203', session: 'afternoon' },
  { weekday: 4, periodNo: 3, periodName: 'Tiết 3', startTime: '15:15', endTime: '16:00', subjectName: 'Tiếng Anh giao tiếp', subjectCode: 'ANH_GT', teacherName: 'Thầy John Miller', roomName: 'Phòng Lab 1', session: 'afternoon' },
  { weekday: 4, periodNo: 4, periodName: 'Tiết 4', startTime: '16:05', endTime: '16:50', subjectName: 'Kỹ năng mềm', subjectCode: 'KNM', teacherName: 'Thầy Bùi Minh Đức', roomName: 'B201', session: 'afternoon' },
  { weekday: 4, periodNo: 5, periodName: 'Tiết 5', startTime: '16:55', endTime: '17:40', subjectName: 'Tự chọn nâng cao', subjectCode: 'TC_NC', teacherName: 'Thầy Trần Quốc Huy', roomName: 'A203', session: 'afternoon' },

  // Thứ Năm
  { weekday: 5, periodNo: 1, periodName: 'Tiết 1', startTime: '07:00', endTime: '07:45', subjectName: 'Vật lý', subjectCode: 'LY', teacherName: 'Thầy Nguyễn Văn An', roomName: 'B101', session: 'morning' },
  { weekday: 5, periodNo: 2, periodName: 'Tiết 2', startTime: '07:50', endTime: '08:35', subjectName: 'Sinh học', subjectCode: 'SINH', teacherName: 'Thầy Bùi Minh Đức', roomName: 'B201', session: 'morning' },
  { weekday: 5, periodNo: 3, periodName: 'Tiết 3', startTime: '08:45', endTime: '09:30', subjectName: 'Ngữ văn', subjectCode: 'VAN', teacherName: 'Cô Lê Thị Mai', roomName: 'A203', session: 'morning' },
  { weekday: 5, periodNo: 4, periodName: 'Tiết 4', startTime: '09:35', endTime: '10:20', subjectName: 'Hóa học', subjectCode: 'HOA', teacherName: 'Cô Nguyễn Thanh Tâm', roomName: 'B101', session: 'morning' },
  { weekday: 5, periodNo: 5, periodName: 'Tiết 5', startTime: '10:30', endTime: '11:15', subjectName: 'Tiếng Anh', subjectCode: 'ANH', teacherName: 'Cô Phạm Minh Thư', roomName: 'A203', session: 'morning' },
  { weekday: 5, periodNo: 1, periodName: 'Tiết 1', startTime: '13:30', endTime: '14:15', subjectName: 'Thực hành Hóa học', subjectCode: 'HOA_TH', teacherName: 'Cô Nguyễn Thanh Tâm', roomName: 'Phòng TN Hóa', session: 'afternoon' },
  { weekday: 5, periodNo: 2, periodName: 'Tiết 2', startTime: '14:20', endTime: '15:05', subjectName: 'Thực hành Sinh học', subjectCode: 'SINH_TH', teacherName: 'Thầy Bùi Minh Đức', roomName: 'Phòng TN Sinh', session: 'afternoon' },
  { weekday: 5, periodNo: 3, periodName: 'Tiết 3', startTime: '15:15', endTime: '16:00', subjectName: 'Bồi dưỡng Lịch sử', subjectCode: 'SU_NC', teacherName: 'Cô Phan Hoàng Oanh', roomName: 'B201', session: 'afternoon' },
  { weekday: 5, periodNo: 4, periodName: 'Tiết 4', startTime: '16:05', endTime: '16:50', subjectName: 'CLB Nghệ thuật', subjectCode: 'CLB_NT', teacherName: 'Cô Hoàng Yến', roomName: 'Phòng Âm nhạc', session: 'afternoon' },
  { weekday: 5, periodNo: 5, periodName: 'Tiết 5', startTime: '16:55', endTime: '17:40', subjectName: 'Đọc sách nghiên cứu', subjectCode: 'DOC_SACH', teacherName: 'Cô Nguyễn Thị Lan', roomName: 'Thư viện', session: 'afternoon' },

  // Thứ Sáu
  { weekday: 6, periodNo: 1, periodName: 'Tiết 1', startTime: '07:00', endTime: '07:45', subjectName: 'Toán', subjectCode: 'TOAN', teacherName: 'Thầy Trần Quốc Huy', roomName: 'A203', session: 'morning' },
  { weekday: 6, periodNo: 2, periodName: 'Tiết 2', startTime: '07:50', endTime: '08:35', subjectName: 'Tiếng Anh', subjectCode: 'ANH', teacherName: 'Cô Phạm Minh Thư', roomName: 'A203', session: 'morning' },
  { weekday: 6, periodNo: 3, periodName: 'Tiết 3', startTime: '08:45', endTime: '09:30', subjectName: 'Tin học', subjectCode: 'TIN', teacherName: 'Cô Đặng Thu Trang', roomName: 'B201', session: 'morning' },
  { weekday: 6, periodNo: 4, periodName: 'Tiết 4', startTime: '09:35', endTime: '10:20', subjectName: 'GDTC', subjectCode: 'GDTC', teacherName: 'Thầy Mai Văn Trọng', roomName: 'Nhà đa năng', session: 'morning' },
  { weekday: 6, periodNo: 5, periodName: 'Tiết 5', startTime: '10:30', endTime: '11:15', subjectName: 'Sinh hoạt lớp', subjectCode: 'SHL', teacherName: 'Cô Lê Thị Mai', roomName: 'A203', session: 'morning' },
  { weekday: 6, periodNo: 1, periodName: 'Tiết 1', startTime: '13:30', endTime: '14:15', subjectName: 'Bồi dưỡng Toán', subjectCode: 'TOAN_NC', teacherName: 'Thầy Trần Quốc Huy', roomName: 'A203', session: 'afternoon' },
  { weekday: 6, periodNo: 2, periodName: 'Tiết 2', startTime: '14:20', endTime: '15:05', subjectName: 'Tiếng Anh IELTS', subjectCode: 'ANH_IELTS', teacherName: 'Cô Phạm Minh Thư', roomName: 'A203', session: 'afternoon' },
  { weekday: 6, periodNo: 3, periodName: 'Tiết 3', startTime: '15:15', endTime: '16:00', subjectName: 'GD Quốc phòng', subjectCode: 'GDQP', teacherName: 'Thầy Hoàng Nam', roomName: 'Sân trường', session: 'afternoon' },
  { weekday: 6, periodNo: 4, periodName: 'Tiết 4', startTime: '16:05', endTime: '16:50', subjectName: 'Sinh hoạt Đoàn trường', subjectCode: 'SH_DOAN', teacherName: 'Bí thư Đoàn', roomName: 'Hội trường lớn', session: 'afternoon' },
  { weekday: 6, periodNo: 5, periodName: 'Tiết 5', startTime: '16:55', endTime: '17:40', subjectName: 'Tổng kết tuần', subjectCode: 'TK_TUAN', teacherName: 'Cô Lê Thị Mai', roomName: 'A203', session: 'afternoon' }
];

const FALLBACK_TIMETABLE_CHANGES: TimetableChangeNotification[] = [
  {
    id: 'change-1',
    title: 'Thay đổi giáo viên bộ môn',
    type: 'substitute',
    badgeText: 'Dạy thay',
    description: 'Thứ Tư (15/01) – Tiết 2: Môn Hóa học',
    detail: 'Giáo viên dạy thay: Thầy Phan Văn Hùng (Cô Nguyễn Thanh Tâm đi công tác bồi dưỡng chuyên môn).',
    effectiveDate: '15/01/2025'
  },
  {
    id: 'change-2',
    title: 'Chuyển phòng học thực hành',
    type: 'room_change',
    badgeText: 'Đã cập nhật',
    description: 'Thứ Năm (16/01) – Tiết 4: Môn Hóa học',
    detail: 'Chuyển từ Phòng học A203 sang Phòng thí nghiệm Hóa học B101 để thực hiện bài thí nghiệm.',
    effectiveDate: '16/01/2025'
  }
];

export interface WeekdayInfo {
  no: number;
  label: string;
  day: string;
  month: string;
  year: number;
  dateStr: string;
  fullDateStr: string;
  isToday: boolean;
}

export interface WeekRangeInfo {
  weekNo: number;
  startDateStr: string;
  endDateStr: string;
  rangeStr: string;
  days: WeekdayInfo[];
}

// Helper tính toán chính xác ngày Thứ Hai -> Thứ Sáu cho từng tuần học trong năm học 2024–2025
// Mốc chuẩn: Tuần 20 là từ Thứ Hai 13/01/2025 đến Thứ Sáu 17/01/2025
export function getWeekDates(weekNumber: number): WeekRangeInfo {
  const anchorMonday = new Date(2025, 0, 13); // 13/01/2025
  const diffDays = (weekNumber - 20) * 7;
  
  const monday = new Date(anchorMonday);
  monday.setDate(anchorMonday.getDate() + diffDays);
  
  const labelMap: Record<number, string> = {
    2: 'Thứ Hai',
    3: 'Thứ Ba',
    4: 'Thứ Tư',
    5: 'Thứ Năm',
    6: 'Thứ Sáu'
  };

  const days: WeekdayInfo[] = [2, 3, 4, 5, 6].map((dayNo, index) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + index);
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    const isToday = (weekNumber === 20 && dayNo === 3);
    
    return {
      no: dayNo,
      label: labelMap[dayNo],
      day,
      month,
      year,
      dateStr: `${day}/${month}`,
      fullDateStr: `${day}/${month}/${year}`,
      isToday
    };
  });
  
  const startStr = `${days[0].day}/${days[0].month}/${days[0].year}`;
  const endStr = `${days[4].day}/${days[4].month}/${days[4].year}`;
  
  return {
    weekNo: weekNumber,
    startDateStr: startStr,
    endDateStr: endStr,
    rangeStr: `${startStr} – ${endStr}`,
    days
  };
}

const ALL_WEEKS: WeekRangeInfo[] = Array.from({ length: 37 }, (_, i) => getWeekDates(i + 1));

export const StudentTimetablePage: React.FC = () => {
  const [timetable, setTimetable] = useState<TimetableItem[]>(FALLBACK_TIMETABLE_ITEMS);
  const [changes, setChanges] = useState<TimetableChangeNotification[]>(FALLBACK_TIMETABLE_CHANGES);
  const [isLoading, setIsLoading] = useState(false);

  // View tabs: 'week' | 'day' | 'changes' | 'history'
  const [viewTab, setViewTab] = useState<'week' | 'day' | 'changes' | 'history'>('week');

  // Session: 'morning' | 'afternoon'
  const [session, setSession] = useState<'morning' | 'afternoon'>('morning');

  // Week number: default Week 20 (13/01/2025 – 17/01/2025)
  const [weekNo, setWeekNo] = useState(20);

  // Tính toán động ngày cho tuần được chọn
  const weekDates = useMemo<WeekRangeInfo>(() => getWeekDates(weekNo), [weekNo]);
  const weekdays: WeekdayInfo[] = weekDates.days;

  // Lịch học thay đổi linh hoạt theo tuần (VD: Tuần 37 là tuần ôn thi cuối kỳ II & tổng kết năm học)
  const currentWeekTimetable = useMemo<TimetableItem[]>(() => {
    if (weekNo === 37) {
      return timetable.map(item => {
        if (item.subjectName === 'Toán') {
          return { ...item, note: 'Ôn tập & Luyện đề thi HKII' };
        }
        if (item.subjectName === 'Ngữ văn') {
          return { ...item, note: 'Hệ thống hóa tác phẩm văn học HKII' };
        }
        if (item.subjectName === 'Tiếng Anh') {
          return { ...item, note: 'Luyện đề thi mẫu Tiếng Anh 11' };
        }
        if (item.subjectName === 'Vật lý') {
          return { ...item, note: 'Ôn tập công thức & giải đề thi' };
        }
        if (item.subjectName === 'Hóa học') {
          return { ...item, note: 'Ôn tập lý thuyết & bài tập Hóa' };
        }
        if (item.subjectName === 'Sinh hoạt lớp') {
          return { ...item, subjectName: 'Tổng kết năm học', note: 'Xếp loại thi đua & hoàn thiện hồ sơ' };
        }
        return { ...item, note: item.note || 'Ôn tập cuối kỳ II' };
      });
    }

    if (weekNo === 20) {
      return timetable.map(item => {
        if (item.weekday === 4 && item.periodNo === 2 && (item.session || 'morning').toLowerCase() === 'morning') {
          return {
            ...item,
            isSubstitute: true,
            substituteTeacherName: 'Thầy Phan Văn Hùng',
            note: 'Dạy thay: Thầy Phan Văn Hùng'
          };
        }
        if (item.weekday === 5 && item.periodNo === 4 && (item.session || 'morning').toLowerCase() === 'morning') {
          return {
            ...item,
            roomName: 'B101 (Phòng TN)',
            note: 'Chuyển sang Phòng TN Hóa học B101'
          };
        }
        return item;
      });
    }

    if (weekNo >= 35) {
      return timetable.map(item => ({ ...item, note: `Ôn tập học kỳ II (Tuần ${weekNo})` }));
    }
    if (weekNo <= 5) {
      return timetable.map(item => ({ ...item, note: `Nề nếp đầu năm học (Tuần ${weekNo})` }));
    }

    return timetable;
  }, [timetable, weekNo]);

  // Lịch thay đổi theo tuần được chọn
  const currentWeekChanges = useMemo(() => {
    if (weekNo === 20) return changes;
    if (weekNo === 37) {
      return [
        {
          id: 'change-w37-1',
          title: 'Lịch ôn tập tăng cường môn Toán',
          type: 'room_change' as const,
          badgeText: 'Ôn thi HKII',
          description: `Thứ Ba (${weekdays[1].dateStr}) – Tiết 1, 2: Môn Toán`,
          detail: 'Tăng cường giải đề minh họa kỳ thi kiểm tra học kỳ II năm học 2024–2025.',
          effectiveDate: weekdays[1].fullDateStr
        },
        {
          id: 'change-w37-2',
          title: 'Tổng kết năm học & Hoàn tất học bạ',
          type: 'substitute' as const,
          badgeText: 'Tổng kết',
          description: `Thứ Sáu (${weekdays[4].dateStr}) – Tiết 5: Sinh hoạt lớp`,
          detail: 'Đánh giá xếp loại hạnh kiểm, học lực và chuẩn bị tổng kết năm học.',
          effectiveDate: weekdays[4].fullDateStr
        }
      ];
    }
    return [
      {
        id: `change-w${weekNo}-1`,
        title: `Kế hoạch học tập Tuần ${weekNo}`,
        type: 'room_change' as const,
        badgeText: 'Kế hoạch',
        description: `Áp dụng từ Thứ Hai (${weekdays[0].dateStr}) đến Thứ Sáu (${weekdays[4].dateStr})`,
        detail: `Toàn thể học sinh lớp 11A1 thực hiện học tập đúng theo phân phối chương trình Tuần ${weekNo}.`,
        effectiveDate: weekdays[0].fullDateStr
      }
    ];
  }, [weekNo, changes, weekdays]);

  // Currently selected period for "Chi tiết tiết học"
  const [selectedSlot, setSelectedSlot] = useState<TimetableItem | null>(() => {
    return FALLBACK_TIMETABLE_ITEMS.find(t => t.weekday === 3 && t.periodNo === 1 && (t.session || 'morning').toLowerCase() === 'morning') || FALLBACK_TIMETABLE_ITEMS[0];
  });

  // Selected day for 'Theo ngày' view (2 = Thứ Hai, 3 = Thứ Ba, ...)
  const [selectedDay, setSelectedDay] = useState<number>(3); // Default Tuesday (Thứ Ba)

  // Print modal state & print session selection
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printSession, setPrintSession] = useState<'all' | 'morning' | 'afternoon'>('morning');

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [ttData, changesData] = await Promise.all([
          studentApi.getTimetable(),
          studentApi.getTimetableChanges()
        ]);
        if (isMounted) {
          if (ttData && ttData.length > 0) {
            setTimetable(ttData);
            const defaultSlot = ttData.find(t => t.weekday === 3 && t.periodNo === 1 && (t.session || 'morning').toLowerCase() === 'morning') || ttData[0] || null;
            setSelectedSlot(defaultSlot);
          }
          if (changesData && changesData.length > 0) {
            setChanges(changesData);
          }
        }
      } catch {
        // Fallback dataset already loaded seamlessly
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  const morningPeriods = [
    { no: 1, time: '07:00 – 07:45' },
    { no: 2, time: '07:50 – 08:35' },
    { no: 3, time: '08:45 – 09:30' },
    { no: 4, time: '09:35 – 10:20' },
    { no: 5, time: '10:30 – 11:15' }
  ];

  const afternoonPeriods = [
    { no: 1, time: '13:30 – 14:15' },
    { no: 2, time: '14:20 – 15:05' },
    { no: 3, time: '15:15 – 16:00' },
    { no: 4, time: '16:05 – 16:50' },
    { no: 5, time: '16:55 – 17:40' }
  ];

  const currentPeriods = session === 'morning' ? morningPeriods : afternoonPeriods;

  const handleSessionChange = (newSession: 'morning' | 'afternoon') => {
    setSession(newSession);
    const newSlot = currentWeekTimetable.find(
      t => t.weekday === 3 && t.periodNo === 1 && (t.session || 'morning').toLowerCase() === newSession.toLowerCase()
    ) || currentWeekTimetable.find(
      t => (t.session || 'morning').toLowerCase() === newSession.toLowerCase()
    ) || null;
    if (newSlot) setSelectedSlot(newSlot);
  };

  const getSlot = (weekday: number, periodNo: number, targetSession: string = session) => {
    return currentWeekTimetable.find(
      t => t.weekday === weekday && 
           t.periodNo === periodNo && 
           (t.session || 'morning').toLowerCase() === targetSession.toLowerCase()
    );
  };

  // Lessons for Active Day (Thứ Ba) in the selected week
  const todayLessons = currentWeekTimetable
    .filter(t => t.weekday === 3 && (t.session || 'morning').toLowerCase() === session.toLowerCase())
    .sort((a, b) => a.periodNo - b.periodNo);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-white rounded-3xl border border-slate-100" />
        <div className="h-14 bg-white rounded-2xl border border-slate-100" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 h-96 bg-white rounded-2xl border border-slate-100" />
          <div className="lg:col-span-4 h-96 bg-white rounded-2xl border border-slate-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Banner matching screenshot with school campus & flag background */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
        {/* School background with Vietnamese flag on right */}
        <div className="absolute inset-y-0 right-0 w-full sm:w-3/5 lg:w-1/2 pointer-events-none select-none overflow-hidden">
          <div
            className="w-full h-full bg-cover bg-right bg-no-repeat transition-transform duration-700 hover:scale-105"
            style={{
              backgroundImage: "url('/assets/clean-school-bg.jpg')",
              backgroundPosition: "right 20% center"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 via-30% to-transparent" />
        </div>

        {/* Content of Header Banner */}
        <div className="relative z-10 p-6 sm:p-7 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-inner">
            <CalendarDays className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              Thời khóa biểu
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              Lịch học của lớp 11A1 • Năm học 2025 – 2026 • Học kỳ I
            </p>
          </div>
        </div>
      </div>

      {/* 2. Main View Selector & Export Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: 4 View Tabs matching screenshot */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin">
          <button
            onClick={() => setViewTab('week')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              viewTab === 'week'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Theo tuần</span>
          </button>

          <button
            onClick={() => setViewTab('day')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              viewTab === 'day'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Theo ngày</span>
          </button>

          <button
            onClick={() => setViewTab('changes')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              viewTab === 'changes'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Lịch thay đổi</span>
            {changes.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>

          <button
            onClick={() => setViewTab('history')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              viewTab === 'history'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Lịch sử</span>
          </button>
        </div>

        {/* Right: Print / Export PDF button */}
        <button
          onClick={() => setIsPrintModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Printer className="w-4 h-4 text-slate-600" />
          <span>In / Xuất PDF</span>
        </button>
      </div>

      {/* 3. Week Navigation & Session Toggle Bar */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Week Navigator */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setWeekNo(prev => Math.max(1, prev - 1))}
              disabled={weekNo <= 1}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
              title="Tuần trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Dropdown Selector */}
            <div className="relative group">
              <select
                value={weekNo}
                onChange={(e) => setWeekNo(Number(e.target.value))}
                aria-label="Chọn tuần học"
                className="appearance-none pl-3.5 pr-8 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all shadow-2xs"
              >
                {ALL_WEEKS.map(w => (
                  <option key={w.weekNo} value={w.weekNo}>
                    Tuần {w.weekNo} • {w.rangeStr} {w.weekNo === 20 ? '• (Tuần hiện tại)' : w.weekNo === 37 ? '• (Ôn thi cuối năm)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 transition-colors" />
            </div>

            <button
              onClick={() => setWeekNo(prev => Math.min(37, prev + 1))}
              disabled={weekNo >= 37}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
              title="Tuần sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setWeekNo(20)}
            className={`px-3.5 py-2 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
              weekNo === 20
                ? 'border-blue-500 bg-blue-600 text-white shadow-xs'
                : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Tuần hiện tại</span>
          </button>
        </div>

        {/* Right: Session Toggle (Buổi sáng / Buổi chiều) */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200/60 shrink-0">
          <button
            onClick={() => handleSessionChange('morning')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              session === 'morning'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Buổi sáng</span>
          </button>

          <button
            onClick={() => handleSessionChange('afternoon')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              session === 'afternoon'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Buổi chiều</span>
          </button>
        </div>
      </div>

      {/* 4. Main 2-Column Content View */}
      {viewTab === 'week' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================= LEFT COLUMN: TIMETABLE GRID & PERIOD DETAILS (8 Cols) ================= */}
          <div className="lg:col-span-8 space-y-6">
            {/* Weekly Timetable Grid Table */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  {session === 'morning' ? (
                    <Sun className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Moon className="w-4 h-4 text-indigo-500" />
                  )}
                  <span className="font-bold text-slate-800 text-xs sm:text-sm">
                    Thời khóa biểu {session === 'morning' ? 'Buổi sáng (Tiết 1 – 5)' : 'Buổi chiều (Tiết 1 – 5)'}
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-500 font-mono">
                  {session === 'morning' ? '07:00 – 11:15' : '13:30 – 17:40'}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-700 text-xs sm:text-sm">
                      <th className="py-3 px-2 w-14 font-bold text-center">Tiết</th>
                      <th className="py-3 px-2 w-28 font-bold text-center">Thời gian</th>
                      {weekdays.map(d => (
                        <th
                          key={d.no}
                          className={`py-3 px-2 min-w-[105px] font-bold text-center ${
                            d.isToday ? 'bg-blue-50/80 text-blue-900 font-black rounded-t-xl' : ''
                          }`}
                        >
                          <div>{d.label}</div>
                          <div className="text-[11px] font-medium text-slate-500 font-mono mt-0.5">{d.dateStr}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                    {currentPeriods.map(period => (
                      <tr key={period.no} className="hover:bg-slate-50/50 transition-colors">
                        {/* Period No */}
                        <td className="py-3 px-2 font-black text-slate-800 text-center">
                          {period.no}
                        </td>

                        {/* Time */}
                        <td className="py-3 px-2 font-mono text-[11px] sm:text-xs font-semibold text-slate-500 whitespace-nowrap text-center">
                          {period.time}
                        </td>

                        {/* 5 Day Cells */}
                        {weekdays.map(d => {
                          const slot = getSlot(d.no, period.no);
                          if (!slot) {
                            return (
                              <td
                                key={d.no}
                                className={`p-1.5 ${d.isToday ? 'bg-blue-50/30' : ''}`}
                              >
                                <div className="h-14 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-300 text-xs">
                                  —
                                </div>
                              </td>
                            );
                          }

                          const badgeStyle = getSubjectCellBadge(slot.subjectName);
                          const isSelected = selectedSlot?.weekday === slot.weekday && 
                                             selectedSlot?.periodNo === slot.periodNo && 
                                             (selectedSlot?.session || 'morning').toLowerCase() === (slot.session || 'morning').toLowerCase();

                          return (
                            <td
                              key={d.no}
                              className={`p-1.5 ${d.isToday ? 'bg-blue-50/30' : ''}`}
                            >
                              <div
                                onClick={() => setSelectedSlot(slot)}
                                className={`h-16 rounded-xl border p-2 flex flex-col justify-between cursor-pointer transition-all duration-150 text-left ${badgeStyle.bg} ${
                                  isSelected
                                    ? 'ring-2 ring-blue-600 shadow-md scale-[1.02]'
                                    : 'shadow-2xs hover:shadow-xs'
                                }`}
                              >
                                <div className="flex items-center gap-1.5">
                                  <BookOpen className={`w-3.5 h-3.5 shrink-0 ${badgeStyle.iconColor}`} />
                                  <span className="font-bold text-xs sm:text-sm truncate leading-tight">
                                    {slot.subjectName}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mt-1">
                                  <span className="truncate">{slot.roomName}</span>
                                  {slot.isSubstitute && (
                                    <span className="text-[9px] bg-red-100 text-red-700 px-1 rounded font-bold">
                                      Dạy thay
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Card: "Chi tiết tiết học" matching screenshot */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Chi tiết tiết học
                </h3>
              </div>

              {selectedSlot ? (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  {/* Left Subject Box */}
                  {(() => {
                    const selBadge = getSubjectCellBadge(selectedSlot.subjectName);
                    return (
                      <div className={`sm:col-span-4 border rounded-2xl p-4 flex flex-col items-center justify-center text-center ${selBadge.bg}`}>
                        <BookOpen className={`w-6 h-6 mb-1 ${selBadge.iconColor}`} />
                        <div className="text-lg sm:text-xl font-black text-slate-900">
                          {selectedSlot.subjectName}
                        </div>
                        {(() => {
                          const slotDay = weekdays.find(d => d.no === selectedSlot.weekday) || weekdays[1];
                          return (
                            <div className="text-xs font-semibold text-slate-700 mt-0.5">
                              Tiết {selectedSlot.periodNo} ({selectedSlot.session === 'afternoon' ? 'Chiều' : 'Sáng'}) – {slotDay.label}, {slotDay.dateStr}
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })()}

                  {/* Metadata right */}
                  <div className="sm:col-span-8 grid grid-cols-2 gap-4 text-xs sm:text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-slate-400 font-medium text-xs">Thời gian</div>
                        <div className="font-bold text-slate-900 font-mono mt-0.5">
                          {selectedSlot.startTime} – {selectedSlot.endTime}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-slate-400 font-medium text-xs">Giáo viên</div>
                        <div className="font-bold text-slate-900 mt-0.5 truncate">
                          {selectedSlot.substituteTeacherName || selectedSlot.teacherName}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-slate-400 font-medium text-xs">Phòng học</div>
                        <div className="font-bold text-slate-900 mt-0.5">
                          {selectedSlot.roomName}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-slate-400 font-medium text-xs">Trạng thái</div>
                        <div className="font-bold text-emerald-700 mt-0.5">
                          {selectedSlot.isSubstitute ? 'Dạy thay' : selectedSlot.note ? selectedSlot.note : 'Theo kế hoạch'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs">
                  Nhấp vào một tiết học trên thời khóa biểu để xem thông tin chi tiết.
                </div>
              )}
            </div>
          </div>

          {/* ================= RIGHT COLUMN: TODAY'S LESSONS & SCHEDULE CHANGES (4 Cols) ================= */}
          <div className="lg:col-span-4 space-y-6">
            {/* Card 1: Hôm nay / Lịch trong ngày */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-base">
                    {(() => {
                      const tuesdayDay = weekdays.find(d => d.no === 3) || weekdays[1];
                      return `${weekNo === 20 ? 'Hôm nay – ' : ''}${tuesdayDay.label}, ${tuesdayDay.fullDateStr}`;
                    })()}
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {session === 'morning' ? 'Buổi sáng' : 'Buổi chiều'}
                </span>
              </div>

              <div className="space-y-3">
                {todayLessons.length > 0 ? (
                  todayLessons.map((item) => {
                    const badgeStyle = getSubjectCellBadge(item.subjectName);
                    const isSelected = selectedSlot?.weekday === item.weekday && 
                                       selectedSlot?.periodNo === item.periodNo && 
                                       (selectedSlot?.session || 'morning').toLowerCase() === (item.session || 'morning').toLowerCase();

                    return (
                      <div
                        key={`${item.session}-${item.periodNo}`}
                        onClick={() => setSelectedSlot(item)}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-400'
                            : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100/70'
                        }`}
                      >
                        {/* Left: Period & Time */}
                        <div className="shrink-0 text-left">
                          <div className="font-black text-slate-900 text-xs sm:text-sm">
                            Tiết {item.periodNo}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500 font-medium">
                            {item.startTime} – {item.endTime}
                          </div>
                        </div>

                        {/* Right: Subject Pill */}
                        <div className={`flex-1 flex items-center gap-2.5 p-2 rounded-xl border ${badgeStyle.bg}`}>
                          <BookOpen className={`w-4 h-4 shrink-0 ${badgeStyle.iconColor}`} />
                          <div className="min-w-0">
                            <div className="font-bold text-xs sm:text-sm leading-tight truncate">
                              {item.subjectName}
                            </div>
                            <div className="text-[11px] font-medium text-slate-600 truncate mt-0.5">
                              {item.roomName} – {item.teacherName}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    Không có tiết học trong buổi này.
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Thông báo thay đổi lịch */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-base">
                    Thông báo thay đổi lịch
                  </h3>
                </div>

                <button
                  onClick={() => setViewTab('changes')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>Xem tất cả</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {currentWeekChanges.map(ch => {
                  const isSub = ch.type === 'substitute';
                  return (
                    <div
                      key={ch.id}
                      className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-slate-100/60 transition-colors space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isSub ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                            {isSub ? <ArrowLeftRight className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                          </div>
                          <span className="font-bold text-xs sm:text-sm text-slate-900">
                            {ch.title}
                          </span>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isSub ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-blue-50 text-blue-600 border border-blue-200'
                        }`}>
                          {ch.badgeText}
                        </span>
                      </div>

                      <div className="text-xs font-medium text-slate-600 pl-9">
                        {ch.description}
                      </div>

                      <div className="text-[11px] text-slate-500 pl-9">
                        {ch.detail}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW TAB 2: THEO NGÀY ================= */}
      {viewTab === 'day' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
          {/* Day Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100">
            {weekdays.map(d => (
              <button
                key={d.no}
                onClick={() => setSelectedDay(d.no)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  selectedDay === d.no
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span>{d.label}</span>
                <span className="text-[11px] opacity-80">({d.dateStr})</span>
              </button>
            ))}
          </div>

          {/* Day Lessons: Morning & Afternoon Grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Morning Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-amber-100 text-amber-800 font-bold text-sm">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Buổi sáng (07:00 – 11:15)</span>
              </div>

              <div className="space-y-3">
                {currentWeekTimetable
                  .filter(t => t.weekday === selectedDay && (t.session || 'morning').toLowerCase() === 'morning')
                  .sort((a, b) => a.periodNo - b.periodNo)
                  .map(slot => {
                    const badgeStyle = getSubjectCellBadge(slot.subjectName);
                    return (
                      <div
                        key={`m-${slot.periodNo}`}
                        className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:border-blue-200 shadow-2xs flex items-center justify-between gap-3 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 font-black text-sm flex items-center justify-center shrink-0">
                            {slot.periodNo}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-md font-bold text-xs ${badgeStyle.boxBg}`}>
                                {slot.subjectName}
                              </span>
                              <span className="font-mono text-[11px] text-slate-500 font-semibold">
                                {slot.startTime} – {slot.endTime}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              <span>GV: <strong className="text-slate-700">{slot.teacherName}</strong></span> • <span>Phòng: <strong className="text-slate-700">{slot.roomName}</strong></span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Afternoon Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-indigo-100 text-indigo-800 font-bold text-sm">
                <Moon className="w-4 h-4 text-indigo-500" />
                <span>Buổi chiều (13:30 – 17:40)</span>
              </div>

              <div className="space-y-3">
                {currentWeekTimetable
                  .filter(t => t.weekday === selectedDay && (t.session || 'morning').toLowerCase() === 'afternoon')
                  .sort((a, b) => a.periodNo - b.periodNo)
                  .map(slot => {
                    const badgeStyle = getSubjectCellBadge(slot.subjectName);
                    return (
                      <div
                        key={`a-${slot.periodNo}`}
                        className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:border-indigo-200 shadow-2xs flex items-center justify-between gap-3 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 font-black text-sm flex items-center justify-center shrink-0">
                            {slot.periodNo}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-md font-bold text-xs ${badgeStyle.boxBg}`}>
                                {slot.subjectName}
                              </span>
                              <span className="font-mono text-[11px] text-slate-500 font-semibold">
                                {slot.startTime} – {slot.endTime}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              <span>GV: <strong className="text-slate-700">{slot.teacherName}</strong></span> • <span>Phòng: <strong className="text-slate-700">{slot.roomName}</strong></span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW TAB 3: LỊCH THAY ĐỔI ================= */}
      {viewTab === 'changes' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-blue-600" />
                <span>Danh sách thay đổi &amp; Điều chỉnh thời khóa biểu</span>
              </h3>
              <p className="text-xs text-slate-500">Thông báo phân công dạy thay, đổi phòng và bù tiết được Ban Giám hiệu phê duyệt</p>
            </div>
          </div>

          <div className="space-y-4 max-w-3xl">
            {changes.map(ch => (
              <div key={ch.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/60 flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <ArrowLeftRight className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm sm:text-base text-slate-900">{ch.title}</h4>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">
                        {ch.badgeText}
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-slate-700 mt-1">
                      {ch.description}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {ch.detail}
                    </div>
                  </div>
                </div>

                <div className="text-xs font-mono font-semibold text-slate-500 shrink-0">
                  {ch.effectiveDate}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= VIEW TAB 4: LỊCH SỬ THỜI KHÓA BIỂU ================= */}
      {viewTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <History className="w-5 h-5 text-blue-600" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Lịch sử các phiên bản thời khóa biểu
            </h3>
          </div>

          <div className="divide-y divide-slate-100 text-xs sm:text-sm max-w-3xl">
            <div className="py-3.5 flex items-center justify-between">
              <div>
                <strong className="text-slate-900 block text-sm">Thời khóa biểu chính thức Học kỳ I (Áp dụng từ 13/01/2025)</strong>
                <span className="text-slate-500 text-xs">Phiên bản 2.1 • Cập nhật bổ sung ca chiều &amp; phòng thực hành</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                Đang áp dụng
              </span>
            </div>

            <div className="py-3.5 flex items-center justify-between">
              <div>
                <strong className="text-slate-900 block text-sm">Thời khóa biểu Học kỳ I (Áp dụng từ 05/09/2024 đến 10/01/2025)</strong>
                <span className="text-slate-500 text-xs">Phiên bản 1.0 • Ban hành đầu năm học</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-xs">
                Hết hiệu lực
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: IN / XUẤT THỜI KHÓA BIỂU ================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <div className="flex items-center gap-3">
                <Printer className="w-5 h-5 text-blue-600" />
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Thời khóa biểu chính thức lớp 11A1 (Bản in)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {/* Print Session Filter */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-semibold mr-2">
                  <button
                    onClick={() => setPrintSession('all')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      printSession === 'all' ? 'bg-white shadow-xs text-blue-600 font-bold' : 'text-slate-600'
                    }`}
                  >
                    Cả ngày
                  </button>
                  <button
                    onClick={() => setPrintSession('morning')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      printSession === 'morning' ? 'bg-white shadow-xs text-blue-600 font-bold' : 'text-slate-600'
                    }`}
                  >
                    Buổi sáng
                  </button>
                  <button
                    onClick={() => setPrintSession('afternoon')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      printSession === 'afternoon' ? 'bg-white shadow-xs text-blue-600 font-bold' : 'text-slate-600'
                    }`}
                  >
                    Buổi chiều
                  </button>
                </div>

                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>In ngay</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Sheet */}
            <div className="p-4 border border-slate-200 rounded-2xl bg-white space-y-4 font-serif text-xs">
              <div className="text-center space-y-1 pb-3 border-b border-slate-200">
                <div className="font-bold text-slate-600 uppercase text-[11px]">SỞ GIÁO DỤC VÀ ĐÀO TẠO HÀ NỘI</div>
                <div className="font-black text-slate-900 uppercase text-sm">TRƯỜNG THPT NGUYỄN TRÃI</div>
                <h2 className="text-base font-black uppercase text-slate-900 pt-2">THỜI KHÓA BIỂU HỌC SINH</h2>
                <div className="text-slate-600 text-xs">
                  Lớp: 11A1 • GVCN: Cô Phạm Minh Thư • Áp dụng: Tuần {weekNo} ({weekDates.rangeStr}) • {printSession === 'all' ? 'Cả ngày (Sáng + Chiều)' : printSession === 'morning' ? 'Ca Sáng' : 'Ca Chiều'}
                </div>
              </div>

              {/* Morning Print Section */}
              {(printSession === 'all' || printSession === 'morning') && (
                <div className="space-y-1">
                  <div className="font-bold uppercase text-[11px] text-slate-700">I. Buổi sáng (07:00 – 11:15)</div>
                  <table className="w-full text-center border border-slate-300 text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 font-bold">
                        <th className="p-1.5 border-r border-slate-300 w-12">Tiết</th>
                        <th className="p-1.5 border-r border-slate-300 w-24">Thời gian</th>
                        <th className="p-1.5 border-r border-slate-300">Thứ Hai</th>
                        <th className="p-1.5 border-r border-slate-300">Thứ Ba</th>
                        <th className="p-1.5 border-r border-slate-300">Thứ Tư</th>
                        <th className="p-1.5 border-r border-slate-300">Thứ Năm</th>
                        <th className="p-1.5">Thứ Sáu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {morningPeriods.map(p => (
                        <tr key={`print-m-${p.no}`}>
                          <td className="p-1.5 border-r border-slate-200 font-bold">{p.no}</td>
                          <td className="p-1.5 border-r border-slate-200 font-mono text-[10px]">{p.time}</td>
                          {weekdays.map(d => {
                            const s = getSlot(d.no, p.no, 'morning');
                            return (
                              <td key={`print-m-${d.no}-${p.no}`} className="p-1.5 border-r border-slate-200 font-medium">
                                {s ? `${s.subjectName} (${s.roomName})` : '—'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Afternoon Print Section */}
              {(printSession === 'all' || printSession === 'afternoon') && (
                <div className="space-y-1 pt-2">
                  <div className="font-bold uppercase text-[11px] text-slate-700">II. Buổi chiều (13:30 – 17:40)</div>
                  <table className="w-full text-center border border-slate-300 text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 font-bold">
                        <th className="p-1.5 border-r border-slate-300 w-12">Tiết</th>
                        <th className="p-1.5 border-r border-slate-300 w-24">Thời gian</th>
                        <th className="p-1.5 border-r border-slate-300">Thứ Hai</th>
                        <th className="p-1.5 border-r border-slate-300">Thứ Ba</th>
                        <th className="p-1.5 border-r border-slate-300">Thứ Tư</th>
                        <th className="p-1.5 border-r border-slate-300">Thứ Năm</th>
                        <th className="p-1.5">Thứ Sáu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {afternoonPeriods.map(p => (
                        <tr key={`print-a-${p.no}`}>
                          <td className="p-1.5 border-r border-slate-200 font-bold">{p.no}</td>
                          <td className="p-1.5 border-r border-slate-200 font-mono text-[10px]">{p.time}</td>
                          {weekdays.map(d => {
                            const s = getSlot(d.no, p.no, 'afternoon');
                            return (
                              <td key={`print-a-${d.no}-${p.no}`} className="p-1.5 border-r border-slate-200 font-medium">
                                {s ? `${s.subjectName} (${s.roomName})` : '—'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="pt-4 flex justify-between text-center text-xs">
                <div>
                  <div className="font-bold">GIÁO VIÊN CHỦ NHIỆM</div>
                  <div className="h-10 flex items-end justify-center font-bold">Cô Phạm Minh Thư</div>
                </div>
                <div>
                  <div className="font-bold">BAN GIÁM HIỆU PHÊ DUYỆT</div>
                  <div className="h-10 flex items-end justify-center font-bold">HIỆU TRƯỞNG</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
