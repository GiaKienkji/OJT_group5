import {
  StudentProfile,
  StudentDashboardData,
  StudentClassInfo,
  TimetableItem,
  AttendanceSummary,
  StudentAcademicSummary,
  ExamItem,
  ExamScheduleSummary,
  AnnouncementItem,
  StudentFeeSummary,
  SupportRequest,
  CreateSupportRequestInput
} from '../types/student.types';

const TOKEN_KEY = 'soms_access_token';

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem(TOKEN_KEY);
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || `Lỗi máy chủ (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const studentApi = {
  async getProfile(): Promise<StudentProfile> {
    const res = await fetch('/api/student/me', { headers: getAuthHeaders() });
    return handleResponse<StudentProfile>(res);
  },

  async getDashboard(): Promise<StudentDashboardData> {
    const res = await fetch('/api/student/dashboard', { headers: getAuthHeaders() });
    return handleResponse<StudentDashboardData>(res);
  },

  async getClassInfo(): Promise<StudentClassInfo> {
    const res = await fetch('/api/student/class', { headers: getAuthHeaders() });
    return handleResponse<StudentClassInfo>(res);
  },

  async getTimetable(weekday?: number, session?: string): Promise<TimetableItem[]> {
    const params = new URLSearchParams();
    if (weekday !== undefined) params.append('weekday', weekday.toString());
    if (session) params.append('session', session);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`/api/student/timetable${qs}`, { headers: getAuthHeaders() });
    return handleResponse<TimetableItem[]>(res);
  },

  async getTimetableChanges(): Promise<any[]> {
    const res = await fetch('/api/student/timetable/changes', { headers: getAuthHeaders() });
    return handleResponse<any[]>(res);
  },

  async getAttendance(semester?: string, month?: string, academicYear?: string): Promise<AttendanceSummary> {
    const params = new URLSearchParams();
    if (semester) params.append('semester', semester);
    if (month) params.append('month', month);
    if (academicYear) params.append('academicYear', academicYear);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`/api/student/attendance${qs}`, { headers: getAuthHeaders() });
    return handleResponse<AttendanceSummary>(res);
  },

  async getGrades(semester?: string, academicYear?: string): Promise<StudentAcademicSummary> {
    const params = new URLSearchParams();
    if (semester) params.append('semester', semester);
    if (academicYear) params.append('academicYear', academicYear);
    const query = params.toString() ? `?${params.toString()}` : '';

    const res = await fetch(`/api/student/grades${query}`, { headers: getAuthHeaders() });
    return handleResponse<StudentAcademicSummary>(res);
  },

  async getExams(): Promise<ExamItem[]> {
    const res = await fetch('/api/student/exams', { headers: getAuthHeaders() });
    return handleResponse<ExamItem[]>(res);
  },

  async getExamScheduleSummary(semester?: string, academicYear?: string, examPeriod?: string): Promise<ExamScheduleSummary> {
    const params = new URLSearchParams();
    if (semester) params.append('semester', semester);
    if (academicYear) params.append('academicYear', academicYear);
    if (examPeriod) params.append('examPeriod', examPeriod);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`/api/student/exams/summary${qs}`, { headers: getAuthHeaders() });
    return handleResponse<ExamScheduleSummary>(res);
  },

  async getAnnouncements(): Promise<AnnouncementItem[]> {
    const res = await fetch('/api/student/announcements', { headers: getAuthHeaders() });
    return handleResponse<AnnouncementItem[]>(res);
  },

  async markAnnouncementAsRead(id: string): Promise<boolean> {
    const res = await fetch(`/api/student/announcements/${id}/read`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.ok;
  },

  async getFees(): Promise<StudentFeeSummary> {
    const res = await fetch('/api/student/fees', { headers: getAuthHeaders() });
    return handleResponse<StudentFeeSummary>(res);
  },

  async getSupportRequests(): Promise<SupportRequest[]> {
    const res = await fetch('/api/student/support-requests', { headers: getAuthHeaders() });
    return handleResponse<SupportRequest[]>(res);
  },

  async createSupportRequest(data: CreateSupportRequestInput): Promise<SupportRequest> {
    const res = await fetch('/api/student/support-requests', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<SupportRequest>(res);
  },

  async submitProfileUpdateRequest(data: any): Promise<any> {
    const res = await fetch('/api/student/profile-update-requests', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<any>(res);
  },

  async updateContact(data: any): Promise<any> {
    const res = await fetch('/api/student/profile', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<any>(res);
  },

  async changePassword(data: any): Promise<any> {
    const res = await fetch('/api/student/change-password', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<any>(res);
  }
};
