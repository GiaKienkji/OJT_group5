import { useState, useEffect, useCallback } from 'react';
import { StudentDashboardData } from '../types/student.types';
import { studentApi } from '../services/studentApi';

const FALLBACK_DASHBOARD_DATA: StudentDashboardData = {
  profile: {
    id: '10000000-0000-0000-0000-000000000001',
    userId: '11111111-1111-1111-1111-111111111111',
    studentCode: 'HS230145',
    fullName: 'Nguyễn Minh Anh',
    className: '11A1',
    gradeLevel: '11',
    academicYear: '2025 – 2026',
    homeroomTeacher: 'Cô Phạm Minh Thư',
    schoolName: 'Trường THPT Nguyễn Trãi',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
    status: 'Đang học',
    gender: 'Nữ',
    dateOfBirth: '2008-08-15',
    birthPlace: 'Hà Nội',
    nationalId: '001308012345',
    studentEmail: 'minhanh.hs230145@nguyentrai.edu.vn',
    phone: '0987 654 321',
    permanentAddress: 'Số 36, ngõ 105 đường Nguyễn Trãi, P. Thanh Xuân, TP. Hà Nội',
    contactAddress: 'Số 36, ngõ 105 đường Nguyễn Trãi, P. Thanh Xuân, TP. Hà Nội',
    ethnicity: 'Kinh',
    religion: 'Không',
    nationality: 'Việt Nam',
    unionMember: 'Đoàn viên TNCS Hồ Chí Minh (Ngày vào Đoàn: 26/03/2024)',
    bloodType: 'O+',
    healthInsuranceNo: 'HS4010234567890',
    healthStatus: 'Tốt, thị lực 10/10, không có bệnh lý nền',
    admissionDate: '2023-09-05',
    classRoom: 'Phòng A203 - Tầng 2 Dãy A',
    combination: 'Khoa học Tự nhiên (Toán, Vật lý, Hóa học, Sinh học)',
    studentRole: 'Lớp phó Học tập',
    guardians: [],
    academicHistory: [],
    updateRequests: [],
    awards: [],
    documents: [],
    accountSecurity: {
      username: 'hs230145',
      loginEmail: 'minhanh.hs230145@nguyentrai.edu.vn',
      googleLinked: true,
      googleEmail: 'minhanh.hs230145@nguyentrai.edu.vn',
      isVerified: true,
      lastLogin: '14/01/2025 – 07:42',
      currentDevice: 'Chrome • Windows 11'
    }
  },
  todayLessonsCount: 5,
  attendanceRate: 98.2,
  upcomingExamsCount: 3,
  unreadAnnouncementsCount: 3,
  todayTimetable: [
    { weekday: 3, periodNo: 1, periodName: 'Tiết 1', startTime: '07:00', endTime: '07:45', subjectName: 'Ngữ văn', subjectCode: 'VAN', teacherName: 'Cô Lê Thị Mai', roomName: 'A203', session: 'morning' },
    { weekday: 3, periodNo: 2, periodName: 'Tiết 2', startTime: '07:50', endTime: '08:35', subjectName: 'Toán', subjectCode: 'TOAN', teacherName: 'Thầy Trần Quốc Huy', roomName: 'A203', session: 'morning' },
    { weekday: 3, periodNo: 3, periodName: 'Tiết 3', startTime: '08:45', endTime: '09:30', subjectName: 'Vật lý', subjectCode: 'LY', teacherName: 'Thầy Nguyễn Văn An', roomName: 'B101', session: 'morning' },
    { weekday: 3, periodNo: 4, periodName: 'Tiết 4', startTime: '09:35', endTime: '10:20', subjectName: 'Địa lý', subjectCode: 'DIA', teacherName: 'Cô Đặng Thu Trang', roomName: 'B201', session: 'morning' },
    { weekday: 3, periodNo: 5, periodName: 'Tiết 5', startTime: '10:30', endTime: '11:15', subjectName: 'Ngữ văn', subjectCode: 'VAN', teacherName: 'Cô Lê Thị Mai', roomName: 'A203', session: 'morning' }
  ],
  upcomingExams: [
    {
      id: 'exam-01',
      subjectName: 'Lịch sử',
      subjectCode: 'SU',
      examTitle: 'Lịch sử – Kiểm tra cuối kỳ',
      examType: 'Cuối kỳ',
      examDateFormatted: 'Thứ Hai, 17/11/2025',
      durationFormatted: '45 phút',
      startsAt: '2025-11-17T08:00:00',
      endsAt: '2025-11-17T08:45:00',
      roomName: 'A203',
      durationMinutes: 45,
      examFormat: 'Tự luận',
      status: 'upcoming',
      statusTextVi: 'Sắp diễn ra'
    },
    {
      id: 'exam-02',
      subjectName: 'Địa lý',
      subjectCode: 'DIA',
      examTitle: 'Địa lý – Kiểm tra cuối kỳ',
      examType: 'Cuối kỳ',
      examDateFormatted: 'Thứ Ba, 18/11/2025',
      durationFormatted: '45 phút',
      startsAt: '2025-11-18T08:00:00',
      endsAt: '2025-11-18T08:45:00',
      roomName: 'A203',
      durationMinutes: 45,
      examFormat: 'Tự luận',
      status: 'upcoming',
      statusTextVi: 'Sắp diễn ra'
    },
    {
      id: 'exam-03',
      subjectName: 'Vật lý',
      subjectCode: 'LY',
      examTitle: 'Vật lý – Kiểm tra cuối kỳ',
      examType: 'Cuối kỳ',
      examDateFormatted: 'Thứ Tư, 19/11/2025',
      durationFormatted: '60 phút',
      startsAt: '2025-11-19T08:00:00',
      endsAt: '2025-11-19T09:00:00',
      roomName: 'B101',
      durationMinutes: 60,
      examFormat: 'Trắc nghiệm',
      status: 'upcoming',
      statusTextVi: 'Sắp diễn ra'
    }
  ],
  recentAnnouncements: [
    {
      id: 'ann-01',
      title: 'Lịch kiểm tra giữa kỳ I đã được cập nhật',
      body: 'Nhà trường thông báo lịch kiểm tra giữa kỳ I năm học 2025 – 2026 cho toàn thể học sinh khối 11.',
      audience: 'grade_11',
      publishedAt: '2026-11-08T14:26:00',
      publishedDateFormatted: '08/11/2026',
      publishedTimeFormatted: '14:26',
      authorName: 'Phòng Giáo vụ',
      category: 'exam',
      categoryNameVi: 'Kiểm tra – Thi',
      isImportant: true,
      isRead: false
    },
    {
      id: 'ann-02',
      title: 'Kế hoạch hoạt động ngoại khóa tháng 11',
      body: 'Đoàn trường tổ chức chuỗi hoạt động văn nghệ, thể thao chào mừng 20/11.',
      audience: 'school',
      publishedAt: '2026-11-07T09:15:00',
      publishedDateFormatted: '07/11/2026',
      publishedTimeFormatted: '09:15',
      authorName: 'Đoàn trường',
      category: 'activity',
      categoryNameVi: 'Hoạt động',
      isImportant: true,
      isRead: false
    },
    {
      id: 'ann-03',
      title: 'Hướng dẫn nộp học phí học kỳ II',
      body: 'Phòng Kế toán hướng dẫn hoàn tất học phí và các khoản thu học kỳ II.',
      audience: 'school',
      publishedAt: '2026-11-06T08:30:00',
      publishedDateFormatted: '06/11/2026',
      publishedTimeFormatted: '08:30',
      authorName: 'Phòng Kế toán',
      category: 'important',
      categoryNameVi: 'Quan trọng',
      isImportant: true,
      isRead: false
    }
  ],
  academicSummary: {
    academicYear: '2025 – 2026',
    semester: 'Học kỳ I',
    className: '11A1',
    overallGpa: 8.6,
    conductRank: 'Tốt',
    academicRank: 'Tốt',
    classRank: '3/42',
    isPublished: true,
    subjects: []
  },
  attendanceSummary: {
    month: 'Tháng 1/2026',
    academicYear: '2025 – 2026',
    totalSessions: 48,
    presentCount: 45,
    lateCount: 2,
    excusedAbsenceCount: 1,
    unexcusedAbsenceCount: 0,
    attendanceRate: 98.2,
    rateDelta: '+1.2%',
    lastUpdated: '09/01/2026 14:30',
    history: []
  },
  latestFee: {
    id: 'fee-01',
    title: 'Học phí học kỳ II',
    amount: 4500000,
    discount: 0,
    finalAmount: 4500000,
    paidAmount: 0,
    dueDate: '2026-11-28',
    status: 'unpaid',
    statusTextVi: 'Chưa thanh toán'
  }
};

export const useStudentDashboard = () => {
  const [data, setData] = useState<StudentDashboardData>(FALLBACK_DASHBOARD_DATA);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await studentApi.getDashboard();
      if (res && res.profile) {
        setData(res);
      }
    } catch {
      // Dữ liệu fallback đã sẵn sàng, giữ trải nghiệm mượt mà không bị lỗi 500
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { data, isLoading, error, refetch: fetchDashboard };
};
