export interface StudentGuardian {
  relationship: string; // Cha, Mẹ, Người giám hộ
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  occupation?: string;
  isPrimaryContact: boolean;
}

export interface AcademicHistoryItem {
  academicYear: string;
  className: string;
  schoolName: string;
  status: string; // Hoàn thành, Đang học
  gpa?: number;
  academicRank?: string;
  conductRank?: string;
  notes?: string;
}

export interface ProfileUpdateRequest {
  orderNo: number;
  requestContent: string;
  submittedAt: string;
  status: 'approved' | 'pending' | 'rejected';
  statusTextVi: string;
  reviewedBy?: string;
  note?: string;
}

export interface StudentAward {
  title: string;
  academicYear: string;
  issuer: string;
  type: 'award' | 'commendation';
  dateAchieved: string;
}

export interface StudentDocument {
  documentName: string;
  documentType: string;
  verifiedDate: string;
  status: 'verified' | 'pending';
  fileSize: string;
  fileUrl: string;
}

export interface StudentAccountSecurity {
  username: string;
  loginEmail: string;
  googleLinked: boolean;
  googleEmail: string;
  isVerified: boolean;
  lastLogin: string;
  currentDevice: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  studentCode: string;
  fullName: string;
  dateOfBirth?: string;
  gender: string;
  status: string;
  className: string;
  gradeLevel: string;
  academicYear: string;
  homeroomTeacher: string;
  email?: string;
  phone?: string;
  address?: string;
  schoolName: string;
  avatarUrl?: string;

  // Detailed identity & personal
  birthPlace?: string;
  nationalId?: string;
  permanentAddress?: string;
  contactAddress?: string;
  studentEmail?: string;
  ethnicity?: string;
  religion?: string;
  nationality?: string;
  unionMember?: string;
  bloodType?: string;
  healthInsuranceNo?: string;
  healthStatus?: string;

  // Academic specifics
  admissionDate?: string;
  classRoom?: string;
  combination?: string;
  studentRole?: string;

  // Sub-sections
  guardians?: StudentGuardian[];
  academicHistory?: AcademicHistoryItem[];
  updateRequests?: ProfileUpdateRequest[];
  awards?: StudentAward[];
  documents?: StudentDocument[];
  accountSecurity?: StudentAccountSecurity;
}

export interface CreateProfileUpdateRequestPayload {
  requestCategory: string;
  requestContent: string;
  reason: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateStudentContactPayload {
  phone?: string;
  contactAddress?: string;
  studentEmail?: string;
}

export interface TimetableItem {
  periodNo: number;
  periodName: string;
  startTime: string;
  endTime: string;
  subjectName: string;
  subjectCode: string;
  teacherName: string;
  roomName: string;
  weekday: number; // 2 = Thứ Hai, 7 = Thứ Bảy
  isSubstitute?: boolean;
  substituteTeacherName?: string;
  note?: string;
  session?: 'morning' | 'afternoon';
}

export interface TimetableChangeNotification {
  id: string;
  title: string;
  type: 'substitute' | 'room_change';
  badgeText: string;
  description: string;
  detail: string;
  effectiveDate: string;
}

export interface AttendanceRecordItem {
  id: string;
  date: string;
  sessionName: string;
  subjectName: string;
  status: 'present' | 'excused' | 'unexcused' | 'late';
  statusTextVi: string;
  note?: string;
}

export interface AttendanceDailyDetail {
  dateFormatted: string;
  dayOfWeek: string;
  periodRange: string;
  subjectList: string;
  status: 'present' | 'late' | 'excused' | 'unexcused';
  statusTextVi: string;
  note?: string;
}

export interface AttendanceMonthlyTrend {
  monthName: string;
  presentRate: number;
  lateRate: number;
  absentRate: number;
}

export interface AttendanceWeeklyBreakdown {
  weekName: string;
  totalSessions: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  rate: number;
}

export interface TermSummary {
  totalSessions: number;
  presentCount: number;
  presentRate: number;
  lateCount: number;
  lateRate: number;
  absentCount: number;
  absentRate: number;
}

export interface AttendanceSummary {
  totalSessions: number;
  presentCount: number;
  excusedAbsenceCount: number;
  unexcusedAbsenceCount: number;
  lateCount: number;
  attendanceRate: number;
  rateDelta?: string;
  month?: string;
  academicYear?: string;
  lastUpdated?: string;
  history: AttendanceRecordItem[];
  dailyDetails?: AttendanceDailyDetail[];
  monthlyTrends?: AttendanceMonthlyTrend[];
  weeklyBreakdowns?: AttendanceWeeklyBreakdown[];
  semesterSummary?: TermSummary;
}

export interface SubjectGrade {
  stt?: number;
  subjectName: string;
  subjectCode: string;
  ddgTx1?: string;
  ddgTx2?: string;
  ddgTx3?: string;
  ddgGk?: string;
  ddgCk?: string;
  diemTb?: string;
  scoreNumeric?: number | null;
  evaluation: string;
  evaluationBadge?: 'gioi' | 'xuat_sac' | 'dat' | 'chua_dat';
  oralScores?: number[];
  quizScores?: number[];
  midtermScores?: number[];
  finalScores?: number[];
  averageScore?: number | null;
  teacherFeedback?: string;
}

export interface GpaHistoryItem {
  termName: string;
  gpa: number;
}

export interface YearSubjectGrade {
  stt: number;
  subjectName: string;
  subjectCode: string;
  semester1Gpa: string;
  semester2Gpa: string;
  yearGpa: string;
  semester1Numeric?: number | null;
  semester2Numeric?: number | null;
  yearNumeric?: number | null;
  trend: 'up' | 'down' | 'stable';
  trendDiff: string;
  evaluation: string;
  evaluationBadge: 'gioi' | 'xuat_sac' | 'dat' | 'chua_dat';
}

export interface YearAcademicSummary {
  academicYear: string;
  className?: string;
  gradeLevel?: string;
  homeroomTeacher?: string;
  overallYearGpa: number;
  semester1Gpa: number;
  semester2Gpa: number;
  classRank: string;
  gradeRank: string;
  academicRank: string;
  conductRank: string;
  titleAward: string;
  promotionStatus: string;
  totalSubjects: number;
  passRate: string;
  teacherFeedback: string;
  subjects: YearSubjectGrade[];
}

export interface ProgressionRecord {
  academicYear: string;
  grade: string;
  className: string;
  schoolName: string;
  semester1Gpa?: number | null;
  semester2Gpa?: number | null;
  yearGpa: number;
  academicRank: string;
  conductRank: string;
  classRank: string;
  awardTitle: string;
  homeroomTeacher: string;
  teacherComment: string;
  status: 'completed' | 'in_progress';
}

export interface StudentAcademicSummary {
  academicYear: string;
  semester: string;
  className?: string;
  gradeLevel?: string;
  homeroomTeacher?: string;
  overallGpa?: number | null;
  classRank?: string;
  gradeRank?: string;
  totalSubjects?: number;
  passRate?: string;
  academicRank: string;
  conductRank: string;
  isPublished: boolean;
  subjects: SubjectGrade[];
  gpaHistory?: GpaHistoryItem[];
  yearSummary?: YearAcademicSummary;
  progressionHistory?: ProgressionRecord[];
}

export interface ExamItem {
  id: string;
  stt?: number;
  subjectName: string;
  subjectCode?: string;
  examTitle?: string;
  examType?: string; // Giữa kỳ, Cuối kỳ, Đánh giá
  examDateFormatted?: string;
  durationFormatted?: string;
  startsAt: string;
  endsAt: string;
  roomName: string;
  durationMinutes: number;
  examFormat: string;
  status: 'completed' | 'upcoming' | 'pending' | 'scheduled' | 'cancelled';
  statusTextVi?: string;
  semester?: string;
  academicYear?: string;
  invigilator?: string;
  allowedMaterials?: string;
}

export interface ExamScheduleSummary {
  semester: string;
  academicYear: string;
  currentExamPeriod: string;
  totalExams: number;
  completedExams: number;
  upcomingExams: number;
  remainingExams: number;
  exams: ExamItem[];
  nextExam?: ExamItem | null;
  upcomingList: ExamItem[];
}

export interface AnnouncementTableRow {
  col1: string;
  col2: string;
  col3: string;
  col4: string;
}

export interface AnnouncementAttachment {
  fileName: string;
  fileSize: string;
  fileType: string;
  fileUrl?: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  audience: string;
  publishedAt: string;
  publishedDateFormatted?: string;
  publishedTimeFormatted?: string;
  authorName: string;
  isImportant: boolean;
  isRead: boolean;
  isBookmarked?: boolean;
  viewsCount?: number;
  category: string;
  categoryNameVi?: string;
  salutation?: string;
  intro?: string;
  tableRows?: AnnouncementTableRow[];
  notes?: string[];
  attachments?: AnnouncementAttachment[];
}

export interface StudentFeeItem {
  id: string;
  title: string;
  amount: number;
  discount: number;
  finalAmount: number;
  paidAmount: number;
  dueDate?: string;
  status: 'paid' | 'partially_paid' | 'unpaid';
  statusTextVi: string;
  receiptCode?: string;
  paidAt?: string;
}

export interface StudentFeeSummary {
  totalPayable: number;
  totalPaid: number;
  remainingBalance: number;
  feeItems: StudentFeeItem[];
}

export interface SupportRequest {
  id: string;
  requestCode?: string;
  requestType: string;
  requestTypeTextVi: string;
  subject: string;
  description: string;
  department?: string;
  priority?: 'normal' | 'urgent' | string;
  status: 'pending' | 'processing' | 'resolved' | 'completed' | 'rejected' | string;
  statusTextVi: string;
  createdAt: string;
  decidedAt?: string;
  responseNote?: string;
  attachmentFileName?: string;
}

export interface CreateSupportRequestInput {
  requestType: string;
  subject: string;
  description: string;
  department?: string;
  priority?: string;
  attachmentFileName?: string;
}

export interface StudentDashboardData {
  profile: StudentProfile;
  todayLessonsCount: number;
  attendanceRate: number;
  upcomingExamsCount: number;
  unreadAnnouncementsCount: number;
  todayTimetable: TimetableItem[];
  upcomingExams: ExamItem[];
  recentAnnouncements: AnnouncementItem[];
  academicSummary: StudentAcademicSummary;
  attendanceSummary?: AttendanceSummary;
  latestFee?: StudentFeeItem;
}

export interface StudentClassInfo {
  classId: string;
  className: string;
  gradeLevel: string;
  academicYear: string;
  homeroomTeacherName: string;
  homeroomTeacherPhone?: string;
  homeroomTeacherEmail?: string;
  totalStudents: number;
  roomName: string;
}
