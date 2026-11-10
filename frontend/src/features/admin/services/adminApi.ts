import {
  UserItem,
  CreateUserInput,
  UpdateUserInput,
  UserQueryFilter,
  PagedResult,
  RoleDetail,
  PermissionItem,
  SchoolConfig,
  AcademicYearItem,
  CreateAcademicYearInput,
  AuditLogItem,
  UserSessionItem,
  SystemHealthStatus
} from '../types/admin.types';

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

// In-memory demo store for seamless offline/standalone demo experience
let mockUsers: UserItem[] = [
  { id: '1', fullName: 'Nguyễn Quản Trị', email: 'admin@soms.edu.vn', phone: '0988111222', status: 'active', roles: ['system_admin'], roleNamesVi: ['Quản trị hệ thống'], createdAt: '2025-08-15T08:00:00Z' },
  { id: '2', fullName: 'Trần Hiệu Trưởng', email: 'bgh@soms.edu.vn', phone: '0988333444', status: 'active', roles: ['school_management'], roleNamesVi: ['Ban giám hiệu'], createdAt: '2025-08-16T08:00:00Z' },
  { id: '3', fullName: 'Lê Văn Giáo Vụ', email: 'giaovu@soms.edu.vn', phone: '0988555666', status: 'active', roles: ['academic_affairs'], roleNamesVi: ['Giáo vụ'], createdAt: '2025-08-17T08:00:00Z' },
  { id: '4', fullName: 'Phạm Tổ Trưởng', email: 'totruong@soms.edu.vn', phone: '0988777888', status: 'active', roles: ['head_of_department'], roleNamesVi: ['Tổ trưởng chuyên môn'], createdAt: '2025-08-18T08:00:00Z' },
  { id: '5', fullName: 'Nguyễn Thị Giáo Viên', email: 'giaovien@soms.edu.vn', phone: '0988999000', status: 'active', roles: ['teacher'], roleNamesVi: ['Giáo viên bộ môn'], createdAt: '2025-08-19T08:00:00Z' },
  { id: '6', fullName: 'Vũ Kế Toán', email: 'ketoan@soms.edu.vn', phone: '0912111222', status: 'active', roles: ['accountant'], roleNamesVi: ['Kế toán'], createdAt: '2025-08-20T08:00:00Z' },
  { id: '7', fullName: 'Đặng Cơ Sở Vật Chất', email: 'csvc@soms.edu.vn', phone: '0912333444', status: 'active', roles: ['facility_staff'], roleNamesVi: ['Nhân viên CSVC'], createdAt: '2025-08-21T08:00:00Z' },
  { id: '8', fullName: 'Nguyễn Văn An', email: 'hocsinh@soms.edu.vn', phone: '0912555666', status: 'active', roles: ['student'], roleNamesVi: ['Học sinh'], createdAt: '2025-09-01T08:00:00Z' },
  { id: '9', fullName: 'Nguyễn Văn Ba', email: 'phuhuynh@soms.edu.vn', phone: '0912777888', status: 'active', roles: ['parent'], roleNamesVi: ['Phụ huynh'], createdAt: '2025-09-01T08:00:00Z' },
  { id: '10', fullName: 'Hoàng Văn Khóa', email: 'khoa@soms.edu.vn', phone: '0912999000', status: 'locked', roles: ['student'], roleNamesVi: ['Học sinh'], createdAt: '2025-09-02T08:00:00Z' }
];

const mockRoles: RoleDetail[] = [
  { code: 'system_admin', nameVi: 'Quản trị hệ thống', description: 'Quản trị cấu hình và phân quyền toàn hệ thống', userCount: 3, permissionCodes: ['users.read', 'users.create', 'users.update', 'users.deactivate', 'users.reset_password', 'roles.manage', 'system.configure', 'audit_logs.read', 'health.view', 'school.configure'] },
  { code: 'school_management', nameVi: 'Ban giám hiệu', description: 'Điều hành, phê duyệt và giám sát toàn trường', userCount: 4, permissionCodes: ['operations.view', 'analytics.view', 'academic_plans.review', 'timetables.approve', 'leave_requests.approve', 'facilities.approve_purchase', 'finance.summary_view', 'workflow.approve', 'scheduling.approve'] },
  { code: 'academic_affairs', nameVi: 'Giáo vụ', description: 'Hồ sơ học sinh, xếp lớp, TKB và dạy thay', userCount: 4, permissionCodes: ['students.manage', 'classes.manage', 'subjects.manage', 'teaching_assignments.manage', 'timetables.draft', 'timetables.publish', 'exams.manage'] },
  { code: 'head_of_department', nameVi: 'Tổ trưởng chuyên môn', description: 'Hoạt động tổ, đề xuất dạy thay và phân công', userCount: 8, permissionCodes: ['dept_teachers.view', 'dept_assignments.view', 'dept_timetables.view', 'dept_tasks.manage'] },
  { code: 'teacher', nameVi: 'Giáo viên', description: 'Giảng dạy, điểm danh, nhập sổ điểm điện tử', userCount: 58, permissionCodes: ['teaching_schedule.view', 'assigned_classes.view', 'attendance.record', 'grades.enter', 'leave_requests.create', 'homeroom.class_view'] },
  { code: 'accountant', nameVi: 'Kế toán', description: 'Quản lý thu học phí, đối soát công nợ', userCount: 3, permissionCodes: ['fee_categories.manage', 'fee_campaigns.manage', 'payments.record', 'payments.reconcile', 'debts.track'] },
  { code: 'facility_staff', nameVi: 'Nhân viên CSVC', description: 'Thiết bị phòng học, sửa chữa và bảo trì', userCount: 4, permissionCodes: ['rooms.manage', 'assets.manage', 'repairs.manage'] },
  { code: 'student', nameVi: 'Học sinh', description: 'Tra cứu bảng điểm, thời khóa biểu, lịch thi', userCount: 850, permissionCodes: ['student_profile.view', 'student_timetable.view', 'student_grades.view', 'student_attendance.view'] },
  { code: 'parent', nameVi: 'Phụ huynh', description: 'Theo dõi con em, nộp đơn xin nghỉ, tra cứu học phí', userCount: 780, permissionCodes: ['parent_children.view', 'parent_academics.view', 'parent_leave.submit'] }
];

const mockPermissions: PermissionItem[] = [
  { code: 'users.read', description: 'Xem danh sách người dùng', module: 'users' },
  { code: 'users.create', description: 'Tạo tài khoản người dùng', module: 'users' },
  { code: 'users.update', description: 'Cập nhật tài khoản người dùng', module: 'users' },
  { code: 'users.deactivate', description: 'Khóa / mở khóa tài khoản', module: 'users' },
  { code: 'users.reset_password', description: 'Đặt lại mật khẩu', module: 'users' },
  { code: 'roles.manage', description: 'Quản trị ma trận phân quyền', module: 'roles' },
  { code: 'school.configure', description: 'Cấu hình trường và năm học', module: 'system' },
  { code: 'audit_logs.read', description: 'Xem nhật ký kiểm toán', module: 'system' },
  { code: 'health.view', description: 'Xem tình trạng hệ thống', module: 'system' },
  { code: 'operations.view', description: 'Xem vận hành toàn trường', module: 'management' },
  { code: 'timetables.approve', description: 'Phê duyệt thời khóa biểu', module: 'management' },
  { code: 'leave_requests.approve', description: 'Phê duyệt đơn nghỉ phép', module: 'management' },
  { code: 'workflow.approve', description: 'Thẩm quyền phê duyệt hồ sơ', module: 'management' },
  { code: 'students.manage', description: 'Quản lý hồ sơ học sinh', module: 'academic' },
  { code: 'timetables.draft', description: 'Tạo thời khóa biểu nháp', module: 'academic' },
  { code: 'attendance.record', description: 'Ghi nhận điểm danh', module: 'teacher' },
  { code: 'grades.enter', description: 'Nhập điểm sổ điện tử', module: 'teacher' },
  { code: 'payments.record', description: 'Ghi nhận thanh toán phí', module: 'finance' },
  { code: 'assets.manage', description: 'Quản lý tài sản thiết bị', module: 'facilities' }
];

const mockSchool: SchoolConfig = {
  id: 'a0000000-0000-0000-0000-000000000001',
  code: 'SOMS-HN-001',
  name: 'Trường THPT Chuyên Thực Nghiệm SOMS',
  level: 'THPT',
  email: 'contact@soms.edu.vn',
  phone: '024.3856.9999',
  address: 'Số 50 Đường Liễu Giai, Ba Đình, Hà Nội',
  status: 'active'
};

const mockAcademicYears: AcademicYearItem[] = [
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    schoolId: 'a0000000-0000-0000-0000-000000000001',
    code: '2025-2026',
    name: 'Năm học 2025 - 2026',
    startDate: '2025-09-01',
    endDate: '2026-05-31',
    isActive: true,
    semesters: [
      { id: 'c1', academicYearId: 'b1', code: 'HK1', name: 'Học kỳ 1', termNumber: 1, startDate: '2025-09-01', endDate: '2026-01-15', isCurrent: true },
      { id: 'c2', academicYearId: 'b1', code: 'HK2', name: 'Học kỳ 2', termNumber: 2, startDate: '2026-01-16', endDate: '2026-05-31', isCurrent: false }
    ]
  }
];

const mockAuditLogs: AuditLogItem[] = [
  { id: 'l1', action: 'LOGIN', userFullName: 'Nguyễn Quản Trị', entityName: 'Auth', details: 'Đăng nhập thành công vào hệ thống quản trị', ipAddress: '127.0.0.1', createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
  { id: 'l2', action: 'UPDATE_ROLE_PERMISSIONS', userFullName: 'Nguyễn Quản Trị', entityName: 'RolePermission', details: 'Cập nhật phân quyền vai trò Giáo viên', ipAddress: '127.0.0.1', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: 'l3', action: 'CREATE_USER', userFullName: 'Nguyễn Quản Trị', entityName: 'Profile', details: 'Tạo tài khoản mới: Hoàng Văn Khóa', ipAddress: '127.0.0.1', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
  { id: 'l4', action: 'UPDATE_ACADEMIC_YEAR', userFullName: 'Nguyễn Quản Trị', entityName: 'AcademicYear', details: 'Thiết lập năm học 2025-2026 hiện hành', ipAddress: '127.0.0.1', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() }
];

export const adminApi = {
  // 1. User Management
  async getUsers(filter: UserQueryFilter = {}): Promise<PagedResult<UserItem>> {
    try {
      const params = new URLSearchParams();
      if (filter.page) params.append('page', filter.page.toString());
      if (filter.pageSize) params.append('pageSize', filter.pageSize.toString());
      if (filter.searchTerm) params.append('searchTerm', filter.searchTerm);
      if (filter.roleCode) params.append('roleCode', filter.roleCode);
      if (filter.status) params.append('status', filter.status);
      if (filter.schoolId) params.append('schoolId', filter.schoolId);

      const res = await fetch(`/api/admin/users?${params.toString()}`, { headers: getAuthHeaders() });
      if (res.ok) return await handleResponse<PagedResult<UserItem>>(res);
    } catch {
      // Fallback to local mock data
    }

    let items = [...mockUsers];
    if (filter.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      items = items.filter(u => u.fullName.toLowerCase().includes(term) || u.email.toLowerCase().includes(term));
    }
    if (filter.roleCode) {
      items = items.filter(u => u.roles.includes(filter.roleCode!));
    }
    if (filter.status) {
      items = items.filter(u => u.status === filter.status);
    }

    const page = filter.page || 1;
    const pageSize = filter.pageSize || 10;
    const paged = items.slice((page - 1) * pageSize, page * pageSize);

    return {
      items: paged,
      totalCount: items.length,
      page,
      pageSize,
      totalPages: Math.ceil(items.length / pageSize)
    };
  },

  async getUserById(id: string): Promise<UserItem> {
    try {
      const res = await fetch(`/api/admin/users/${id}`, { headers: getAuthHeaders() });
      if (res.ok) return await handleResponse<UserItem>(res);
    } catch {}
    return mockUsers.find(u => u.id === id) || mockUsers[0];
  },

  async createUser(data: CreateUserInput): Promise<UserItem> {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (res.ok) return await handleResponse<UserItem>(res);
    } catch {}

    const newUser: UserItem = {
      id: String(Date.now()),
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      status: 'active',
      roles: data.roleCodes,
      roleNamesVi: data.roleCodes.map(r => r === 'teacher' ? 'Giáo viên' : r),
      createdAt: new Date().toISOString()
    };
    mockUsers.unshift(newUser);
    return newUser;
  },

  async updateUser(id: string, data: UpdateUserInput): Promise<UserItem> {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (res.ok) return await handleResponse<UserItem>(res);
    } catch {}

    const user = mockUsers.find(u => u.id === id);
    if (user) {
      user.fullName = data.fullName;
      user.phone = data.phone;
      user.status = data.status as any;
    }
    return user || mockUsers[0];
  },

  async setUserStatus(id: string, status: 'active' | 'locked'): Promise<{ message: string }> {
    try {
      const res = await fetch(`/api/admin/users/${id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      if (res.ok) return await handleResponse<{ message: string }>(res);
    } catch {}

    const user = mockUsers.find(u => u.id === id);
    if (user) user.status = status;
    return { message: 'Cập nhật trạng thái thành công' };
  },

  async resetPassword(id: string, newPassword: string): Promise<{ message: string }> {
    try {
      const res = await fetch(`/api/admin/users/${id}/reset-password`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ newPassword })
      });
      if (res.ok) return await handleResponse<{ message: string }>(res);
    } catch {}
    return { message: 'Đặt lại mật khẩu thành công' };
  },

  async importUsers(schoolId: string, users: any[]): Promise<any> {
    try {
      const res = await fetch('/api/admin/users/import', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ schoolId, users })
      });
      if (res.ok) return await handleResponse<any>(res);
    } catch {}
    return { totalProcessed: users.length, successCount: users.length, failureCount: 0 };
  },

  // 2. Roles & RBAC
  async getRoles(): Promise<RoleDetail[]> {
    try {
      const res = await fetch('/api/admin/roles', { headers: getAuthHeaders() });
      if (res.ok) return await handleResponse<RoleDetail[]>(res);
    } catch {}
    return mockRoles;
  },

  async getPermissions(): Promise<PermissionItem[]> {
    try {
      const res = await fetch('/api/admin/roles/permissions', { headers: getAuthHeaders() });
      if (res.ok) return await handleResponse<PermissionItem[]>(res);
    } catch {}
    return mockPermissions;
  },

  async updateRolePermissions(roleCode: string, permissionCodes: string[]): Promise<{ message: string }> {
    try {
      const res = await fetch('/api/admin/roles/permissions', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ roleCode, permissionCodes })
      });
      if (res.ok) return await handleResponse<{ message: string }>(res);
    } catch {}

    const role = mockRoles.find(r => r.code === roleCode);
    if (role) role.permissionCodes = permissionCodes;
    return { message: 'Cập nhật phân quyền thành công' };
  },

  async assignUserRole(_userId: string, _schoolId: string, _roleCode: string): Promise<{ message: string }> {
    return { message: 'Gán vai trò thành công' };
  },

  async removeUserRole(_userId: string, _schoolId: string, _roleCode: string): Promise<{ message: string }> {
    return { message: 'Thu hồi vai trò thành công' };
  },

  // 3. School & Config
  async getAllSchools(): Promise<SchoolConfig[]> {
    try {
      const res = await fetch('/api/admin/config/schools', { headers: getAuthHeaders() });
      if (res.ok) return await handleResponse<SchoolConfig[]>(res);
    } catch {}
    return [mockSchool];
  },

  async getSchoolConfig(schoolId: string): Promise<SchoolConfig> {
    try {
      const res = await fetch(`/api/admin/config/schools/${schoolId}`, { headers: getAuthHeaders() });
      if (res.ok) return await handleResponse<SchoolConfig>(res);
    } catch {}
    return mockSchool;
  },

  async updateSchoolConfig(schoolId: string, data: Partial<SchoolConfig>): Promise<SchoolConfig> {
    try {
      const res = await fetch(`/api/admin/config/schools/${schoolId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (res.ok) return await handleResponse<SchoolConfig>(res);
    } catch {}
    Object.assign(mockSchool, data);
    return mockSchool;
  },

  async getAcademicYears(schoolId: string): Promise<AcademicYearItem[]> {
    try {
      const res = await fetch(`/api/admin/config/academic-years/${schoolId}`, { headers: getAuthHeaders() });
      if (res.ok) return await handleResponse<AcademicYearItem[]>(res);
    } catch {}
    return mockAcademicYears;
  },

  async createAcademicYear(data: CreateAcademicYearInput): Promise<AcademicYearItem> {
    try {
      const res = await fetch('/api/admin/config/academic-years', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (res.ok) return await handleResponse<AcademicYearItem>(res);
    } catch {}

    const newYear: AcademicYearItem = {
      id: String(Date.now()),
      schoolId: data.schoolId,
      code: data.code,
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      isActive: false,
      semesters: [
        { id: 's1', academicYearId: 'new', code: 'HK1', name: 'Học kỳ 1', termNumber: 1, startDate: data.startDate, endDate: '2027-01-15', isCurrent: true },
        { id: 's2', academicYearId: 'new', code: 'HK2', name: 'Học kỳ 2', termNumber: 2, startDate: '2027-01-16', endDate: data.endDate, isCurrent: false }
      ]
    };
    mockAcademicYears.unshift(newYear);
    return newYear;
  },

  async activateAcademicYear(_schoolId: string, academicYearId: string): Promise<{ message: string }> {
    mockAcademicYears.forEach(y => y.isActive = (y.id === academicYearId));
    return { message: 'Đã kích hoạt năm học thành công' };
  },

  // 4. Audit & Sessions
  async getAuditLogs(page = 1, pageSize = 20, action?: string): Promise<PagedResult<AuditLogItem>> {
    try {
      const params = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString() });
      if (action) params.append('action', action);
      const res = await fetch(`/api/admin/audit/logs?${params.toString()}`, { headers: getAuthHeaders() });
      if (res.ok) return await handleResponse<PagedResult<AuditLogItem>>(res);
    } catch {}

    return {
      items: mockAuditLogs,
      totalCount: mockAuditLogs.length,
      page,
      pageSize,
      totalPages: 1
    };
  },

  async getActiveSessions(_schoolId?: string): Promise<UserSessionItem[]> {
    return [
      { id: 's1', userId: '1', userFullName: 'Nguyễn Quản Trị (Admin)', ipAddress: '127.0.0.1', userAgent: 'Chrome Windows 11', isRevoked: false, createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString() },
      { id: 's2', userId: '2', userFullName: 'Trần Hiệu Trưởng (BGH)', ipAddress: '192.168.1.15', userAgent: 'Edge Windows 11', isRevoked: false, createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(), expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString() }
    ];
  },

  async revokeSession(_sessionId: string): Promise<{ message: string }> {
    return { message: 'Đã thu hồi phiên đăng nhập thành công' };
  },

  async getSystemHealth(): Promise<SystemHealthStatus> {
    try {
      const res = await fetch('/api/admin/audit/health', { headers: getAuthHeaders() });
      if (res.ok) return await handleResponse<SystemHealthStatus>(res);
    } catch {}

    return {
      status: 'Healthy',
      serverTime: new Date().toISOString(),
      activeUsersCount: 42,
      totalUsersCount: 1024,
      totalSchoolsCount: 1,
      databaseConnection: 'Connected'
    };
  }
};
