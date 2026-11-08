import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  BookOpen,
  BarChart2,
  ChevronRight,
  ChevronDown,
  Layers,
  ShieldCheck,
  Download,
  X,
  BookMarked,
  Calculator,
  Globe,
  FlaskConical,
  Compass,
  Atom,
  Dna,
  Laptop,
  Activity,
  Info
} from 'lucide-react';
import { studentApi } from '../services/studentApi';
import { ExamItem, ExamScheduleSummary } from '../types/student.types';

// Subject color styling and icon mapping
const SUBJECT_CONFIG: Record<
  string,
  {
    pillClass: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
  }
> = {
  'Ngữ văn': {
    pillClass: 'bg-purple-100/80 text-purple-700 border-purple-200/60',
    icon: BookMarked,
    accentColor: '#9333ea'
  },
  'Toán': {
    pillClass: 'bg-rose-100/80 text-rose-700 border-rose-200/60',
    icon: Calculator,
    accentColor: '#e11d48'
  },
  'Tiếng Anh': {
    pillClass: 'bg-sky-100/80 text-sky-700 border-sky-200/60',
    icon: Globe,
    accentColor: '#0284c7'
  },
  'Hóa học': {
    pillClass: 'bg-violet-100/80 text-violet-700 border-violet-200/60',
    icon: FlaskConical,
    accentColor: '#7c3aed'
  },
  'Lịch sử': {
    pillClass: 'bg-amber-100/80 text-amber-800 border-amber-200/60',
    icon: BookOpen,
    accentColor: '#d97706'
  },
  'Địa lý': {
    pillClass: 'bg-yellow-100/80 text-yellow-800 border-yellow-200/60',
    icon: Compass,
    accentColor: '#ca8a04'
  },
  'Vật lý': {
    pillClass: 'bg-blue-100/80 text-blue-700 border-blue-200/60',
    icon: Atom,
    accentColor: '#2563eb'
  },
  'Sinh học': {
    pillClass: 'bg-emerald-100/80 text-emerald-700 border-emerald-200/60',
    icon: Dna,
    accentColor: '#059669'
  },
  'Tin học': {
    pillClass: 'bg-teal-100/80 text-teal-700 border-teal-200/60',
    icon: Laptop,
    accentColor: '#0d9488'
  },
  'GDTC': {
    pillClass: 'bg-fuchsia-100/80 text-fuchsia-700 border-fuchsia-200/60',
    icon: Activity,
    accentColor: '#c026d3'
  }
};

// Client-side fallback datasets per academic year and semester
function getExamScheduleDataset(year: string, sem: string, periodFilter: string): ExamScheduleSummary {
  const isGrade10 = year.includes('2024') || year.includes('10');
  const isGrade12 = year.includes('2026') || year.includes('12');
  const isSem2 = sem.includes('II');

  const normalizedYear = isGrade10 ? '2024 – 2025' : isGrade12 ? '2026 – 2027' : '2025 – 2026';
  const normalizedSemester = isSem2 ? 'Học kỳ II' : 'Học kỳ I';

  let exams: ExamItem[] = [];

  if (isGrade10) {
    // Năm học 2024 – 2025 (Lớp 10) - Đã hoàn thành toàn bộ
    exams = [
      {
        id: 'g10-01', stt: 1, subjectName: 'Ngữ văn', subjectCode: 'VAN10', examType: isSem2 ? 'Cuối kỳ' : 'Giữa kỳ',
        examDateFormatted: isSem2 ? 'Thứ Năm, 15/05/2025' : 'Thứ Năm, 24/10/2024', durationFormatted: '90 phút', startsAt: '2024-10-24T07:30:00', endsAt: '2024-10-24T09:00:00',
        roomName: 'A102', durationMinutes: 90, examFormat: 'Tự luận 100%', status: 'completed', statusTextVi: 'Đã hoàn thành',
        invigilator: 'Cô Lê Thị Mai (GVCN)', allowedMaterials: 'Không sử dụng tài liệu', semester: normalizedSemester, academicYear: normalizedYear
      },
      {
        id: 'g10-02', stt: 2, subjectName: 'Toán', subjectCode: 'TOAN10', examType: isSem2 ? 'Cuối kỳ' : 'Giữa kỳ',
        examDateFormatted: isSem2 ? 'Thứ Sáu, 16/05/2025' : 'Thứ Sáu, 25/10/2024', durationFormatted: '90 phút', startsAt: '2024-10-25T07:30:00', endsAt: '2024-10-25T09:00:00',
        roomName: 'A102', durationMinutes: 90, examFormat: 'Trắc nghiệm 70% & Tự luận 30%', status: 'completed', statusTextVi: 'Đã hoàn thành',
        invigilator: 'Thầy Trần Quốc Huy', allowedMaterials: 'Máy tính Casio fx-580VNX', semester: normalizedSemester, academicYear: normalizedYear
      },
      {
        id: 'g10-03', stt: 3, subjectName: 'Tiếng Anh', subjectCode: 'ANH10', examType: isSem2 ? 'Cuối kỳ' : 'Giữa kỳ',
        examDateFormatted: isSem2 ? 'Thứ Hai, 19/05/2025' : 'Thứ Hai, 28/10/2024', durationFormatted: '60 phút', startsAt: '2024-10-28T07:30:00', endsAt: '2024-10-28T08:30:00',
        roomName: 'A102', durationMinutes: 60, examFormat: 'Trắc nghiệm & Nghe hiểu', status: 'completed', statusTextVi: 'Đã hoàn thành',
        invigilator: 'Cô Phạm Minh Thư', allowedMaterials: 'Không sử dụng từ điển', semester: normalizedSemester, academicYear: normalizedYear
      },
      {
        id: 'g10-04', stt: 4, subjectName: 'Hóa học', subjectCode: 'HOA10', examType: isSem2 ? 'Cuối kỳ' : 'Giữa kỳ',
        examDateFormatted: isSem2 ? 'Thứ Ba, 20/05/2025' : 'Thứ Ba, 29/10/2024', durationFormatted: '60 phút', startsAt: '2024-10-29T07:30:00', endsAt: '2024-10-29T08:30:00',
        roomName: 'B102', durationMinutes: 60, examFormat: 'Trắc nghiệm 40 câu', status: 'completed', statusTextVi: 'Đã hoàn thành',
        invigilator: 'Thầy Đỗ Quốc Tuấn', allowedMaterials: 'Bảng tuần hoàn, máy tính bỏ túi', semester: normalizedSemester, academicYear: normalizedYear
      },
      {
        id: 'g10-05', stt: 5, subjectName: 'Lịch sử', subjectCode: 'SU10', examType: isSem2 ? 'Cuối kỳ' : 'Cuối kỳ',
        examDateFormatted: isSem2 ? 'Thứ Tư, 21/05/2025' : 'Thứ Hai, 18/11/2024', durationFormatted: '45 phút', startsAt: '2024-11-18T07:30:00', endsAt: '2024-11-18T08:15:00',
        roomName: 'A102', durationMinutes: 45, examFormat: 'Trắc nghiệm 40 câu', status: 'completed', statusTextVi: 'Đã hoàn thành',
        invigilator: 'Cô Trần Thúy Ngân', allowedMaterials: 'Không sử dụng tài liệu', semester: normalizedSemester, academicYear: normalizedYear
      },
      {
        id: 'g10-06', stt: 6, subjectName: 'Địa lý', subjectCode: 'DIA10', examType: isSem2 ? 'Cuối kỳ' : 'Cuối kỳ',
        examDateFormatted: isSem2 ? 'Thứ Năm, 22/05/2025' : 'Thứ Ba, 19/11/2024', durationFormatted: '45 phút', startsAt: '2024-11-19T07:30:00', endsAt: '2024-11-19T08:15:00',
        roomName: 'A102', durationMinutes: 45, examFormat: 'Trắc nghiệm & Atlat', status: 'completed', statusTextVi: 'Đã hoàn thành',
        invigilator: 'Thầy Bùi Quang Hưng', allowedMaterials: 'Atlat Địa lý Việt Nam', semester: normalizedSemester, academicYear: normalizedYear
      },
      {
        id: 'g10-07', stt: 7, subjectName: 'Vật lý', subjectCode: 'LY10', examType: isSem2 ? 'Cuối kỳ' : 'Cuối kỳ',
        examDateFormatted: isSem2 ? 'Thứ Sáu, 23/05/2025' : 'Thứ Tư, 20/11/2024', durationFormatted: '60 phút', startsAt: '2024-11-20T07:30:00', endsAt: '2024-11-20T08:30:00',
        roomName: 'B102', durationMinutes: 60, examFormat: 'Trắc nghiệm 40 câu', status: 'completed', statusTextVi: 'Đã hoàn thành',
        invigilator: 'Thầy Lê Viết Nam', allowedMaterials: 'Máy tính cầm tay', semester: normalizedSemester, academicYear: normalizedYear
      },
      {
        id: 'g10-08', stt: 8, subjectName: 'Sinh học', subjectCode: 'SINH10', examType: isSem2 ? 'Cuối kỳ' : 'Cuối kỳ',
        examDateFormatted: isSem2 ? 'Thứ Hai, 26/05/2025' : 'Thứ Năm, 21/11/2024', durationFormatted: '60 phút', startsAt: '2024-11-21T07:30:00', endsAt: '2024-11-21T08:30:00',
        roomName: 'B102', durationMinutes: 60, examFormat: 'Trắc nghiệm', status: 'completed', statusTextVi: 'Đã hoàn thành',
        invigilator: 'Cô Nguyễn Mai Trang', allowedMaterials: 'Bút viết, máy tính', semester: normalizedSemester, academicYear: normalizedYear
      },
      {
        id: 'g10-09', stt: 9, subjectName: 'Tin học', subjectCode: 'TIN10', examType: isSem2 ? 'Cuối kỳ' : 'Cuối kỳ',
        examDateFormatted: isSem2 ? 'Thứ Ba, 27/05/2025' : 'Thứ Sáu, 22/11/2024', durationFormatted: '45 phút', startsAt: '2024-11-22T07:30:00', endsAt: '2024-11-22T08:15:00',
        roomName: 'B201', durationMinutes: 45, examFormat: 'Thực hành trên máy tính', status: 'completed', statusTextVi: 'Đã hoàn thành',
        invigilator: 'Thầy Phan Hoàng Anh', allowedMaterials: 'Không mang USB', semester: normalizedSemester, academicYear: normalizedYear
      },
      {
        id: 'g10-10', stt: 10, subjectName: 'GDTC', subjectCode: 'GDTC10', examType: 'Đánh giá',
        examDateFormatted: isSem2 ? 'Trong tuần 28/05 – 02/06' : 'Trong tuần 25/11 – 29/11', durationFormatted: 'Thực hành', startsAt: '2024-11-25T07:00:00', endsAt: '2024-11-29T11:00:00',
        roomName: 'Sân trường', durationMinutes: 45, examFormat: 'Thực hành thể lực', status: 'completed', statusTextVi: 'Đã hoàn thành',
        invigilator: 'Thầy Đặng Hữu Phong', allowedMaterials: 'Trang phục thể dục', semester: normalizedSemester, academicYear: normalizedYear
      }
    ];
  } else if (isGrade12) {
    // Năm học 2026 – 2027 (Lớp 12) - Lớp cuối cấp & Thi Tốt nghiệp THPT
    exams = [
      {
        id: 'g12-01', stt: 1, subjectName: 'Toán', subjectCode: 'TOAN12', examType: isSem2 ? 'Thi thử TN' : 'Giữa kỳ',
        examDateFormatted: isSem2 ? 'Thứ Năm, 18/03/2027' : 'Thứ Năm, 22/10/2026', durationFormatted: '90 phút', startsAt: '2026-10-22T07:30:00', endsAt: '2026-10-22T09:00:00',
        roomName: 'A301', durationMinutes: 90, examFormat: 'Trắc nghiệm chuẩn Bộ GD&ĐT', status: 'upcoming', statusTextVi: 'Sắp diễn ra',
        invigilator: 'Thầy Trần Quốc Huy', allowedMaterials: 'Máy tính Casio fx-580VNX trở lên', semester: normalizedSemester, academicYear: normalizedYear
      },
      {
        id: 'g12-02', stt: 2, subjectName: 'Ngữ văn', subjectCode: 'VAN12', examType: isSem2 ? 'Thi thử TN' : 'Giữa kỳ',
        examDateFormatted: isSem2 ? 'Thứ Sáu, 19/03/2027' : 'Thứ Sáu, 23/10/2026', durationFormatted: '120 phút', startsAt: '2026-10-23T07:30:00', endsAt: '2026-10-23T09:30:00',
        roomName: 'A301', durationMinutes: 120, examFormat: 'Tự luận (Nghị luận xã hội & văn học)', status: 'upcoming', statusTextVi: 'Sắp diễn ra',
        invigilator: 'Cô Lê Thị Mai', allowedMaterials: 'Không sử dụng tài liệu', semester: normalizedSemester, academicYear: normalizedYear
      },
      {
        id: 'g12-03', stt: 3, subjectName: 'Tiếng Anh', subjectCode: 'ANH12', examType: isSem2 ? 'Thi thử TN' : 'Giữa kỳ',
        examDateFormatted: isSem2 ? 'Thứ Hai, 22/03/2027' : 'Thứ Hai, 26/10/2026', durationFormatted: '60 phút', startsAt: '2026-10-26T07:30:00', endsAt: '2026-10-26T08:30:00',
        roomName: 'A301', durationMinutes: 60, examFormat: 'Trắc nghiệm 50 câu', status: 'upcoming', statusTextVi: 'Sắp diễn ra',
        invigilator: 'Cô Phạm Minh Thư', allowedMaterials: 'Không sử dụng từ điển', semester: normalizedSemester, academicYear: normalizedYear
      },
      {
        id: 'g12-04', stt: 4, subjectName: 'Vật lý', subjectCode: 'LY12', examType: isSem2 ? 'Cuối kỳ' : 'Giữa kỳ',
        examDateFormatted: isSem2 ? 'Thứ Ba, 23/03/2027' : 'Thứ Ba, 27/10/2026', durationFormatted: '50 phút', startsAt: '2026-10-27T07:30:00', endsAt: '2026-10-27T08:20:00',
        roomName: 'B302', durationMinutes: 50, examFormat: 'Trắc nghiệm 40 câu', status: 'pending', statusTextVi: 'Chưa diễn ra',
        invigilator: 'Thầy Lê Viết Nam', allowedMaterials: 'Máy tính cầm tay', semester: normalizedSemester, academicYear: normalizedYear
      },
      {
        id: 'g12-05', stt: 5, subjectName: 'Hóa học', subjectCode: 'HOA12', examType: isSem2 ? 'Cuối kỳ' : 'Giữa kỳ',
        examDateFormatted: isSem2 ? 'Thứ Tư, 24/03/2027' : 'Thứ Tư, 28/10/2026', durationFormatted: '50 phút', startsAt: '2026-10-28T07:30:00', endsAt: '2026-10-28T08:20:00',
        roomName: 'B302', durationMinutes: 50, examFormat: 'Trắc nghiệm 40 câu', status: 'pending', statusTextVi: 'Chưa diễn ra',
        invigilator: 'Thầy Đỗ Quốc Tuấn', allowedMaterials: 'Bảng tuần hoàn, máy tính', semester: normalizedSemester, academicYear: normalizedYear
      },
      {
        id: 'g12-06', stt: 6, subjectName: 'Sinh học', subjectCode: 'SINH12', examType: isSem2 ? 'Cuối kỳ' : 'Cuối kỳ',
        examDateFormatted: isSem2 ? 'Thứ Năm, 13/05/2027' : 'Thứ Hai, 16/11/2026', durationFormatted: '50 phút', startsAt: '2026-11-16T07:30:00', endsAt: '2026-11-16T08:20:00',
        roomName: 'B302', durationMinutes: 50, examFormat: 'Trắc nghiệm 40 câu', status: 'pending', statusTextVi: 'Chưa diễn ra',
        invigilator: 'Cô Nguyễn Mai Trang', allowedMaterials: 'Bút viết, máy tính', semester: normalizedSemester, academicYear: normalizedYear
      },
      {
        id: 'g12-07', stt: 7, subjectName: 'Lịch sử', subjectCode: 'SU12', examType: isSem2 ? 'Cuối kỳ' : 'Cuối kỳ',
        examDateFormatted: isSem2 ? 'Thứ Sáu, 14/05/2027' : 'Thứ Ba, 17/11/2026', durationFormatted: '50 phút', startsAt: '2026-11-17T07:30:00', endsAt: '2026-11-17T08:20:00',
        roomName: 'A301', durationMinutes: 50, examFormat: 'Trắc nghiệm 40 câu', status: 'pending', statusTextVi: 'Chưa diễn ra',
        invigilator: 'Cô Trần Thúy Ngân', allowedMaterials: 'Không sử dụng tài liệu', semester: normalizedSemester, academicYear: normalizedYear
      },
      {
        id: 'g12-08', stt: 8, subjectName: 'Địa lý', subjectCode: 'DIA12', examType: isSem2 ? 'Cuối kỳ' : 'Cuối kỳ',
        examDateFormatted: isSem2 ? 'Thứ Hai, 17/05/2027' : 'Thứ Tư, 18/11/2026', durationFormatted: '50 phút', startsAt: '2026-11-18T07:30:00', endsAt: '2026-11-18T08:20:00',
        roomName: 'A301', durationMinutes: 50, examFormat: 'Trắc nghiệm & Atlat', status: 'pending', statusTextVi: 'Chưa diễn ra',
        invigilator: 'Thầy Bùi Quang Hưng', allowedMaterials: 'Atlat Địa lý Việt Nam', semester: normalizedSemester, academicYear: normalizedYear
      },
      {
        id: 'g12-09', stt: 9, subjectName: 'Tin học', subjectCode: 'TIN12', examType: isSem2 ? 'Cuối kỳ' : 'Cuối kỳ',
        examDateFormatted: isSem2 ? 'Thứ Ba, 18/05/2027' : 'Thứ Năm, 19/11/2026', durationFormatted: '45 phút', startsAt: '2026-11-19T07:30:00', endsAt: '2026-11-19T08:15:00',
        roomName: 'B201', durationMinutes: 45, examFormat: 'Thực hành trên máy tính', status: 'pending', statusTextVi: 'Chưa diễn ra',
        invigilator: 'Thầy Phan Hoàng Anh', allowedMaterials: 'Không mang USB', semester: normalizedSemester, academicYear: normalizedYear
      },
      {
        id: 'g12-10', stt: 10, subjectName: 'GDTC', subjectCode: 'GDTC12', examType: 'Đánh giá',
        examDateFormatted: isSem2 ? 'Trong tuần 20/05 – 25/05' : 'Trong tuần 23/11 – 27/11', durationFormatted: 'Thực hành', startsAt: '2026-11-23T07:00:00', endsAt: '2026-11-27T11:00:00',
        roomName: 'Sân trường', durationMinutes: 45, examFormat: 'Kiểm tra thể lực tốt nghiệp', status: 'pending', statusTextVi: 'Chưa diễn ra',
        invigilator: 'Thầy Đặng Hữu Phong', allowedMaterials: 'Trang phục thể thao', semester: normalizedSemester, academicYear: normalizedYear
      }
    ];
  } else {
    // Năm học 2025 – 2026 (Lớp 11) - Năm học hiện tại
    if (isSem2) {
      exams = [
        {
          id: 'g11-s2-01', stt: 1, subjectName: 'Ngữ văn', subjectCode: 'VAN11', examType: 'Giữa kỳ',
          examDateFormatted: 'Thứ Năm, 12/03/2026', durationFormatted: '90 phút', startsAt: '2026-03-12T07:30:00', endsAt: '2026-03-12T09:00:00',
          roomName: 'A203', durationMinutes: 90, examFormat: 'Tự luận 100%', status: 'upcoming', statusTextVi: 'Sắp diễn ra',
          invigilator: 'Cô Phạm Minh Thư (GVCN)', allowedMaterials: 'Không sử dụng tài liệu', semester: normalizedSemester, academicYear: normalizedYear
        },
        {
          id: 'g11-s2-02', stt: 2, subjectName: 'Toán', subjectCode: 'TOAN11', examType: 'Giữa kỳ',
          examDateFormatted: 'Thứ Sáu, 13/03/2026', durationFormatted: '90 phút', startsAt: '2026-03-13T07:30:00', endsAt: '2026-03-13T09:00:00',
          roomName: 'A203', durationMinutes: 90, examFormat: 'Trắc nghiệm 70% & Tự luận 30%', status: 'upcoming', statusTextVi: 'Sắp diễn ra',
          invigilator: 'Thầy Nguyễn Văn Thành', allowedMaterials: 'Máy tính Casio fx-580VNX', semester: normalizedSemester, academicYear: normalizedYear
        },
        {
          id: 'g11-s2-03', stt: 3, subjectName: 'Tiếng Anh', subjectCode: 'ANH11', examType: 'Giữa kỳ',
          examDateFormatted: 'Thứ Hai, 16/03/2026', durationFormatted: '60 phút', startsAt: '2026-03-16T07:30:00', endsAt: '2026-03-16T08:30:00',
          roomName: 'A203', durationMinutes: 60, examFormat: 'Trắc nghiệm & Nghe hiểu', status: 'upcoming', statusTextVi: 'Sắp diễn ra',
          invigilator: 'Cô Hoàng Thu Hà', allowedMaterials: 'Không sử dụng tài liệu', semester: normalizedSemester, academicYear: normalizedYear
        },
        {
          id: 'g11-s2-04', stt: 4, subjectName: 'Hóa học', subjectCode: 'HOA11', examType: 'Giữa kỳ',
          examDateFormatted: 'Thứ Ba, 17/03/2026', durationFormatted: '60 phút', startsAt: '2026-03-17T07:30:00', endsAt: '2026-03-17T08:30:00',
          roomName: 'B101', durationMinutes: 60, examFormat: 'Trắc nghiệm 40 câu', status: 'upcoming', statusTextVi: 'Sắp diễn ra',
          invigilator: 'Thầy Đỗ Quốc Tuấn', allowedMaterials: 'Bảng tuần hoàn, máy tính', semester: normalizedSemester, academicYear: normalizedYear
        },
        {
          id: 'g11-s2-05', stt: 5, subjectName: 'Lịch sử', subjectCode: 'SU11', examType: 'Cuối kỳ',
          examDateFormatted: 'Thứ Hai, 11/05/2026', durationFormatted: '45 phút', startsAt: '2026-05-11T07:30:00', endsAt: '2026-05-11T08:15:00',
          roomName: 'A203', durationMinutes: 45, examFormat: 'Trắc nghiệm 40 câu', status: 'pending', statusTextVi: 'Chưa diễn ra',
          invigilator: 'Cô Trần Thúy Ngân', allowedMaterials: 'Không sử dụng tài liệu', semester: normalizedSemester, academicYear: normalizedYear
        },
        {
          id: 'g11-s2-06', stt: 6, subjectName: 'Địa lý', subjectCode: 'DIA11', examType: 'Cuối kỳ',
          examDateFormatted: 'Thứ Ba, 12/05/2026', durationFormatted: '45 phút', startsAt: '2026-05-12T07:30:00', endsAt: '2026-05-12T08:15:00',
          roomName: 'A203', durationMinutes: 45, examFormat: 'Trắc nghiệm & Atlat', status: 'pending', statusTextVi: 'Chưa diễn ra',
          invigilator: 'Thầy Bùi Quang Hưng', allowedMaterials: 'Atlat Địa lý Việt Nam', semester: normalizedSemester, academicYear: normalizedYear
        },
        {
          id: 'g11-s2-07', stt: 7, subjectName: 'Vật lý', subjectCode: 'LY11', examType: 'Cuối kỳ',
          examDateFormatted: 'Thứ Tư, 13/05/2026', durationFormatted: '60 phút', startsAt: '2026-05-13T07:30:00', endsAt: '2026-05-13T08:30:00',
          roomName: 'B101', durationMinutes: 60, examFormat: 'Trắc nghiệm 40 câu', status: 'pending', statusTextVi: 'Chưa diễn ra',
          invigilator: 'Thầy Lê Viết Nam', allowedMaterials: 'Máy tính cầm tay', semester: normalizedSemester, academicYear: normalizedYear
        },
        {
          id: 'g11-s2-08', stt: 8, subjectName: 'Sinh học', subjectCode: 'SINH11', examType: 'Cuối kỳ',
          examDateFormatted: 'Thứ Năm, 14/05/2026', durationFormatted: '60 phút', startsAt: '2026-05-14T07:30:00', endsAt: '2026-05-14T08:30:00',
          roomName: 'B101', durationMinutes: 60, examFormat: 'Trắc nghiệm', status: 'pending', statusTextVi: 'Chưa diễn ra',
          invigilator: 'Cô Nguyễn Mai Trang', allowedMaterials: 'Bút viết, máy tính', semester: normalizedSemester, academicYear: normalizedYear
        },
        {
          id: 'g11-s2-09', stt: 9, subjectName: 'Tin học', subjectCode: 'TIN11', examType: 'Cuối kỳ',
          examDateFormatted: 'Thứ Sáu, 15/05/2026', durationFormatted: '45 phút', startsAt: '2026-05-15T07:30:00', endsAt: '2026-05-15T08:15:00',
          roomName: 'B201', durationMinutes: 45, examFormat: 'Thực hành trên máy tính', status: 'pending', statusTextVi: 'Chưa diễn ra',
          invigilator: 'Thầy Phan Hoàng Anh', allowedMaterials: 'Không mang USB', semester: normalizedSemester, academicYear: normalizedYear
        },
        {
          id: 'g11-s2-10', stt: 10, subjectName: 'GDTC', subjectCode: 'GDTC11', examType: 'Đánh giá',
          examDateFormatted: 'Trong tuần 18/05 – 23/05', durationFormatted: 'Thực hành', startsAt: '2026-05-18T07:00:00', endsAt: '2026-05-23T11:00:00',
          roomName: 'Sân trường', durationMinutes: 45, examFormat: 'Kiểm tra thể lực', status: 'pending', statusTextVi: 'Chưa diễn ra',
          invigilator: 'Thầy Đặng Hữu Phong', allowedMaterials: 'Trang phục thể thao', semester: normalizedSemester, academicYear: normalizedYear
        }
      ];
    } else {
      // Học kỳ I (Lớp 11) - Khớp 100% ảnh mockup media_1794147648789_49692475.jpg
      exams = [
        {
          id: 'ex-01', stt: 1, subjectName: 'Ngữ văn', subjectCode: 'VAN11', examTitle: 'Kiểm tra giữa kỳ I môn Ngữ văn', examType: 'Giữa kỳ',
          examDateFormatted: 'Thứ Năm, 23/10/2025', durationFormatted: '90 phút', startsAt: '2025-10-23T07:30:00', endsAt: '2025-10-23T09:00:00',
          roomName: 'A203', durationMinutes: 90, examFormat: 'Tự luận (Nghị luận văn học & xã hội)', status: 'completed', statusTextVi: 'Đã hoàn thành',
          semester: normalizedSemester, academicYear: normalizedYear, invigilator: 'Cô Phạm Minh Thư (GVCN)', allowedMaterials: 'Không sử dụng tài liệu'
        },
        {
          id: 'ex-02', stt: 2, subjectName: 'Toán', subjectCode: 'TOAN11', examTitle: 'Kiểm tra giữa kỳ I môn Toán', examType: 'Giữa kỳ',
          examDateFormatted: 'Thứ Sáu, 24/10/2025', durationFormatted: '90 phút', startsAt: '2025-10-24T07:30:00', endsAt: '2025-10-24T09:00:00',
          roomName: 'A203', durationMinutes: 90, examFormat: 'Trắc nghiệm 70% & Tự luận 30%', status: 'completed', statusTextVi: 'Đã hoàn thành',
          semester: normalizedSemester, academicYear: normalizedYear, invigilator: 'Thầy Nguyễn Văn Thành', allowedMaterials: 'Máy tính Casio fx-580VNX'
        },
        {
          id: 'ex-03', stt: 3, subjectName: 'Tiếng Anh', subjectCode: 'ANH11', examTitle: 'Kiểm tra giữa kỳ I môn Tiếng Anh', examType: 'Giữa kỳ',
          examDateFormatted: 'Thứ Hai, 27/10/2025', durationFormatted: '60 phút', startsAt: '2025-10-27T07:30:00', endsAt: '2025-10-27T08:30:00',
          roomName: 'A203', durationMinutes: 60, examFormat: 'Trắc nghiệm & Nghe hiểu Audio', status: 'completed', statusTextVi: 'Đã hoàn thành',
          semester: normalizedSemester, academicYear: normalizedYear, invigilator: 'Cô Hoàng Thu Hà', allowedMaterials: 'Không sử dụng từ điển'
        },
        {
          id: 'ex-04', stt: 4, subjectName: 'Hóa học', subjectCode: 'HOA11', examTitle: 'Kiểm tra giữa kỳ I môn Hóa học', examType: 'Giữa kỳ',
          examDateFormatted: 'Thứ Ba, 28/10/2025', durationFormatted: '60 phút', startsAt: '2025-10-28T07:30:00', endsAt: '2025-10-28T08:30:00',
          roomName: 'B101', durationMinutes: 60, examFormat: 'Trắc nghiệm 40 câu', status: 'completed', statusTextVi: 'Đã hoàn thành',
          semester: normalizedSemester, academicYear: normalizedYear, invigilator: 'Thầy Đỗ Quốc Tuấn', allowedMaterials: 'Bảng tuần hoàn, máy tính'
        },
        {
          id: 'ex-05', stt: 5, subjectName: 'Lịch sử', subjectCode: 'SU11', examTitle: 'Kiểm tra cuối kỳ I môn Lịch sử', examType: 'Cuối kỳ',
          examDateFormatted: 'Thứ Hai, 17/11/2025', durationFormatted: '45 phút', startsAt: '2025-11-17T07:30:00', endsAt: '2025-11-17T08:15:00',
          roomName: 'A203', durationMinutes: 45, examFormat: 'Trắc nghiệm 100% (40 câu)', status: 'upcoming', statusTextVi: 'Sắp diễn ra',
          semester: normalizedSemester, academicYear: normalizedYear, invigilator: 'Cô Trần Thúy Ngân', allowedMaterials: 'Không sử dụng tài liệu'
        },
        {
          id: 'ex-06', stt: 6, subjectName: 'Địa lý', subjectCode: 'DIA11', examTitle: 'Kiểm tra cuối kỳ I môn Địa lý', examType: 'Cuối kỳ',
          examDateFormatted: 'Thứ Ba, 18/11/2025', durationFormatted: '45 phút', startsAt: '2025-11-18T07:30:00', endsAt: '2025-11-18T08:15:00',
          roomName: 'A203', durationMinutes: 45, examFormat: 'Trắc nghiệm & Atlat', status: 'upcoming', statusTextVi: 'Sắp diễn ra',
          semester: normalizedSemester, academicYear: normalizedYear, invigilator: 'Thầy Bùi Quang Hưng', allowedMaterials: 'Atlat Địa lý Việt Nam'
        },
        {
          id: 'ex-07', stt: 7, subjectName: 'Vật lý', subjectCode: 'LY11', examTitle: 'Kiểm tra cuối kỳ I môn Vật lý', examType: 'Cuối kỳ',
          examDateFormatted: 'Thứ Tư, 19/11/2025', durationFormatted: '60 phút', startsAt: '2025-11-19T07:30:00', endsAt: '2025-11-19T08:30:00',
          roomName: 'B101', durationMinutes: 60, examFormat: 'Trắc nghiệm 40 câu', status: 'upcoming', statusTextVi: 'Sắp diễn ra',
          semester: normalizedSemester, academicYear: normalizedYear, invigilator: 'Thầy Lê Viết Nam', allowedMaterials: 'Máy tính cầm tay'
        },
        {
          id: 'ex-08', stt: 8, subjectName: 'Sinh học', subjectCode: 'SINH11', examTitle: 'Kiểm tra cuối kỳ I môn Sinh học', examType: 'Cuối kỳ',
          examDateFormatted: 'Thứ Năm, 20/11/2025', durationFormatted: '60 phút', startsAt: '2025-11-20T07:30:00', endsAt: '2025-11-20T08:30:00',
          roomName: 'B101', durationMinutes: 60, examFormat: 'Trắc nghiệm & Tự luận', status: 'pending', statusTextVi: 'Chưa diễn ra',
          semester: normalizedSemester, academicYear: normalizedYear, invigilator: 'Cô Nguyễn Mai Trang', allowedMaterials: 'Bút viết, máy tính'
        },
        {
          id: 'ex-09', stt: 9, subjectName: 'Tin học', subjectCode: 'TIN11', examTitle: 'Kiểm tra cuối kỳ I môn Tin học', examType: 'Cuối kỳ',
          examDateFormatted: 'Thứ Sáu, 21/11/2025', durationFormatted: '45 phút', startsAt: '2025-11-21T07:30:00', endsAt: '2025-11-21T08:15:00',
          roomName: 'B201', durationMinutes: 45, examFormat: 'Thực hành máy tính & trắc nghiệm', status: 'pending', statusTextVi: 'Chưa diễn ra',
          semester: normalizedSemester, academicYear: normalizedYear, invigilator: 'Thầy Phan Hoàng Anh', allowedMaterials: 'Không mang USB'
        },
        {
          id: 'ex-10', stt: 10, subjectName: 'GDTC', subjectCode: 'GDTC11', examTitle: 'Đánh giá kỹ năng thể lực HK I', examType: 'Đánh giá',
          examDateFormatted: 'Trong tuần 22/11 – 28/11', durationFormatted: 'Thực hành', startsAt: '2025-11-22T07:00:00', endsAt: '2025-11-28T11:00:00',
          roomName: 'Sân trường', durationMinutes: 45, examFormat: 'Thực hành thể lực', status: 'pending', statusTextVi: 'Chưa diễn ra',
          semester: normalizedSemester, academicYear: normalizedYear, invigilator: 'Thầy Đặng Hữu Phong', allowedMaterials: 'Trang phục thể thao'
        }
      ];
    }
  }

  const totalExams = exams.length;
  const completedExams = exams.filter((e) => e.status === 'completed').length;
  const upcomingExams = exams.filter((e) => e.status === 'upcoming').length;
  const remainingExams = exams.filter((e) => e.status === 'pending').length;

  // Giữ đầy đủ tất cả 10 môn của học kỳ (Giữa kỳ, Cuối kỳ, Đánh giá) như trong ảnh mẫu thiết kế
  const filteredExams = exams;

  let upcomingList = exams.filter((e) => e.status === 'upcoming');
  if (upcomingList.length === 0 && remainingExams > 0) {
    upcomingList = exams.filter((e) => e.status === 'pending').slice(0, 3);
  }

  const nextExam = upcomingList[0] || exams.find((e) => e.status === 'upcoming') || exams[0];

  return {
    semester: normalizedSemester,
    academicYear: normalizedYear,
    currentExamPeriod: periodFilter,
    totalExams,
    completedExams,
    upcomingExams,
    remainingExams,
    exams: filteredExams,
    nextExam,
    upcomingList: upcomingList.slice(0, 3)
  };
}

export const StudentExamsPage: React.FC = () => {
  // Navigation sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<'schedule' | 'plan' | 'results'>('schedule');

  // Filters
  const [selectedSemester, setSelectedSemester] = useState<string>('Học kỳ I');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('2025 – 2026');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Kiểm tra cuối kỳ I');

  // Selected exam for modal details
  const [selectedExamDetail, setSelectedExamDetail] = useState<ExamItem | null>(null);

  // Live countdown state
  const [countdownText, setCountdownText] = useState<string>('Còn 3 ngày 14 giờ 26 phút');

  // When changing semester, update period dropdown default automatically
  const handleSemesterChange = (newSem: string) => {
    setSelectedSemester(newSem);
    if (newSem.includes('II')) {
      setSelectedPeriod('Kiểm tra cuối kỳ II');
    } else {
      setSelectedPeriod('Kiểm tra cuối kỳ I');
    }
  };

  // Schedule data calculated immediately from local generator to ensure instant response
  const [scheduleData, setScheduleData] = useState<ExamScheduleSummary>(() =>
    getExamScheduleDataset(selectedAcademicYear, selectedSemester, selectedPeriod)
  );

  // Load from backend API if available, keep fallback synced
  useEffect(() => {
    let isMounted = true;
    const loadApiData = async () => {
      try {
        const rawSem = selectedSemester.includes('II') ? 'Học kỳ II' : 'Học kỳ I';
        const rawYear = selectedAcademicYear.includes('2024')
          ? '2024 – 2025'
          : selectedAcademicYear.includes('2026')
          ? '2026 – 2027'
          : '2025 – 2026';

        const apiSummary = await studentApi.getExamScheduleSummary(rawSem, rawYear, selectedPeriod);
        if (isMounted && apiSummary && apiSummary.exams && apiSummary.exams.length > 0) {
          setScheduleData(apiSummary);
        }
      } catch (err) {
        const localData = getExamScheduleDataset(selectedAcademicYear, selectedSemester, selectedPeriod);
        if (isMounted) {
          setScheduleData(localData);
        }
      }
    };

    // Update local data immediately on any filter change
    const immediateData = getExamScheduleDataset(selectedAcademicYear, selectedSemester, selectedPeriod);
    setScheduleData(immediateData);

    loadApiData();
    return () => {
      isMounted = false;
    };
  }, [selectedSemester, selectedAcademicYear, selectedPeriod]);

  // Dynamic countdown text calculation based on nextExam date
  useEffect(() => {
    const isGrade10 = selectedAcademicYear.includes('2024');
    if (isGrade10) {
      setCountdownText('Đã hoàn thành toàn bộ 10 bài kiểm tra');
      return;
    }

    const next = scheduleData.nextExam;
    if (!next) {
      setCountdownText('Chưa có lịch kiểm tra mới');
      return;
    }

    if (next.status === 'completed') {
      setCountdownText('Kỳ thi đã hoàn thành thành công');
      return;
    }

    const targetDate = next.startsAt ? new Date(next.startsAt).getTime() : new Date('2025-11-17T07:30:00').getTime();
    const now = new Date().getTime();
    const diff = targetDate - now;

    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setCountdownText(`Còn ${days} ngày ${hours} giờ ${minutes} phút`);
    } else {
      setCountdownText('Còn 3 ngày 14 giờ 26 phút');
    }
  }, [scheduleData.nextExam, selectedAcademicYear]);

  // Parsing date for Highlight card
  const highlightDateParts = (() => {
    const next = scheduleData.nextExam;
    if (!next || !next.examDateFormatted) {
      return { weekday: 'Thứ Hai', day: '17', month: 'Tháng 11' };
    }
    const parts = next.examDateFormatted.split(',');
    const weekday = parts[0]?.trim() || 'Thứ Hai';
    const dateStr = parts[1]?.trim() || '';
    const slashParts = dateStr.split('/');
    const day = slashParts[0] || '17';
    const month = slashParts[1] ? `Tháng ${slashParts[1]}` : 'Tháng 11';
    return { weekday, day, month };
  })();

  const isGrade10 = selectedAcademicYear.includes('2024');

  return (
    <div className="space-y-5 pb-12">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 shadow-sm p-6 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4 relative z-10 max-w-2xl">
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Lịch kiểm tra
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200/60">
                {isGrade10 ? 'Lớp 10 (2024–2025)' : selectedAcademicYear.includes('2026') ? 'Lớp 12 (2026–2027)' : 'Lớp 11 (2025–2026)'}
              </span>
            </div>
            <p className="text-sm text-slate-500 font-normal mt-1">
              Lịch các bài kiểm tra định kỳ, kiểm tra thường xuyên và đánh giá khác
            </p>
          </div>
        </div>

        {/* Right side Illustration decorative art */}
        <div className="hidden lg:flex items-center gap-3 relative z-10 opacity-95">
          <div className="relative w-48 h-20 flex items-end justify-center">
            <div className="relative bg-gradient-to-tr from-blue-500 to-sky-400 rounded-xl w-28 h-20 shadow-md p-2 text-white flex flex-col justify-between">
              <div className="flex justify-between items-center border-b border-white/20 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Lịch thi</span>
                <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
              </div>
              <div className="grid grid-cols-4 gap-1 text-[8px] text-center font-mono opacity-80">
                <span>17</span>
                <span>18</span>
                <span className="bg-white text-blue-600 rounded font-bold">19</span>
                <span>20</span>
              </div>
              <div className="text-[9px] font-semibold text-sky-100 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-300" /> Chuẩn bị tốt
              </div>
            </div>
            <div className="absolute -left-6 bottom-0 w-16 h-8 bg-amber-400 rounded-lg shadow-sm transform -rotate-6 border border-amber-500/20"></div>
            <div className="absolute -left-4 bottom-3 w-16 h-6 bg-rose-400 rounded-lg shadow-sm transform rotate-3 border border-rose-500/20"></div>
          </div>
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-50/60 to-transparent pointer-events-none" />
      </div>

      {/* 2. Sub-tabs & Fixed Filters Row (Proper padding so icons NEVER overlap text) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Sub-tabs pills */}
        <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveSubTab('schedule')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'schedule'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Lịch kiểm tra</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('plan')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'plan'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Kế hoạch ôn tập</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('results')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'results'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Kết quả kiểm tra</span>
          </button>
        </div>

        {/* Dropdown Filters: Correct padding-left and padding-right to completely eliminate overlapping */}
        <div className="flex items-center gap-3">
          {/* Học kỳ filter */}
          <div className="relative inline-block">
            <select
              value={selectedSemester}
              onChange={(e) => handleSemesterChange(e.target.value)}
              className="appearance-none bg-white text-slate-700 pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 text-xs font-bold hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs cursor-pointer transition-all"
            >
              <option value="Học kỳ I">Học kỳ: Học kỳ I</option>
              <option value="Học kỳ II">Học kỳ: Học kỳ II</option>
            </select>
            <Layers className="w-4 h-4 text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Năm học filter (THPT: Lớp 10 đến 12) */}
          <div className="relative inline-block">
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="appearance-none bg-white text-slate-700 pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 text-xs font-bold hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs cursor-pointer transition-all"
            >
              <option value="2025 – 2026">Năm học: 2025 – 2026 (Lớp 11)</option>
              <option value="2024 – 2025">Năm học: 2024 – 2025 (Lớp 10)</option>
              <option value="2026 – 2027">Năm học: 2026 – 2027 (Lớp 12)</option>
            </select>
            <Calendar className="w-4 h-4 text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 3. 4 KPI Summary Cards (Dynamic by semester & academic year) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Tổng số bài kiểm tra */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex items-center gap-4 hover:border-blue-200 transition-all">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Tổng số bài kiểm tra</div>
            <div className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight mt-0.5">
              {scheduleData.totalExams}
            </div>
          </div>
        </div>

        {/* Card 2: Đã hoàn thành */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex items-center gap-4 hover:border-emerald-200 transition-all">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Đã hoàn thành</div>
            <div className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight mt-0.5">
              {scheduleData.completedExams}
            </div>
          </div>
        </div>

        {/* Card 3: Sắp diễn ra */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex items-center gap-4 hover:border-amber-200 transition-all">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Sắp diễn ra</div>
            <div className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight mt-0.5">
              {scheduleData.upcomingExams}
            </div>
          </div>
        </div>

        {/* Card 4: Còn lại */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex items-center gap-4 hover:border-purple-200 transition-all">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Còn lại</div>
            <div className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight mt-0.5">
              {scheduleData.remainingExams}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Tab 1: Main Content Section */}
      {activeSubTab === 'schedule' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: 8 Cols - Main Exam Schedule Table */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 overflow-hidden">
            {/* Table Card Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Lịch kiểm tra {selectedSemester}
                  </h2>
                  <div className="text-[11px] font-medium text-slate-400">
                    Năm học: {selectedAcademicYear} • {isGrade10 ? 'Lớp 10A1' : selectedAcademicYear.includes('2026') ? 'Lớp 12A1' : 'Lớp 11A1'}
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-400">
                Hiển thị {scheduleData.exams.length} môn học
              </span>
            </div>

            {/* Main Table */}
            <div className="overflow-x-auto -mx-5 sm:-mx-6 mt-2">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4 text-center w-12">STT</th>
                    <th className="py-3 px-4">Môn học</th>
                    <th className="py-3 px-4">Hình thức</th>
                    <th className="py-3 px-4">Ngày kiểm tra</th>
                    <th className="py-3 px-4">Thời gian</th>
                    <th className="py-3 px-4">Phòng</th>
                    <th className="py-3 px-4 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {scheduleData.exams.map((exam, idx) => {
                    const cfg = SUBJECT_CONFIG[exam.subjectName] || {
                      pillClass: 'bg-slate-100 text-slate-700 border-slate-200',
                      icon: BookOpen,
                      accentColor: '#64748b'
                    };
                    const SubjectIcon = cfg.icon;

                    return (
                      <tr
                        key={exam.id}
                        onClick={() => setSelectedExamDetail(exam)}
                        className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                      >
                        {/* STT */}
                        <td className="py-3 px-4 text-center font-bold text-slate-700">
                          {exam.stt || idx + 1}
                        </td>

                        {/* Môn học with soft colored pill badge & icon */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${cfg.pillClass}`}
                          >
                            <SubjectIcon className="w-3.5 h-3.5 shrink-0" />
                            <span>{exam.subjectName}</span>
                          </span>
                        </td>

                        {/* Hình thức */}
                        <td className="py-3 px-4 whitespace-nowrap text-slate-700 font-semibold">
                          {exam.examType}
                        </td>

                        {/* Ngày kiểm tra with calendar icon */}
                        <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{exam.examDateFormatted}</span>
                          </span>
                        </td>

                        {/* Thời gian with clock icon */}
                        <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{exam.durationFormatted}</span>
                          </span>
                        </td>

                        {/* Phòng */}
                        <td className="py-3 px-4 whitespace-nowrap text-slate-700 font-semibold">
                          {exam.roomName}
                        </td>

                        {/* Trạng thái */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {exam.status === 'completed' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Đã hoàn thành</span>
                            </span>
                          )}

                          {exam.status === 'upcoming' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-200/80">
                              <Clock className="w-3 h-3 text-blue-500" />
                              <span>Sắp diễn ra</span>
                            </span>
                          )}

                          {exam.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-50 text-slate-500 border border-slate-200/80">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>Chưa diễn ra</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer info */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-blue-500" />
                <span>Nhấp vào từng môn để xem chi tiết phòng thi và danh mục tài liệu được phép mang vào.</span>
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="font-bold text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất file PDF</span>
              </button>
            </div>
          </div>

          {/* Right Column: 4 Cols */}
          <div className="lg:col-span-4 space-y-4">
            {/* Card 1: Kỳ kiểm tra hiện tại (Adaptive options based on Semester) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
              <div className="flex items-center gap-2 mb-3 text-slate-800 font-extrabold text-sm">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Kỳ kiểm tra hiện tại</span>
              </div>
              <div className="relative">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full appearance-none bg-slate-50/70 hover:bg-slate-100/70 text-slate-800 font-bold text-xs py-2.5 pl-3.5 pr-8 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-all"
                >
                  {selectedSemester.includes('II') ? (
                    <>
                      <option value="Kiểm tra cuối kỳ II">Kiểm tra cuối kỳ II</option>
                      <option value="Kiểm tra giữa kỳ II">Kiểm tra giữa kỳ II</option>
                      <option value="Tất cả các kỳ">Tất cả bài kiểm tra HK II</option>
                    </>
                  ) : (
                    <>
                      <option value="Kiểm tra cuối kỳ I">Kiểm tra cuối kỳ I</option>
                      <option value="Kiểm tra giữa kỳ I">Kiểm tra giữa kỳ I</option>
                      <option value="Tất cả các kỳ">Tất cả bài kiểm tra HK I</option>
                    </>
                  )}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Card 2: Kiểm tra sắp tới (100% Dynamic matching nextExam) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
              <div className="flex items-center gap-2 mb-4 text-slate-800 font-extrabold text-sm">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>{isGrade10 ? 'Kết quả năm học' : 'Kiểm tra sắp tới'}</span>
              </div>

              {/* Date Box + Subject Info */}
              <div className="flex items-center gap-4">
                {/* Large Date Badge */}
                <div className="w-20 h-22 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col items-center justify-center p-2 shrink-0">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {highlightDateParts.weekday}
                  </span>
                  <span className="text-2xl font-black text-slate-900 leading-none my-1">
                    {highlightDateParts.day}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500">
                    {highlightDateParts.month}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                    {scheduleData.nextExam
                      ? `${scheduleData.nextExam.subjectName} – ${scheduleData.nextExam.examType}`
                      : isGrade10
                      ? 'Hoàn thành chương trình Lớp 10'
                      : 'Lịch kiểm tra sắp diễn ra'}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{scheduleData.nextExam?.durationFormatted || 'Đã thi xong'}</span>
                    <span className="text-slate-300">•</span>
                    <span>Phòng {scheduleData.nextExam?.roomName || 'A203'}</span>
                  </div>
                </div>
              </div>

              {/* Countdown Pill matching mockup */}
              <div
                className={`mt-4 py-2.5 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 ${
                  isGrade10
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                    : 'bg-blue-50/90 text-blue-600 border-blue-100'
                }`}
              >
                {isGrade10 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 shrink-0" />
                )}
                <span>{countdownText}</span>
              </div>
            </div>

            {/* Card 3: Danh sách kiểm tra sắp tới (Mapped dynamically) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-slate-800 font-extrabold text-sm">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Danh sách môn kiểm tra</span>
                </div>
                <span className="text-[11px] font-bold text-slate-400">
                  {scheduleData.upcomingList.length} môn
                </span>
              </div>

              <div className="space-y-2 mt-2">
                {scheduleData.upcomingList && scheduleData.upcomingList.length > 0 ? (
                  scheduleData.upcomingList.map((exam) => {
                    const cfg = SUBJECT_CONFIG[exam.subjectName] || {
                      pillClass: 'bg-blue-50 text-blue-600 border-blue-100',
                      icon: BookOpen,
                      accentColor: '#2563eb'
                    };
                    const ItemIcon = cfg.icon;

                    return (
                      <div
                        key={exam.id}
                        onClick={() => setSelectedExamDetail(exam)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200/60 cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${cfg.pillClass}`}
                          >
                            <ItemIcon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {exam.subjectName}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {exam.examDateFormatted} • {exam.durationFormatted}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors shrink-0" />
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center rounded-xl bg-slate-50 text-xs text-slate-500 font-medium">
                    Toàn bộ môn thi đã hoàn thành xuất sắc.
                  </div>
                )}
              </div>
            </div>

            {/* Card 4: Lưu ý quy chế thi */}
            <div className="bg-blue-50/60 rounded-2xl border border-blue-100/80 p-5">
              <div className="flex items-center gap-2 mb-3 text-blue-900 font-extrabold text-sm">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Lưu ý</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 leading-relaxed font-medium">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <span>Mang theo thẻ học sinh và dụng cụ học tập đầy đủ.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <span>Có mặt tại phòng kiểm tra trước 15 phút.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <span>Tuân thủ quy chế kiểm tra của nhà trường.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab 2: Kế hoạch ôn tập */}
      {activeSubTab === 'plan' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Lộ trình &amp; Kế hoạch ôn tập trọng tâm
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Đề cương chi tiết được biên soạn bởi tổ bộ môn Trường THPT Nguyễn Trãi ({selectedAcademicYear})
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
              {selectedSemester}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {scheduleData.exams.slice(0, 4).map((item, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200/80 p-5 bg-gradient-to-br from-white to-slate-50/50 hover:border-blue-300 transition-all shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-100 text-blue-700">
                      {item.subjectName}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      Thi ngày: {item.examDateFormatted}
                    </span>
                  </div>

                  <h3 className="text-sm font-extrabold text-slate-800 mb-2">
                    Kiến thức trọng tâm bài {item.examType}
                  </h3>

                  <div className="space-y-1.5 mb-4">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Hình thức &amp; Thời lượng:
                    </div>
                    <div className="text-xs text-slate-600 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span>{item.durationFormatted} ({item.examFormat})</span>
                    </div>
                    <div className="text-xs text-slate-600 flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Dụng cụ: {item.allowedMaterials}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-600">
                    Phòng thi: {item.roomName}
                  </span>
                  <button
                    type="button"
                    onClick={() => alert(`Đang tải tài liệu ôn tập môn ${item.subjectName}...`)}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải đề cương</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Tab 3: Kết quả kiểm tra */}
      {activeSubTab === 'results' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Kết quả các bài kiểm tra ({selectedSemester} – {selectedAcademicYear})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Điểm số được giáo viên bộ môn công bố chính thức trên cổng SOMS
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
              {scheduleData.completedExams} môn đã có điểm
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="text-xs font-bold text-purple-700">Ngữ văn</div>
              <div className="text-2xl font-black text-slate-800 mt-1">{isGrade10 ? '8,0' : '8,0'}</div>
              <div className="text-xs text-slate-500 mt-1">Xếp loại: Giỏi • Đạt yêu cầu</div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="text-xs font-bold text-rose-700">Toán</div>
              <div className="text-2xl font-black text-slate-800 mt-1">{isGrade10 ? '8,5' : '8,5'}</div>
              <div className="text-xs text-slate-500 mt-1">Xếp loại: Giỏi • Đạt yêu cầu</div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="text-xs font-bold text-sky-700">Tiếng Anh</div>
              <div className="text-2xl font-black text-slate-800 mt-1">{isGrade10 ? '9,0' : '8,5'}</div>
              <div className="text-xs text-slate-500 mt-1">Xếp loại: Giỏi • Đạt yêu cầu</div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="text-xs font-bold text-violet-700">Hóa học</div>
              <div className="text-2xl font-black text-slate-800 mt-1">{isGrade10 ? '8,5' : '8,0'}</div>
              <div className="text-xs text-slate-500 mt-1">Xếp loại: Giỏi • Đạt yêu cầu</div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal Chi tiết bài kiểm tra */}
      {selectedExamDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 w-full max-w-lg overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">
                    Chi tiết bài kiểm tra môn {selectedExamDetail.subjectName}
                  </h3>
                  <div className="text-xs text-blue-100">
                    {selectedExamDetail.academicYear} • {selectedExamDetail.semester}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedExamDetail(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400">Hình thức kiểm tra</span>
                  <div className="font-extrabold text-slate-800 text-sm mt-0.5">
                    {selectedExamDetail.examType}
                  </div>
                  <div className="text-slate-500 mt-0.5">{selectedExamDetail.examFormat}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400">Thời lượng &amp; Phòng</span>
                  <div className="font-extrabold text-slate-800 text-sm mt-0.5">
                    {selectedExamDetail.durationFormatted}
                  </div>
                  <div className="text-slate-500 mt-0.5">Phòng thi: {selectedExamDetail.roomName}</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Ngày kiểm tra:</span>
                  <span className="font-bold text-slate-800">{selectedExamDetail.examDateFormatted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Giờ vào phòng:</span>
                  <span className="font-bold text-blue-600">07:15 (Bắt đầu làm bài 07:30)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cán bộ coi thi:</span>
                  <span className="font-bold text-slate-800">{selectedExamDetail.invigilator}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vật dụng được mang:</span>
                  <span className="font-medium text-slate-700 text-right max-w-[240px]">
                    {selectedExamDetail.allowedMaterials}
                  </span>
                </div>
              </div>

              {/* Status banner */}
              <div
                className={`p-3 rounded-xl flex items-center justify-between font-bold ${
                  selectedExamDetail.status === 'completed'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                    : selectedExamDetail.status === 'upcoming'
                    ? 'bg-blue-50 text-blue-800 border border-blue-100'
                    : 'bg-slate-50 text-slate-700 border border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Trạng thái: {selectedExamDetail.statusTextVi}</span>
                </div>
                {selectedExamDetail.status === 'completed' && (
                  <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-md">
                    Đã có kết quả
                  </span>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedExamDetail(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200/60 font-bold text-xs transition-colors"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(`Đã thêm lịch kiểm tra môn ${selectedExamDetail.subjectName} vào thông báo.`);
                  setSelectedExamDetail(null);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
              >
                Đặt nhắc nhở
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
