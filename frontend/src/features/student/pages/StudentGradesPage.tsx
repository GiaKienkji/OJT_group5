import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Medal,
  Award,
  BookOpen,
  Calendar,
  Layers,
  ChevronDown,
  Info,
  Trophy,
  Users,
  Target,
  BarChart2,
  TrendingUp,
  Table,
  Check,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
  Quote,
  School,
  Clock
} from 'lucide-react';
import { studentApi } from '../services/studentApi';
import {
  StudentAcademicSummary,
  SubjectGrade,
  YearSubjectGrade,
  YearAcademicSummary,
  ProgressionRecord
} from '../types/student.types';

function getAcademicData(year: string, sem: string): StudentAcademicSummary {
  const isGrade10 = year.includes('2024') || year.includes('10');
  const isGrade12 = year.includes('2026') || year.includes('12');
  const isSem2 = sem.includes('II');

  const normalizedYear = isGrade10 ? '2024 – 2025' : isGrade12 ? '2026 – 2027' : '2025 – 2026';
  const normalizedClass = isGrade10 ? '10A1' : isGrade12 ? '12A1' : '11A1';
  const normalizedGrade = isGrade10 ? 'Lớp 10' : isGrade12 ? 'Lớp 12' : 'Lớp 11';
  const normalizedTeacher = isGrade10 ? 'Cô Lê Thị Mai' : isGrade12 ? 'Thầy Trần Quốc Huy' : 'Cô Phạm Minh Thư';

  const progressionHistory: ProgressionRecord[] = [
    {
      academicYear: '2024 – 2025',
      grade: 'Lớp 10',
      className: '10A1',
      schoolName: 'Trường THPT Nguyễn Trãi',
      semester1Gpa: 8.1,
      semester2Gpa: 8.3,
      yearGpa: 8.2,
      academicRank: 'Giỏi',
      conductRank: 'Tốt',
      classRank: '4 / 42',
      awardTitle: 'Học sinh Giỏi cấp Trường – Giải Nhì HSG môn Toán cấp Cụm',
      homeroomTeacher: 'Cô Lê Thị Mai',
      teacherComment: 'Thích nghi rất tốt với chương trình giáo dục phổ thông THPT. Tư duy phản biện và khả năng tự nghiên cứu cao.',
      status: 'completed'
    },
    {
      academicYear: '2025 – 2026',
      grade: 'Lớp 11',
      className: '11A1',
      schoolName: 'Trường THPT Nguyễn Trãi',
      semester1Gpa: 8.6,
      semester2Gpa: 8.8,
      yearGpa: 8.7,
      academicRank: 'Giỏi',
      conductRank: 'Tốt',
      classRank: '2 / 42',
      awardTitle: 'Học sinh Giỏi cấp Trường – Lớp phó Học tập',
      homeroomTeacher: 'Cô Phạm Minh Thư',
      teacherComment: 'Giữ vững phong độ học tập xuất sắc, hoàn thành tốt nhiệm vụ ban cán sự lớp, tinh thần đồng đội cao.',
      status: 'in_progress'
    },
    {
      academicYear: '2026 – 2027',
      grade: 'Lớp 12',
      className: '12A1',
      schoolName: 'Trường THPT Nguyễn Trãi',
      semester1Gpa: 8.8,
      semester2Gpa: 9.0,
      yearGpa: 8.9,
      academicRank: 'Xuất sắc',
      conductRank: 'Tốt',
      classRank: '1 / 42',
      awardTitle: 'Học sinh Xuất sắc – Tốt nghiệp THPT loại Xuất sắc',
      homeroomTeacher: 'Thầy Trần Quốc Huy',
      teacherComment: 'Nỗ lực học tập vượt bậc, làm chủ kiến thức toàn diện chuẩn bị cho kỳ thi tốt nghiệp THPT Quốc gia.',
      status: 'completed'
    }
  ];

  if (isGrade10) {
    if (isSem2) {
      return {
        academicYear: normalizedYear,
        semester: sem,
        className: normalizedClass,
        gradeLevel: normalizedGrade,
        homeroomTeacher: normalizedTeacher,
        overallGpa: 8.3,
        classRank: '4 / 42',
        gradeRank: '22 / 320',
        totalSubjects: 10,
        passRate: '100%',
        academicRank: 'Giỏi',
        conductRank: 'Tốt',
        isPublished: true,
        subjects: [
          { stt: 1, subjectName: 'Toán', subjectCode: 'TOAN', ddgTx1: '8,5', ddgTx2: '8,5', ddgTx3: '8,5', ddgGk: '8,5', ddgCk: '8,5', diemTb: '8,5', scoreNumeric: 8.5, evaluation: 'Giỏi', evaluationBadge: 'gioi', averageScore: 8.5 },
          { stt: 2, subjectName: 'Ngữ văn', subjectCode: 'VAN', ddgTx1: '8,0', ddgTx2: '8,5', ddgTx3: '8,0', ddgGk: '8,5', ddgCk: '8,0', diemTb: '8,2', scoreNumeric: 8.2, evaluation: 'Giỏi', evaluationBadge: 'gioi', averageScore: 8.2 },
          { stt: 3, subjectName: 'Tiếng Anh', subjectCode: 'ANH', ddgTx1: '8,5', ddgTx2: '9,0', ddgTx3: '8,5', ddgGk: '8,5', ddgCk: '8,5', diemTb: '8,6', scoreNumeric: 8.6, evaluation: 'Giỏi', evaluationBadge: 'gioi', averageScore: 8.6 },
          { stt: 4, subjectName: 'Vật lý', subjectCode: 'LY', ddgTx1: '8,0', ddgTx2: '8,5', ddgTx3: '8,0', ddgGk: '8,5', ddgCk: '8,0', diemTb: '8,2', scoreNumeric: 8.2, evaluation: 'Giỏi', evaluationBadge: 'gioi', averageScore: 8.2 },
          { stt: 5, subjectName: 'Hóa học', subjectCode: 'HOA', ddgTx1: '8,0', ddgTx2: '8,5', ddgTx3: '8,0', ddgGk: '8,0', ddgCk: '8,5', diemTb: '8,2', scoreNumeric: 8.2, evaluation: 'Giỏi', evaluationBadge: 'gioi', averageScore: 8.2 },
          { stt: 6, subjectName: 'Sinh học', subjectCode: 'SINH', ddgTx1: '8,5', ddgTx2: '8,5', ddgTx3: '8,5', ddgGk: '8,5', ddgCk: '8,5', diemTb: '8,4', scoreNumeric: 8.4, evaluation: 'Giỏi', evaluationBadge: 'gioi', averageScore: 8.4 },
          { stt: 7, subjectName: 'Lịch sử', subjectCode: 'SU', ddgTx1: '8,0', ddgTx2: '8,0', ddgTx3: '8,5', ddgGk: '8,0', ddgCk: '8,0', diemTb: '8,1', scoreNumeric: 8.1, evaluation: 'Giỏi', evaluationBadge: 'gioi', averageScore: 8.1 },
          { stt: 8, subjectName: 'Địa lý', subjectCode: 'DIA', ddgTx1: '8,5', ddgTx2: '8,5', ddgTx3: '8,0', ddgGk: '8,5', ddgCk: '8,5', diemTb: '8,4', scoreNumeric: 8.4, evaluation: 'Giỏi', evaluationBadge: 'gioi', averageScore: 8.4 },
          { stt: 9, subjectName: 'Tin học', subjectCode: 'TIN', ddgTx1: '9,0', ddgTx2: '9,0', ddgTx3: '9,0', ddgGk: '9,0', ddgCk: '9,0', diemTb: '9,0', scoreNumeric: 9.0, evaluation: 'Xuất sắc', evaluationBadge: 'xuat_sac', averageScore: 9.0 },
          { stt: 10, subjectName: 'GDTC', subjectCode: 'GDTC', ddgTx1: 'Đ', ddgTx2: 'Đ', ddgTx3: 'Đ', ddgGk: 'Đ', ddgCk: 'Đ', diemTb: 'Đ', scoreNumeric: null, evaluation: 'Đạt', evaluationBadge: 'dat', averageScore: null }
        ],
        gpaHistory: [
          { termName: 'Đầu năm (Lớp 10)', gpa: 8.0 },
          { termName: 'HK I (Lớp 10)', gpa: 8.1 },
          { termName: 'HK II (Lớp 10)', gpa: 8.3 }
        ],
        yearSummary: {
          academicYear: '2024 – 2025',
          className: '10A1',
          gradeLevel: 'Lớp 10',
          homeroomTeacher: 'Cô Lê Thị Mai',
          overallYearGpa: 8.2,
          semester1Gpa: 8.1,
          semester2Gpa: 8.3,
          classRank: '4 / 42',
          gradeRank: '22 / 320',
          academicRank: 'Giỏi',
          conductRank: 'Tốt',
          titleAward: 'Học sinh Giỏi cấp Trường – Giải Nhì HSG Toán Cụm',
          promotionStatus: 'Được lên lớp 11A1 thẳng',
          totalSubjects: 10,
          passRate: '100%',
          teacherFeedback: 'Thích nghi rất tốt với môi trường THPT. Học sinh tự giác, hoàn thành xuất sắc các nội dung học tập và thi đua của lớp 10A1.',
          subjects: []
        },
        progressionHistory
      };
    } else {
      return {
        academicYear: normalizedYear,
        semester: sem,
        className: normalizedClass,
        gradeLevel: normalizedGrade,
        homeroomTeacher: normalizedTeacher,
        overallGpa: 8.1,
        classRank: '5 / 42',
        gradeRank: '28 / 320',
        totalSubjects: 10,
        passRate: '100%',
        academicRank: 'Giỏi',
        conductRank: 'Tốt',
        isPublished: true,
        subjects: [
          { stt: 1, subjectName: 'Toán', subjectCode: 'TOAN', ddgTx1: '8,0', ddgTx2: '8,5', ddgTx3: '8,0', ddgGk: '8,0', ddgCk: '8,5', diemTb: '8,2', scoreNumeric: 8.2, evaluation: 'Giỏi', evaluationBadge: 'gioi', averageScore: 8.2 },
          { stt: 2, subjectName: 'Ngữ văn', subjectCode: 'VAN', ddgTx1: '8,0', ddgTx2: '8,0', ddgTx3: '8,0', ddgGk: '8,0', ddgCk: '8,0', diemTb: '8,0', scoreNumeric: 8.0, evaluation: 'Giỏi', evaluationBadge: 'gioi', averageScore: 8.0 },
          { stt: 3, subjectName: 'Tiếng Anh', subjectCode: 'ANH', ddgTx1: '8,5', ddgTx2: '8,5', ddgTx3: '8,5', ddgGk: '8,5', ddgCk: '8,5', diemTb: '8,5', scoreNumeric: 8.5, evaluation: 'Giỏi', evaluationBadge: 'gioi', averageScore: 8.5 },
          { stt: 4, subjectName: 'Vật lý', subjectCode: 'LY', ddgTx1: '8,0', ddgTx2: '8,0', ddgTx3: '8,0', ddgGk: '8,0', ddgCk: '8,0', diemTb: '8,0', scoreNumeric: 8.0, evaluation: 'Giỏi', evaluationBadge: 'gioi', averageScore: 8.0 },
          { stt: 5, subjectName: 'Hóa học', subjectCode: 'HOA', ddgTx1: '8,0', ddgTx2: '7,5', ddgTx3: '8,0', ddgGk: '8,0', ddgCk: '8,0', diemTb: '7,9', scoreNumeric: 7.9, evaluation: 'Khá', evaluationBadge: 'gioi', averageScore: 7.9 },
          { stt: 6, subjectName: 'Sinh học', subjectCode: 'SINH', ddgTx1: '8,0', ddgTx2: '8,5', ddgTx3: '8,5', ddgGk: '8,5', ddgCk: '8,0', diemTb: '8,3', scoreNumeric: 8.3, evaluation: 'Giỏi', evaluationBadge: 'gioi', averageScore: 8.3 },
          { stt: 7, subjectName: 'Lịch sử', subjectCode: 'SU', ddgTx1: '8,0', ddgTx2: '8,0', ddgTx3: '8,0', ddgGk: '8,0', ddgCk: '8,0', diemTb: '8,0', scoreNumeric: 8.0, evaluation: 'Giỏi', evaluationBadge: 'gioi', averageScore: 8.0 },
          { stt: 8, subjectName: 'Địa lý', subjectCode: 'DIA', ddgTx1: '8,0', ddgTx2: '8,5', ddgTx3: '8,0', ddgGk: '8,0', ddgCk: '8,5', diemTb: '8,2', scoreNumeric: 8.2, evaluation: 'Giỏi', evaluationBadge: 'gioi', averageScore: 8.2 },
          { stt: 9, subjectName: 'Tin học', subjectCode: 'TIN', ddgTx1: '9,0', ddgTx2: '8,5', ddgTx3: '9,0', ddgGk: '8,5', ddgCk: '9,0', diemTb: '8,8', scoreNumeric: 8.8, evaluation: 'Giỏi', evaluationBadge: 'gioi', averageScore: 8.8 },
          { stt: 10, subjectName: 'GDTC', subjectCode: 'GDTC', ddgTx1: 'Đ', ddgTx2: 'Đ', ddgTx3: 'Đ', ddgGk: 'Đ', ddgCk: 'Đ', diemTb: 'Đ', scoreNumeric: null, evaluation: 'Đạt', evaluationBadge: 'dat', averageScore: null }
        ],
        gpaHistory: [
          { termName: 'Đầu năm (Lớp 10)', gpa: 8.0 },
          { termName: 'HK I (Lớp 10)', gpa: 8.1 },
          { termName: 'HK II (Lớp 10)', gpa: 8.3 }
        ],
        yearSummary: {
          academicYear: '2024 – 2025',
          className: '10A1',
          gradeLevel: 'Lớp 10',
          homeroomTeacher: 'Cô Lê Thị Mai',
          overallYearGpa: 8.2,
          semester1Gpa: 8.1,
          semester2Gpa: 8.3,
          classRank: '4 / 42',
          gradeRank: '22 / 320',
          academicRank: 'Giỏi',
          conductRank: 'Tốt',
          titleAward: 'Học sinh Giỏi cấp Trường – Giải Nhì HSG Toán Cụm',
          promotionStatus: 'Được lên lớp 11A1 thẳng',
          totalSubjects: 10,
          passRate: '100%',
          teacherFeedback: 'Thích nghi rất tốt với môi trường THPT. Học sinh tự giác, hoàn thành xuất sắc các nội dung học tập và thi đua của lớp 10A1.',
          subjects: []
        },
        progressionHistory
      };
    }
  }

  if (isGrade12) {
    const gpa = isSem2 ? 9.0 : 8.8;
    const rank = '1 / 42';
    const gradeRank = isSem2 ? '5 / 320' : '8 / 320';
    return {
      academicYear: normalizedYear,
      semester: sem,
      className: normalizedClass,
      gradeLevel: normalizedGrade,
      homeroomTeacher: normalizedTeacher,
      overallGpa: gpa,
      classRank: rank,
      gradeRank: gradeRank,
      totalSubjects: 10,
      passRate: '100%',
      academicRank: 'Xuất sắc',
      conductRank: 'Tốt',
      isPublished: true,
      subjects: [
        { stt: 1, subjectName: 'Toán', subjectCode: 'TOAN', ddgTx1: '9,5', ddgTx2: '9,5', ddgTx3: '9,0', ddgGk: '9,5', ddgCk: isSem2 ? '9,5' : '9,0', diemTb: isSem2 ? '9,4' : '9,2', scoreNumeric: isSem2 ? 9.4 : 9.2, evaluation: 'Xuất sắc', evaluationBadge: 'xuat_sac', averageScore: isSem2 ? 9.4 : 9.2 },
        { stt: 2, subjectName: 'Ngữ văn', subjectCode: 'VAN', ddgTx1: '8,5', ddgTx2: '8,5', ddgTx3: '8,5', ddgGk: '8,5', ddgCk: isSem2 ? '9,0' : '8,5', diemTb: isSem2 ? '8,7' : '8,6', scoreNumeric: isSem2 ? 8.7 : 8.6, evaluation: 'Giỏi', evaluationBadge: 'gioi', averageScore: isSem2 ? 8.7 : 8.6 },
        { stt: 3, subjectName: 'Tiếng Anh', subjectCode: 'ANH', ddgTx1: '9,5', ddgTx2: '9,0', ddgTx3: '9,0', ddgGk: '9,0', ddgCk: '9,5', diemTb: '9,2', scoreNumeric: 9.2, evaluation: 'Xuất sắc', evaluationBadge: 'xuat_sac', averageScore: 9.2 },
        { stt: 4, subjectName: 'Vật lý', subjectCode: 'LY', ddgTx1: '9,0', ddgTx2: '9,0', ddgTx3: '8,5', ddgGk: '9,0', ddgCk: isSem2 ? '9,0' : '8,5', diemTb: isSem2 ? '9,0' : '8,8', scoreNumeric: isSem2 ? 9.0 : 8.8, evaluation: 'Giỏi', evaluationBadge: 'gioi', averageScore: isSem2 ? 9.0 : 8.8 },
        { stt: 5, subjectName: 'Hóa học', subjectCode: 'HOA', ddgTx1: '8,5', ddgTx2: '9,0', ddgTx3: '8,5', ddgGk: '9,0', ddgCk: isSem2 ? '9,0' : '8,5', diemTb: isSem2 ? '8,9' : '8,7', scoreNumeric: isSem2 ? 8.9 : 8.7, evaluation: 'Giỏi', evaluationBadge: 'gioi', averageScore: isSem2 ? 8.9 : 8.7 },
        { stt: 6, subjectName: 'Sinh học', subjectCode: 'SINH', ddgTx1: '8,5', ddgTx2: '9,0', ddgTx3: '8,5', ddgGk: '9,0', ddgCk: '9,0', diemTb: '8,9', scoreNumeric: 8.9, evaluation: 'Giỏi', evaluationBadge: 'gioi', averageScore: 8.9 },
        { stt: 7, subjectName: 'Lịch sử', subjectCode: 'SU', ddgTx1: '8,5', ddgTx2: '8,5', ddgTx3: '8,5', ddgGk: '8,5', ddgCk: '8,5', diemTb: '8,5', scoreNumeric: 8.5, evaluation: 'Giỏi', evaluationBadge: 'gioi', averageScore: 8.5 },
        { stt: 8, subjectName: 'Địa lý', subjectCode: 'DIA', ddgTx1: '8,5', ddgTx2: '8,5', ddgTx3: '9,0', ddgGk: '8,5', ddgCk: '9,0', diemTb: '8,8', scoreNumeric: 8.8, evaluation: 'Giỏi', evaluationBadge: 'gioi', averageScore: 8.8 },
        { stt: 9, subjectName: 'Tin học', subjectCode: 'TIN', ddgTx1: '9,5', ddgTx2: '9,5', ddgTx3: '9,5', ddgGk: '9,5', ddgCk: '9,5', diemTb: '9,5', scoreNumeric: 9.5, evaluation: 'Xuất sắc', evaluationBadge: 'xuat_sac', averageScore: 9.5 },
        { stt: 10, subjectName: 'GDTC', subjectCode: 'GDTC', ddgTx1: 'Đ', ddgTx2: 'Đ', ddgTx3: 'Đ', ddgGk: 'Đ', ddgCk: 'Đ', diemTb: 'Đ', scoreNumeric: null, evaluation: 'Đạt', evaluationBadge: 'dat', averageScore: null }
      ],
      gpaHistory: [
        { termName: 'HK I (Lớp 11)', gpa: 8.6 },
        { termName: 'HK II (Lớp 11)', gpa: 8.8 },
        { termName: 'HK I (Lớp 12)', gpa: 8.8 }
      ],
      yearSummary: {
        academicYear: '2026 – 2027',
        className: '12A1',
        gradeLevel: 'Lớp 12',
        homeroomTeacher: 'Thầy Trần Quốc Huy',
        overallYearGpa: 8.9,
        semester1Gpa: 8.8,
        semester2Gpa: 9.0,
        classRank: '1 / 42',
        gradeRank: '5 / 320',
        academicRank: 'Xuất sắc',
        conductRank: 'Tốt',
        titleAward: 'Học sinh Xuất sắc – Tốt nghiệp THPT loại Xuất sắc',
        promotionStatus: 'Đủ điều kiện xét tuyển Đại học',
        totalSubjects: 10,
        passRate: '100%',
        teacherFeedback: 'Học sinh có ý chí phấn đấu cao, năng lực tư duy toàn diện, hoàn thành xuất sắc chương trình THPT Quốc gia.',
        subjects: []
      },
      progressionHistory
    };
  }

  // Grade 11 (2025 – 2026)
  if (isSem2) {
    return {
      academicYear: normalizedYear,
      semester: sem,
      className: normalizedClass,
      gradeLevel: normalizedGrade,
      homeroomTeacher: normalizedTeacher,
      overallGpa: 8.8,
      classRank: '2 / 42',
      gradeRank: '12 / 320',
      totalSubjects: 10,
      passRate: '100%',
      academicRank: 'Giỏi',
      conductRank: 'Tốt',
      isPublished: true,
      subjects: [
        { stt: 1, subjectName: 'Toán', subjectCode: 'TOAN', ddgTx1: '9,0', ddgTx2: '9,5', ddgTx3: '8,5', ddgGk: '9,0', ddgCk: '9,0', diemTb: '9,0', scoreNumeric: 9.0, evaluation: 'Xuất sắc', evaluationBadge: 'xuat_sac', averageScore: 9.0 },
        { stt: 2, subjectName: 'Ngữ văn', subjectCode: 'VAN', ddgTx1: '8,5', ddgTx2: '8,5', ddgTx3: '8,5', ddgGk: '8,5', ddgCk: '8,5', diemTb: '8,5', scoreNumeric: 8.5, evaluation: 'Giỏi', evaluationBadge: 'gioi', averageScore: 8.5 },
        { stt: 3, subjectName: 'Tiếng Anh', subjectCode: 'ANH', ddgTx1: '9,0', ddgTx2: '9,5', ddgTx3: '9,0', ddgGk: '9,0', ddgCk: '9,0', diemTb: '9,1', scoreNumeric: 9.1, evaluation: 'Xuất sắc', evaluationBadge: 'xuat_sac', averageScore: 9.1 },
        { stt: 4, subjectName: 'Vật lý', subjectCode: 'LY', ddgTx1: '8,5', ddgTx2: '8,0', ddgTx3: '8,5', ddgGk: '8,5', ddgCk: '8,5', diemTb: '8,4', scoreNumeric: 8.4, evaluation: 'Giỏi', evaluationBadge: 'gioi', averageScore: 8.4 },
        { stt: 5, subjectName: 'Hóa học', subjectCode: 'HOA', ddgTx1: '8,5', ddgTx2: '9,0', ddgTx3: '8,5', ddgGk: '8,5', ddgCk: '8,5', diemTb: '8,6', scoreNumeric: 8.6, evaluation: 'Giỏi', evaluationBadge: 'gioi', averageScore: 8.6 },
        { stt: 6, subjectName: 'Sinh học', subjectCode: 'SINH', ddgTx1: '8,5', ddgTx2: '9,0', ddgTx3: '8,5', ddgGk: '8,5', ddgCk: '9,0', diemTb: '8,8', scoreNumeric: 8.8, evaluation: 'Giỏi', evaluationBadge: 'gioi', averageScore: 8.8 },
        { stt: 7, subjectName: 'Lịch sử', subjectCode: 'SU', ddgTx1: '8,5', ddgTx2: '8,5', ddgTx3: '8,0', ddgGk: '8,5', ddgCk: '8,5', diemTb: '8,4', scoreNumeric: 8.4, evaluation: 'Giỏi', evaluationBadge: 'gioi', averageScore: 8.4 },
        { stt: 8, subjectName: 'Địa lý', subjectCode: 'DIA', ddgTx1: '8,5', ddgTx2: '9,0', ddgTx3: '8,5', ddgGk: '8,5', ddgCk: '9,0', diemTb: '8,8', scoreNumeric: 8.8, evaluation: 'Giỏi', evaluationBadge: 'gioi', averageScore: 8.8 },
        { stt: 9, subjectName: 'Tin học', subjectCode: 'TIN', ddgTx1: '9,5', ddgTx2: '9,0', ddgTx3: '9,5', ddgGk: '9,5', ddgCk: '9,5', diemTb: '9,4', scoreNumeric: 9.4, evaluation: 'Xuất sắc', evaluationBadge: 'xuat_sac', averageScore: 9.4 },
        { stt: 10, subjectName: 'GDTC', subjectCode: 'GDTC', ddgTx1: 'Đ', ddgTx2: 'Đ', ddgTx3: 'Đ', ddgGk: 'Đ', ddgCk: 'Đ', diemTb: 'Đ', scoreNumeric: null, evaluation: 'Đạt', evaluationBadge: 'dat', averageScore: null }
      ],
      gpaHistory: [
        { termName: 'HK I (Lớp 10)', gpa: 8.1 },
        { termName: 'HK II (Lớp 10)', gpa: 8.3 },
        { termName: 'HK I (Lớp 11)', gpa: 8.5 }
      ],
      yearSummary: {
        academicYear: '2025 – 2026',
        className: '11A1',
        gradeLevel: 'Lớp 11',
        homeroomTeacher: 'Cô Phạm Minh Thư',
        overallYearGpa: 8.7,
        semester1Gpa: 8.6,
        semester2Gpa: 8.8,
        classRank: '2 / 42',
        gradeRank: '15 / 320',
        academicRank: 'Giỏi',
        conductRank: 'Tốt',
        titleAward: 'Học sinh Giỏi cấp Trường',
        promotionStatus: 'Được lên lớp thẳng',
        totalSubjects: 10,
        passRate: '100%',
        teacherFeedback: 'Học sinh Nguyễn Minh Anh có năng lực học tập vững vàng, tư duy nhạy bén và ý thức kỷ luật rất tốt. Đảm nhiệm vai trò Lớp phó học tập đầy trách nhiệm và gương mẫu.',
        subjects: []
      },
      progressionHistory
    };
  }

  // Grade 11 Semester I
  return {
    academicYear: normalizedYear,
    semester: sem,
    className: normalizedClass,
    gradeLevel: normalizedGrade,
    homeroomTeacher: normalizedTeacher,
    overallGpa: 8.6,
    classRank: '3 / 42',
    gradeRank: '18 / 320',
    totalSubjects: 10,
    passRate: '100%',
    academicRank: 'Giỏi',
    conductRank: 'Tốt',
    isPublished: true,
    subjects: [
      { stt: 1, subjectName: 'Toán', subjectCode: 'TOAN', ddgTx1: '8,5', ddgTx2: '9,0', ddgTx3: '8,0', ddgGk: '8,5', ddgCk: '9,0', diemTb: '8,7', scoreNumeric: 8.7, evaluation: 'Giỏi', evaluationBadge: 'gioi', averageScore: 8.7 },
      { stt: 2, subjectName: 'Ngữ văn', subjectCode: 'VAN', ddgTx1: '8,0', ddgTx2: '8,5', ddgTx3: '8,5', ddgGk: '8,0', ddgCk: '8,5', diemTb: '8,3', scoreNumeric: 8.3, evaluation: 'Giỏi', evaluationBadge: 'gioi', averageScore: 8.3 },
      { stt: 3, subjectName: 'Tiếng Anh', subjectCode: 'ANH', ddgTx1: '9,0', ddgTx2: '9,0', ddgTx3: '8,5', ddgGk: '8,5', ddgCk: '9,0', diemTb: '8,9', scoreNumeric: 8.9, evaluation: 'Giỏi', evaluationBadge: 'gioi', averageScore: 8.9 },
      { stt: 4, subjectName: 'Vật lý', subjectCode: 'LY', ddgTx1: '8,0', ddgTx2: '8,0', ddgTx3: '8,5', ddgGk: '8,0', ddgCk: '8,5', diemTb: '8,3', scoreNumeric: 8.3, evaluation: 'Giỏi', evaluationBadge: 'gioi', averageScore: 8.3 },
      { stt: 5, subjectName: 'Hóa học', subjectCode: 'HOA', ddgTx1: '8,5', ddgTx2: '8,5', ddgTx3: '8,0', ddgGk: '8,0', ddgCk: '8,5', diemTb: '8,3', scoreNumeric: 8.3, evaluation: 'Giỏi', evaluationBadge: 'gioi', averageScore: 8.3 },
      { stt: 6, subjectName: 'Sinh học', subjectCode: 'SINH', ddgTx1: '8,5', ddgTx2: '9,0', ddgTx3: '8,5', ddgGk: '8,5', ddgCk: '9,0', diemTb: '8,8', scoreNumeric: 8.8, evaluation: 'Giỏi', evaluationBadge: 'gioi', averageScore: 8.8 },
      { stt: 7, subjectName: 'Lịch sử', subjectCode: 'SU', ddgTx1: '8,0', ddgTx2: '8,5', ddgTx3: '8,0', ddgGk: '8,0', ddgCk: '8,5', diemTb: '8,2', scoreNumeric: 8.2, evaluation: 'Giỏi', evaluationBadge: 'gioi', averageScore: 8.2 },
      { stt: 8, subjectName: 'Địa lý', subjectCode: 'DIA', ddgTx1: '8,5', ddgTx2: '8,5', ddgTx3: '8,5', ddgGk: '8,0', ddgCk: '9,0', diemTb: '8,6', scoreNumeric: 8.6, evaluation: 'Giỏi', evaluationBadge: 'gioi', averageScore: 8.6 },
      { stt: 9, subjectName: 'Tin học', subjectCode: 'TIN', ddgTx1: '9,0', ddgTx2: '9,0', ddgTx3: '9,0', ddgGk: '9,0', ddgCk: '9,5', diemTb: '9,2', scoreNumeric: 9.2, evaluation: 'Xuất sắc', evaluationBadge: 'xuat_sac', averageScore: 9.2 },
      { stt: 10, subjectName: 'GDTC', subjectCode: 'GDTC', ddgTx1: 'Đ', ddgTx2: 'Đ', ddgTx3: 'Đ', ddgGk: 'Đ', ddgCk: 'Đ', diemTb: 'Đ', scoreNumeric: null, evaluation: 'Đạt', evaluationBadge: 'dat', averageScore: null }
    ],
    gpaHistory: [
      { termName: 'HK I (Lớp 10)', gpa: 8.1 },
      { termName: 'HK II (Lớp 10)', gpa: 8.3 },
      { termName: 'HK I (Lớp 11)', gpa: 8.5 }
    ],
    yearSummary: {
      academicYear: '2025 – 2026',
      className: '11A1',
      gradeLevel: 'Lớp 11',
      homeroomTeacher: 'Cô Phạm Minh Thư',
      overallYearGpa: 8.7,
      semester1Gpa: 8.6,
      semester2Gpa: 8.8,
      classRank: '2 / 42',
      gradeRank: '15 / 320',
      academicRank: 'Giỏi',
      conductRank: 'Tốt',
      titleAward: 'Học sinh Giỏi cấp Trường',
      promotionStatus: 'Được lên lớp thẳng',
      totalSubjects: 10,
      passRate: '100%',
      teacherFeedback: 'Học sinh Nguyễn Minh Anh có năng lực học tập vững vàng, tư duy nhạy bén và ý thức kỷ luật rất tốt. Đảm nhiệm vai trò Lớp phó học tập đầy trách nhiệm và gương mẫu.',
      subjects: []
    },
    progressionHistory
  };
}

export const StudentGradesPage: React.FC = () => {
  // Filter Dropdowns
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2025 – 2026');
  const [selectedSemester, setSelectedSemester] = useState('Học kỳ I');

  // Initial summary is computed immediately so there is never an empty state or stuck data
  const [summary, setSummary] = useState<StudentAcademicSummary>(() =>
    getAcademicData('2025 – 2026', 'Học kỳ I')
  );

  // Sub-tab: 'semester' (Kết quả học kỳ) | 'year' (Kết quả cả năm) | 'progression' (Quá trình học tập)
  const [activeTab, setActiveTab] = useState<'semester' | 'year' | 'progression'>('semester');

  useEffect(() => {
    let isCurrent = true;
    // 1. Immediately update UI with accurate corresponding dataset
    const immediateData = getAcademicData(selectedAcademicYear, selectedSemester);
    setSummary(immediateData);

    // 2. Concurrently fetch latest from backend
    const fetchGrades = async () => {
      try {
        const data = await studentApi.getGrades(selectedSemester, selectedAcademicYear);
        if (isCurrent && data && data.subjects && data.subjects.length > 0) {
          setSummary(data);
        }
      } catch (err) {
        console.error('Failed fetching grades from API', err);
      }
    };

    fetchGrades();
    return () => {
      isCurrent = false;
    };
  }, [selectedSemester, selectedAcademicYear]);

  const subjects: SubjectGrade[] = summary?.subjects || [];
  const chartSubjects = subjects.filter(s => s.scoreNumeric !== null && s.scoreNumeric !== undefined);
  const yearSummary: YearAcademicSummary | undefined = summary?.yearSummary;
  const progressionHistory: ProgressionRecord[] = summary?.progressionHistory || [];

  return (
    <div className="space-y-6">
      {/* 1. Header Banner matching screenshot */}
      <div className="bg-gradient-to-r from-blue-50/80 via-sky-50 to-blue-100/60 rounded-3xl border border-blue-100 shadow-2xs p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Icon A+ & Title */}
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-blue-500/20 relative">
            <span className="tracking-tight">A+</span>
            <div className="absolute -bottom-1 w-3 h-1.5 bg-blue-800 rounded-b-sm" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                Kết quả học tập
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                {summary?.gradeLevel || 'Lớp 11'} – Lớp {summary?.className || '11A1'}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                GVCN: {summary?.homeroomTeacher || 'Cô Phạm Minh Thư'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              Xem điểm số, kết quả học kỳ và quá trình học tập của bạn • Năm học {summary?.academicYear || selectedAcademicYear}
            </p>
          </div>
        </div>

        {/* Right: 2 Filter Dropdowns matching screenshot */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Year Dropdown */}
          <div className="relative inline-block">
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="appearance-none bg-white border border-slate-200 text-slate-800 text-xs sm:text-sm font-bold py-2.5 pl-9 pr-9 rounded-xl hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs cursor-pointer"
            >
              <option value="2025 – 2026">Năm học: 2025 – 2026 (Lớp 11)</option>
              <option value="2024 – 2025">Năm học: 2024 – 2025 (Lớp 10)</option>
              <option value="2026 – 2027">Năm học: 2026 – 2027 (Lớp 12)</option>
            </select>
            <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Semester Dropdown - active in semester tab or useful indicator */}
          <div className="relative inline-block">
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="appearance-none bg-white border border-slate-200 text-slate-800 text-xs sm:text-sm font-bold py-2.5 pl-9 pr-9 rounded-xl hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs cursor-pointer"
            >
              <option value="Học kỳ I">Học kỳ: Học kỳ I</option>
              <option value="Học kỳ II">Học kỳ: Học kỳ II</option>
            </select>
            <Layers className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 2. Sub-tabs View Selector matching screenshot */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
        <button
          onClick={() => setActiveTab('semester')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'semester'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Kết quả học kỳ</span>
        </button>

        <button
          onClick={() => setActiveTab('year')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'year'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Kết quả cả năm</span>
        </button>

        <button
          onClick={() => setActiveTab('progression')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'progression'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Quá trình học tập</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: KẾT QUẢ HỌC KỲ (MATCHING EXACT SCREENSHOT)                       */}
      {/* ========================================================================= */}
      {activeTab === 'semester' && (
        <div className="space-y-6">
          {/* Top 4 Summary Cards matching screenshot */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Điểm trung bình học kỳ */}
            <div className="bg-blue-50/40 border border-blue-100 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold">
                  Điểm trung bình học kỳ
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                  {summary?.overallGpa !== undefined && summary?.overallGpa !== null
                    ? summary.overallGpa.toFixed(1).replace('.', ',')
                    : '—'}
                </div>
              </div>
            </div>

            {/* Card 2: Xếp hạng lớp */}
            <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Medal className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold">
                  Xếp hạng lớp
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                  {summary?.classRank || '—'}
                </div>
              </div>
            </div>

            {/* Card 3: Học lực */}
            <div className="bg-amber-50/40 border border-amber-100 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <BarChart2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold">
                  Học lực
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                  {summary?.academicRank || '—'}
                </div>
              </div>
            </div>

            {/* Card 4: Số môn học */}
            <div className="bg-purple-50/40 border border-purple-100 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold">
                  Số môn học
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                  {summary?.totalSubjects || 10}
                </div>
              </div>
            </div>
          </div>

          {/* Main 2-Column Content Layout matching screenshot */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Bảng điểm chi tiết (8 Cols) */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm space-y-4 overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Table className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-base">
                    Bảng điểm chi tiết – {summary?.semester || selectedSemester}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {summary?.gradeLevel || 'Lớp 11'} ({summary?.className || '11A1'})
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    Năm học: <span className="font-semibold text-slate-700">{summary?.academicYear || selectedAcademicYear}</span>
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-700 font-bold bg-slate-50/70">
                      <th rowSpan={2} className="py-3 px-2 w-10 text-center">STT</th>
                      <th rowSpan={2} className="py-3 px-3 text-left min-w-[120px]">Môn học</th>
                      <th colSpan={3} className="py-2 px-2 text-center border-b border-slate-200 font-bold text-slate-700">
                        Kiểm tra thường xuyên <span className="text-[10px] font-normal text-slate-400">(HS 1)</span>
                      </th>
                      <th rowSpan={2} className="py-3 px-3 text-center font-bold">
                        <div>Giữa kỳ</div>
                        <div className="text-[10px] font-medium text-slate-400 mt-0.5">Hệ số 2</div>
                      </th>
                      <th rowSpan={2} className="py-3 px-3 text-center font-bold">
                        <div>Cuối kỳ</div>
                        <div className="text-[10px] font-medium text-slate-400 mt-0.5">Hệ số 3</div>
                      </th>
                      <th rowSpan={2} className="py-3 px-3 text-center font-black text-blue-700">
                        <div>Điểm TB</div>
                        <div className="text-[10px] font-medium text-blue-400 mt-0.5">Tổng kết</div>
                      </th>
                      <th rowSpan={2} className="py-3 px-3 text-center font-bold">Đánh giá</th>
                    </tr>
                    <tr className="border-b border-slate-200 text-slate-600 text-[11px] font-semibold bg-slate-50/40">
                      <th className="py-1.5 px-2 text-center w-14 font-medium" title="Kiểm tra thường xuyên lần 1 (miệng / 15 phút)">TX 1</th>
                      <th className="py-1.5 px-2 text-center w-14 font-medium" title="Kiểm tra thường xuyên lần 2 (15 phút / bài tập)">TX 2</th>
                      <th className="py-1.5 px-2 text-center w-14 font-medium" title="Kiểm tra thường xuyên lần 3 (kiểm tra ngắn)">TX 3</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subjects.map((item, idx) => {
                      const isExcellence = item.evaluationBadge === 'xuat_sac';
                      const isPass = item.evaluationBadge === 'dat';
                      const isGood = item.evaluationBadge === 'gioi' || (!isExcellence && !isPass);

                      return (
                        <tr key={idx} className="hover:bg-slate-50/60 transition-colors font-medium">
                          <td className="py-3.5 px-2 text-slate-500 text-center font-semibold">
                            {item.stt || idx + 1}
                          </td>
                          <td className="py-3.5 px-3 text-left font-bold text-slate-900 whitespace-nowrap">
                            {item.subjectName}
                          </td>
                          <td className="py-3.5 px-2 text-center font-mono font-medium text-slate-700">
                            {item.ddgTx1 || '—'}
                          </td>
                          <td className="py-3.5 px-2 text-center font-mono font-medium text-slate-700">
                            {item.ddgTx2 || '—'}
                          </td>
                          <td className="py-3.5 px-2 text-center font-mono font-medium text-slate-700">
                            {item.ddgTx3 || '—'}
                          </td>
                          <td className="py-3.5 px-2.5 text-center font-mono font-medium text-slate-700">
                            {item.ddgGk || '—'}
                          </td>
                          <td className="py-3.5 px-2.5 text-center font-mono font-medium text-slate-700">
                            {item.ddgCk || '—'}
                          </td>
                          <td className="py-3.5 px-2.5 text-center font-mono font-black text-blue-600 text-sm">
                            {item.diemTb || (item.averageScore ? item.averageScore.toFixed(1).replace('.', ',') : '—')}
                          </td>
                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            {isExcellence && (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                Xuất sắc
                              </span>
                            )}
                            {isGood && (
                              <span className="inline-block px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Giỏi
                              </span>
                            )}
                            {isPass && (
                              <span className="inline-block px-3 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                Đạt
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Giải thích chi tiết các cột điểm */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-600" /> Chú thích cột điểm:
                  </span>
                  <span><strong className="text-slate-700">TX 1, 2, 3:</strong> Kiểm tra thường xuyên (miệng, 15 phút - Hệ số 1)</span>
                  <span><strong className="text-slate-700">Giữa kỳ:</strong> Kiểm tra giữa kỳ (Hệ số 2)</span>
                  <span><strong className="text-slate-700">Cuối kỳ:</strong> Thi cuối kỳ (Hệ số 3)</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Thông tư 22/2021/TT-BGDĐT
                </div>
              </div>
            </div>

            {/* Right Column: 3 Stacked Cards (4 Cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Card 1: Tổng quan kết quả (Donut Ring) */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-base">
                    Tổng quan kết quả
                  </h3>
                </div>

                <div className="flex items-center gap-5 pt-1">
                  <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#F1F5F9"
                        strokeWidth="10"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#2563EB"
                        strokeWidth="10"
                        strokeDasharray={2 * Math.PI * 40}
                        strokeDashoffset={2 * Math.PI * 40 * (1 - (summary?.overallGpa || 8.6) / 10)}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-slate-900 tracking-tight">
                        {summary?.overallGpa !== undefined && summary?.overallGpa !== null
                          ? summary.overallGpa.toFixed(1).replace('.', ',')
                          : '—'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Điểm TB
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs font-semibold text-slate-700">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Học lực: <strong className="text-slate-900 font-bold">{summary?.academicRank || '—'}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Xếp hạng lớp: <strong className="text-slate-900 font-bold">{summary?.classRank || '—'}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500 shrink-0" />
                      <span>Xếp hạng khối: <strong className="text-slate-900 font-bold">{summary?.gradeRank || '—'}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-purple-500 shrink-0" />
                      <span>Tỷ lệ đạt môn: <strong className="text-slate-900 font-bold">{summary?.passRate || '100%'}</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Điểm trung bình theo môn (Bar Chart SVG) */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <BarChart2 className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-base">
                    Điểm trung bình theo môn
                  </h3>
                </div>

                <div className="w-full h-44 pt-2">
                  <svg className="w-full h-full" viewBox="0 0 320 130">
                    <defs>
                      <linearGradient id="gradeBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.4" />
                      </linearGradient>
                    </defs>
                    {[0, 2, 4, 6, 8, 10].map((val) => {
                      const y = 110 - (val / 10) * 100;
                      return (
                        <g key={val}>
                          <line x1="26" y1={y} x2="315" y2={y} stroke="#F1F5F9" strokeWidth="1" />
                          <text x="20" y={y + 3} textAnchor="end" className="text-[9px] fill-slate-400 font-mono">
                            {val === 10 ? '10,0' : val === 0 ? '0' : `${val},0`}
                          </text>
                        </g>
                      );
                    })}

                    {chartSubjects.map((s, idx) => {
                      const totalBars = chartSubjects.length;
                      const barWidth = 16;
                      const availableWidth = 315 - 32;
                      const spacing = availableWidth / totalBars;
                      const x = 32 + idx * spacing + (spacing - barWidth) / 2;
                      const score = s.scoreNumeric || 8.0;
                      const barHeight = Math.max(8, (score / 10) * 100);
                      const y = 110 - barHeight;

                      const shortNames: Record<string, string> = {
                        'Toán': 'Toán',
                        'Ngữ văn': 'Văn',
                        'Tiếng Anh': 'Anh',
                        'Vật lý': 'Lý',
                        'Hóa học': 'Hóa',
                        'Sinh học': 'Sinh',
                        'Lịch sử': 'Sử',
                        'Địa lý': 'Địa',
                        'Tin học': 'Tin'
                      };
                      const shortLabel = shortNames[s.subjectName] || s.subjectName.substring(0, 3);

                      return (
                        <g key={s.subjectCode || idx}>
                          <rect
                            x={x}
                            y={y}
                            width={barWidth}
                            height={barHeight}
                            rx="3"
                            fill="url(#gradeBarGrad)"
                            className="hover:opacity-80 transition-opacity"
                          />
                          <text
                            x={x + barWidth / 2}
                            y={y - 3}
                            textAnchor="middle"
                            className="text-[9px] font-black fill-slate-700 font-mono"
                          >
                            {score.toFixed(1).replace('.', ',')}
                          </text>
                          <text
                            x={x + barWidth / 2}
                            y="124"
                            textAnchor="middle"
                            className="text-[9px] font-bold fill-slate-600"
                          >
                            {shortLabel}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Card 3: Biến động điểm trung bình (Line Chart SVG) */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-base">
                    Biến động điểm trung bình
                  </h3>
                </div>

                <div className="w-full h-44 pt-2">
                  <svg className="w-full h-full" viewBox="0 0 320 130">
                    <defs>
                      <linearGradient id="gradeLineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {[6, 7, 8, 9, 10].map((val) => {
                      const y = 105 - ((val - 6) / 4) * 85;
                      return (
                        <g key={val}>
                          <line x1="26" y1={y} x2="315" y2={y} stroke="#F1F5F9" strokeWidth="1" />
                          <text x="20" y={y + 3} textAnchor="end" className="text-[9px] fill-slate-400 font-mono">
                            {val === 10 ? '10,0' : `${val},0`}
                          </text>
                        </g>
                      );
                    })}

                    {(() => {
                      const history = (summary?.gpaHistory && summary.gpaHistory.length > 0)
                        ? summary.gpaHistory
                        : [
                            { termName: 'HK I (Lớp 10)', gpa: 8.1 },
                            { termName: 'HK II (Lớp 10)', gpa: 8.3 },
                            { termName: 'HK I (Lớp 11)', gpa: 8.5 }
                          ];

                      const xPos = [75, 175, 275];
                      const points = history.slice(0, 3).map((item, idx) => {
                        const score = item.gpa;
                        const y = 105 - ((Math.max(6, Math.min(10, score)) - 6) / 4) * 85;
                        const parts = item.termName.split('(');
                        const term1 = parts[0]?.trim() || item.termName;
                        const term2 = parts[1] ? `(${parts[1]}` : '';
                        return {
                          x: xPos[idx] ?? (75 + idx * 100),
                          y,
                          label: score.toFixed(1).replace('.', ','),
                          term1,
                          term2
                        };
                      });

                      const pathD = points.reduce((acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`), '');
                      const areaD = `${pathD} L ${points[points.length - 1].x} 105 L ${points[0].x} 105 Z`;

                      return (
                        <g>
                          <path d={areaD} fill="url(#gradeLineGrad)" />
                          <path d={pathD} fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          {points.map((pt, i) => (
                            <g key={i}>
                              <circle cx={pt.x} cy={pt.y} r="4" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
                              <text x={pt.x} y={pt.y - 7} textAnchor="middle" className="text-[10px] font-black fill-slate-800 font-mono">
                                {pt.label}
                              </text>
                              <text x={pt.x} y="117" textAnchor="middle" className="text-[9px] font-bold fill-slate-700">
                                {pt.term1}
                              </text>
                              <text x={pt.x} y="126" textAnchor="middle" className="text-[8px] font-medium fill-slate-400">
                                {pt.term2}
                              </text>
                            </g>
                          ))}
                        </g>
                      );
                    })()}
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: KẾT QUẢ CẢ NĂM (FULL ACADEMIC YEAR COMPREHENSIVE VIEW)           */}
      {/* ========================================================================= */}
      {activeTab === 'year' && (
        <div className="space-y-6">
          {/* Top 4 KPI Cards for Full Year */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Điểm TB Cả năm */}
            <div className="bg-blue-50/40 border border-blue-100 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold">
                  Điểm trung bình cả năm
                </div>
                <div className="text-2xl sm:text-3xl font-black text-blue-700 tracking-tight mt-0.5">
                  {yearSummary?.overallYearGpa.toFixed(1).replace('.', ',') || '8,7'}
                </div>
              </div>
            </div>

            {/* Card 2: Xếp hạng cả năm */}
            <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Medal className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold">
                  Xếp hạng lớp cả năm
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight mt-0.5">
                  {yearSummary?.classRank || '2 / 42'}
                </div>
              </div>
            </div>

            {/* Card 3: Học lực cả năm */}
            <div className="bg-amber-50/40 border border-amber-100 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold">
                  Học lực & Rèn luyện
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-800 tracking-tight mt-0.5">
                  {yearSummary?.academicRank || 'Giỏi'} <span className="text-xs font-semibold text-slate-500">({yearSummary?.conductRank || 'Tốt'})</span>
                </div>
              </div>
            </div>

            {/* Card 4: Danh hiệu thi đua */}
            <div className="bg-purple-50/40 border border-purple-100 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold">
                  Danh hiệu thi đua
                </div>
                <div className="text-lg sm:text-xl font-black text-purple-700 tracking-tight mt-0.5 truncate">
                  {yearSummary?.titleAward || 'Học sinh Giỏi'}
                </div>
              </div>
            </div>
          </div>

          {/* 2-Column Main Content for Year View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Bảng tổng kết môn học cả năm (8 Cols) */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Table className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-base">
                    Bảng tổng kết môn học cả năm – {yearSummary?.gradeLevel || summary?.gradeLevel || 'Lớp 11'} ({yearSummary?.className || summary?.className || '11A1'}) • {summary?.academicYear || selectedAcademicYear}
                  </h3>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Thông tư 22/2021/TT-BGDĐT
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-700 font-bold bg-slate-50/60">
                      <th className="py-3 px-2 w-10 text-center">STT</th>
                      <th className="py-3 px-3 text-left min-w-[120px]">Môn học</th>
                      <th className="py-3 px-3 text-center">ĐTB HK I</th>
                      <th className="py-3 px-3 text-center">ĐTB HK II</th>
                      <th className="py-3 px-3 text-center font-black text-blue-700">ĐTB Cả năm</th>
                      <th className="py-3 px-3 text-center">Biến động</th>
                      <th className="py-3 px-3 text-center">Đánh giá cả năm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {(yearSummary?.subjects || []).map((sub: YearSubjectGrade, idx: number) => {
                      const isUp = sub.trend === 'up';
                      const isDown = sub.trend === 'down';
                      const isExcellence = sub.evaluationBadge === 'xuat_sac';
                      const isPass = sub.evaluationBadge === 'dat';

                      return (
                        <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-2 text-slate-500 font-semibold">{sub.stt || idx + 1}</td>
                          <td className="py-3.5 px-3 text-left font-bold text-slate-900 whitespace-nowrap">{sub.subjectName}</td>
                          <td className="py-3.5 px-3 font-mono text-slate-700">{sub.semester1Gpa}</td>
                          <td className="py-3.5 px-3 font-mono text-slate-700">{sub.semester2Gpa}</td>
                          <td className="py-3.5 px-3 font-mono font-black text-blue-600 text-sm">{sub.yearGpa}</td>
                          <td className="py-3.5 px-3">
                            {isUp && (
                              <span className="inline-flex items-center gap-1 text-emerald-600 font-bold font-mono text-xs">
                                <ArrowUpRight className="w-3.5 h-3.5" />
                                {sub.trendDiff}
                              </span>
                            )}
                            {isDown && (
                              <span className="inline-flex items-center gap-1 text-rose-600 font-bold font-mono text-xs">
                                <ArrowDownRight className="w-3.5 h-3.5" />
                                {sub.trendDiff}
                              </span>
                            )}
                            {!isUp && !isDown && (
                              <span className="inline-flex items-center gap-1 text-slate-400 font-medium font-mono text-xs">
                                <Minus className="w-3.5 h-3.5" />
                                {sub.trendDiff}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-3">
                            {isExcellence && (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                Xuất sắc
                              </span>
                            )}
                            {isPass && (
                              <span className="inline-block px-3 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                Đạt
                              </span>
                            )}
                            {!isExcellence && !isPass && (
                              <span className="inline-block px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Giỏi
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Year Summary Footnote */}
              <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 flex items-center justify-between">
                <span>Điểm trung bình môn cả năm được tính theo hệ số chuẩn của Bộ Giáo dục & Đào tạo.</span>
                <span className="font-bold text-slate-900">Số môn đánh giá: {yearSummary?.totalSubjects || 10}</span>
              </div>
            </div>

            {/* Right Column: Year Review & Insights (4 Cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Card 1: Xếp loại thi đua & Lên lớp */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-slate-900 text-base">
                    Tổng kết thi đua & Lên lớp
                  </h3>
                </div>

                <div className="bg-gradient-to-br from-amber-50/60 to-yellow-50/40 border border-amber-200/80 rounded-2xl p-4 text-center space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shadow-xs">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                    Danh hiệu thi đua cả năm
                  </div>
                  <div className="text-xl font-black text-slate-900">
                    {yearSummary?.titleAward || 'Học sinh Giỏi cấp Trường'}
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{yearSummary?.promotionStatus || 'Được lên lớp thẳng'}</span>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2 text-xs font-semibold text-slate-700">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">ĐTB Học kỳ I:</span>
                    <strong className="text-slate-900 font-mono text-sm">{yearSummary?.semester1Gpa.toFixed(1).replace('.', ',')}</strong>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">ĐTB Học kỳ II:</span>
                    <strong className="text-slate-900 font-mono text-sm">{yearSummary?.semester2Gpa.toFixed(1).replace('.', ',')}</strong>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Xếp hạng khối toàn trường:</span>
                    <strong className="text-slate-900 font-mono text-sm">{yearSummary?.gradeRank || '15 / 320'}</strong>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-slate-500">Tỷ lệ hoàn thành môn:</span>
                    <strong className="text-emerald-600 font-mono text-sm">{yearSummary?.passRate || '100%'}</strong>
                  </div>
                </div>
              </div>

              {/* Card 2: Biểu đồ đối chiếu HK I & HK II (SVG Dual-Bar Chart) */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-slate-900 text-base">
                      Đối chiếu HK I & HK II
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-bold">
                    <span className="flex items-center gap-1 text-blue-600">
                      <span className="w-2.5 h-2.5 rounded-xs bg-blue-500 inline-block" /> HK I
                    </span>
                    <span className="flex items-center gap-1 text-purple-600">
                      <span className="w-2.5 h-2.5 rounded-xs bg-purple-500 inline-block" /> HK II
                    </span>
                  </div>
                </div>

                <div className="w-full h-44 pt-2">
                  <svg className="w-full h-full" viewBox="0 0 320 130">
                    {[0, 5, 10].map(v => {
                      const y = 110 - (v / 10) * 100;
                      return (
                        <g key={v}>
                          <line x1="26" y1={y} x2="315" y2={y} stroke="#F1F5F9" strokeWidth="1" />
                          <text x="20" y={y + 3} textAnchor="end" className="text-[9px] fill-slate-400 font-mono">
                            {v === 0 ? '0' : `${v},0`}
                          </text>
                        </g>
                      );
                    })}

                    {(yearSummary?.subjects || [])
                      .filter(s => s.semester1Numeric && s.semester2Numeric)
                      .slice(0, 7)
                      .map((s, idx) => {
                        const totalGroups = 7;
                        const groupWidth = 36;
                        const spacing = (315 - 32) / totalGroups;
                        const gx = 32 + idx * spacing + (spacing - groupWidth) / 2;

                        const s1 = s.semester1Numeric || 8.0;
                        const s2 = s.semester2Numeric || 8.0;

                        const h1 = (s1 / 10) * 100;
                        const h2 = (s2 / 10) * 100;

                        const y1 = 110 - h1;
                        const y2 = 110 - h2;

                        const shortNames: Record<string, string> = {
                          'Toán': 'Toán',
                          'Ngữ văn': 'Văn',
                          'Tiếng Anh': 'Anh',
                          'Vật lý': 'Lý',
                          'Hóa học': 'Hóa',
                          'Sinh học': 'Sinh',
                          'Lịch sử': 'Sử'
                        };

                        return (
                          <g key={idx}>
                            <rect x={gx} y={y1} width="12" height={h1} rx="2" fill="#3B82F6" />
                            <rect x={gx + 14} y={y2} width="12" height={h2} rx="2" fill="#8B5CF6" />
                            <text x={gx + 13} y="124" textAnchor="middle" className="text-[9px] font-bold fill-slate-600">
                              {shortNames[s.subjectName] || s.subjectName.substring(0, 3)}
                            </text>
                          </g>
                        );
                      })}
                  </svg>
                </div>
              </div>

              {/* Card 3: Nhận xét của Giáo viên chủ nhiệm */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Quote className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-base">
                    Nhận xét của Giáo viên chủ nhiệm
                  </h3>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                    PT
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Cô Phạm Minh Thư</div>
                    <div className="text-[11px] text-slate-500">Giáo viên chủ nhiệm Lớp 11A1</div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 italic bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed">
                  "{yearSummary?.teacherFeedback || 'Học sinh có ý thức tự giác cao, tư duy logic tốt và luôn tích cực tham gia xây dựng bài. Hoàn thành xuất sắc nhiệm vụ Lớp phó học tập.'}"
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: QUÁ TRÌNH HỌC TẬP (MULTI-YEAR PROGRESSION & ACADEMIC HISTORY)     */}
      {/* ========================================================================= */}
      {activeTab === 'progression' && (
        <div className="space-y-6">
          {/* Top 4 KPI Cards for Progression */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Thời gian đào tạo */}
            <div className="bg-blue-50/40 border border-blue-100 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold">
                  Quá trình theo học
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                  3 năm
                </div>
              </div>
            </div>

            {/* Card 2: ĐTB tích lũy */}
            <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold">
                  ĐTB tích lũy hiện tại
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight mt-0.5">
                  8,6
                </div>
              </div>
            </div>

            {/* Card 3: Tổng số danh hiệu */}
            <div className="bg-amber-50/40 border border-amber-100 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold">
                  Danh hiệu & Khen thưởng
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-700 tracking-tight mt-0.5">
                  3 danh hiệu
                </div>
              </div>
            </div>

            {/* Card 4: Tỷ lệ hoàn thành */}
            <div className="bg-purple-50/40 border border-purple-100 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold">
                  Tỷ lệ hoàn thành chương trình
                </div>
                <div className="text-2xl sm:text-3xl font-black text-purple-700 tracking-tight mt-0.5">
                  100%
                </div>
              </div>
            </div>
          </div>

          {/* Full-width Multi-year Progression Trend Chart */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Biểu đồ tăng trưởng kết quả học tập qua các năm học
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Thang điểm 10.0 • Xu hướng phát triển tích cực
              </span>
            </div>

            <div className="w-full h-56 pt-2">
              <svg className="w-full h-full" viewBox="0 0 600 160">
                <defs>
                  <linearGradient id="progressionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {[7, 8, 9, 10].map((v) => {
                  const y = 130 - ((v - 7) / 3) * 100;
                  return (
                    <g key={v}>
                      <line x1="40" y1={y} x2="580" y2={y} stroke="#F1F5F9" strokeWidth="1" />
                      <text x="32" y={y + 3} textAnchor="end" className="text-[10px] fill-slate-400 font-mono">
                        {v === 10 ? '10,0' : `${v},0`}
                      </text>
                    </g>
                  );
                })}

                {(() => {
                  const dataPoints = [
                    { x: 70, y: 130 - ((8.1 - 7) / 3) * 100, label: '8,1', term: 'HK I (Lớp 10)', status: 'Giỏi' },
                    { x: 190, y: 130 - ((8.3 - 7) / 3) * 100, label: '8,3', term: 'HK II (Lớp 10)', status: 'Giỏi' },
                    { x: 310, y: 130 - ((8.6 - 7) / 3) * 100, label: '8,6', term: 'HK I (Lớp 11)', status: 'Giỏi' },
                    { x: 430, y: 130 - ((8.8 - 7) / 3) * 100, label: '8,8', term: 'HK II (Lớp 11)', status: 'Giỏi' },
                    { x: 540, y: 130 - ((9.0 - 7) / 3) * 100, label: '9,0', term: 'Mục tiêu (Lớp 12)', status: 'Xuất sắc' }
                  ];

                  const lineD = dataPoints.reduce((acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`), '');
                  const fillD = `${lineD} L ${dataPoints[dataPoints.length - 1].x} 130 L ${dataPoints[0].x} 130 Z`;

                  return (
                    <g>
                      <path d={fillD} fill="url(#progressionGradient)" />
                      <path d={lineD} fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      {dataPoints.map((pt, i) => (
                        <g key={i}>
                          <circle cx={pt.x} cy={pt.y} r="5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2.5" />
                          <rect
                            x={pt.x - 18}
                            y={pt.y - 24}
                            width="36"
                            height="16"
                            rx="4"
                            fill="#1E293B"
                          />
                          <text
                            x={pt.x}
                            y={pt.y - 13}
                            textAnchor="middle"
                            className="text-[10px] font-black fill-white font-mono"
                          >
                            {pt.label}
                          </text>
                          <text
                            x={pt.x}
                            y="145"
                            textAnchor="middle"
                            className="text-[10px] font-bold fill-slate-700"
                          >
                            {pt.term}
                          </text>
                        </g>
                      ))}
                    </g>
                  );
                })()}
              </svg>
            </div>
          </div>

          {/* Cards for Each School Year in the Progression */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <School className="w-5 h-5 text-blue-600" />
              <span>Hồ sơ quá trình học tập theo từng năm học</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {progressionHistory.map((item: ProgressionRecord, idx: number) => {
                const isCurrent = item.status === 'in_progress';

                return (
                  <div
                    key={idx}
                    className={`rounded-2xl border p-5 shadow-xs space-y-4 transition-all ${
                      isCurrent
                        ? 'bg-blue-50/30 border-blue-200 ring-2 ring-blue-500/10'
                        : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    {/* Year Card Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                          Năm học {item.academicYear}
                        </div>
                        <h4 className="text-lg font-black text-slate-900 mt-0.5">
                          {item.grade} – {item.className}
                        </h4>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {item.schoolName}
                        </div>
                      </div>

                      {isCurrent ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          Đang học
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Đã hoàn thành
                        </span>
                      )}
                    </div>

                    {/* Performance Metrics Table */}
                    <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 space-y-2 text-xs">
                      <div className="grid grid-cols-3 text-center border-b border-slate-200/60 pb-2">
                        <div>
                          <div className="text-slate-400 text-[10px] font-semibold">HK I</div>
                          <div className="font-bold text-slate-900 font-mono text-sm mt-0.5">
                            {item.semester1Gpa ? item.semester1Gpa.toFixed(1).replace('.', ',') : '—'}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[10px] font-semibold">HK II</div>
                          <div className="font-bold text-slate-900 font-mono text-sm mt-0.5">
                            {item.semester2Gpa ? item.semester2Gpa.toFixed(1).replace('.', ',') : '—'}
                          </div>
                        </div>
                        <div>
                          <div className="text-blue-600 text-[10px] font-bold">CẢ NĂM</div>
                          <div className="font-black text-blue-700 font-mono text-sm mt-0.5">
                            {item.yearGpa.toFixed(1).replace('.', ',')}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1 text-slate-600 font-medium">
                        <div className="flex justify-between">
                          <span>Học lực:</span>
                          <strong className="text-slate-900 font-bold">{item.academicRank}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Rèn luyện:</span>
                          <strong className="text-slate-900 font-bold">{item.conductRank}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Xếp hạng:</span>
                          <strong className="text-slate-900 font-bold">{item.classRank}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Award & Recognition */}
                    {item.awardTitle && (
                      <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2">
                        <Trophy className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span className="font-bold leading-tight">{item.awardTitle}</span>
                      </div>
                    )}

                    {/* Teacher's Comment */}
                    <div className="text-xs text-slate-600 pt-1 border-t border-slate-100">
                      <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                        <span>GVCN: {item.homeroomTeacher}</span>
                      </div>
                      <p className="italic bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px] leading-relaxed">
                        "{item.teacherComment}"
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. Footer Notice matching screenshot */}
      <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
          <Info className="w-4 h-4" />
        </div>
        <div className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
          <strong className="text-slate-900">Lưu ý:</strong> Điểm số được hiển thị là kết quả đã được giáo viên công bố trên hệ thống. Nếu có thắc mắc, vui lòng liên hệ giáo viên bộ môn hoặc giáo viên chủ nhiệm.
        </div>
      </div>
    </div>
  );
};
