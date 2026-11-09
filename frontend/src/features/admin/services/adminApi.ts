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

export const adminApi = {
  // 1. User Management
  async getUsers(filter: UserQueryFilter = {}): Promise<PagedResult<UserItem>> {
    const params = new URLSearchParams();
    if (filter.page) params.append('page', filter.page.toString());
    if (filter.pageSize) params.append('pageSize', filter.pageSize.toString());
    if (filter.searchTerm) params.append('searchTerm', filter.searchTerm);
    if (filter.roleCode) params.append('roleCode', filter.roleCode);
    if (filter.status) params.append('status', filter.status);
    if (filter.schoolId) params.append('schoolId', filter.schoolId);

    const res = await fetch(`/api/admin/users?${params.toString()}`, { headers: getAuthHeaders() });
    return handleResponse<PagedResult<UserItem>>(res);
  },

  async getUserById(id: string): Promise<UserItem> {
    const res = await fetch(`/api/admin/users/${id}`, { headers: getAuthHeaders() });
    return handleResponse<UserItem>(res);
  },

  async createUser(data: CreateUserInput): Promise<UserItem> {
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<UserItem>(res);
  },

  async updateUser(id: string, data: UpdateUserInput): Promise<UserItem> {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<UserItem>(res);
  },

  async setUserStatus(id: string, status: 'active' | 'locked'): Promise<{ message: string }> {
    const res = await fetch(`/api/admin/users/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    return handleResponse<{ message: string }>(res);
  },

  async resetPassword(id: string, newPassword: string): Promise<{ message: string }> {
    const res = await fetch(`/api/admin/users/${id}/reset-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ newPassword })
    });
    return handleResponse<{ message: string }>(res);
  },

  async importUsers(schoolId: string, users: any[]): Promise<any> {
    const res = await fetch('/api/admin/users/import', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ schoolId, users })
    });
    return handleResponse<any>(res);
  },

  // 2. Roles & RBAC
  async getRoles(): Promise<RoleDetail[]> {
    const res = await fetch('/api/admin/roles', { headers: getAuthHeaders() });
    return handleResponse<RoleDetail[]>(res);
  },

  async getPermissions(): Promise<PermissionItem[]> {
    const res = await fetch('/api/admin/roles/permissions', { headers: getAuthHeaders() });
    return handleResponse<PermissionItem[]>(res);
  },

  async updateRolePermissions(roleCode: string, permissionCodes: string[]): Promise<{ message: string }> {
    const res = await fetch('/api/admin/roles/permissions', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ roleCode, permissionCodes })
    });
    return handleResponse<{ message: string }>(res);
  },

  async assignUserRole(userId: string, schoolId: string, roleCode: string): Promise<{ message: string }> {
    const res = await fetch('/api/admin/roles/assign', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, schoolId, roleCode })
    });
    return handleResponse<{ message: string }>(res);
  },

  async removeUserRole(userId: string, schoolId: string, roleCode: string): Promise<{ message: string }> {
    const res = await fetch(`/api/admin/roles/user?userId=${userId}&schoolId=${schoolId}&roleCode=${roleCode}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse<{ message: string }>(res);
  },

  // 3. School & Config
  async getAllSchools(): Promise<SchoolConfig[]> {
    const res = await fetch('/api/admin/config/schools', { headers: getAuthHeaders() });
    return handleResponse<SchoolConfig[]>(res);
  },

  async getSchoolConfig(schoolId: string): Promise<SchoolConfig> {
    const res = await fetch(`/api/admin/config/schools/${schoolId}`, { headers: getAuthHeaders() });
    return handleResponse<SchoolConfig>(res);
  },

  async updateSchoolConfig(schoolId: string, data: Partial<SchoolConfig>): Promise<SchoolConfig> {
    const res = await fetch(`/api/admin/config/schools/${schoolId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<SchoolConfig>(res);
  },

  async getAcademicYears(schoolId: string): Promise<AcademicYearItem[]> {
    const res = await fetch(`/api/admin/config/academic-years/${schoolId}`, { headers: getAuthHeaders() });
    return handleResponse<AcademicYearItem[]>(res);
  },

  async createAcademicYear(data: CreateAcademicYearInput): Promise<AcademicYearItem> {
    const res = await fetch('/api/admin/config/academic-years', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<AcademicYearItem>(res);
  },

  async activateAcademicYear(schoolId: string, academicYearId: string): Promise<{ message: string }> {
    const res = await fetch(`/api/admin/config/academic-years/${academicYearId}/activate?schoolId=${schoolId}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse<{ message: string }>(res);
  },

  // 4. Audit & Sessions
  async getAuditLogs(page = 1, pageSize = 20, action?: string): Promise<PagedResult<AuditLogItem>> {
    const params = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString() });
    if (action) params.append('action', action);
    const res = await fetch(`/api/admin/audit/logs?${params.toString()}`, { headers: getAuthHeaders() });
    return handleResponse<PagedResult<AuditLogItem>>(res);
  },

  async getActiveSessions(schoolId?: string): Promise<UserSessionItem[]> {
    const url = schoolId ? `/api/admin/audit/sessions?schoolId=${schoolId}` : '/api/admin/audit/sessions';
    const res = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse<UserSessionItem[]>(res);
  },

  async revokeSession(sessionId: string): Promise<{ message: string }> {
    const res = await fetch(`/api/admin/audit/sessions/${sessionId}/revoke`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse<{ message: string }>(res);
  },

  async getSystemHealth(): Promise<SystemHealthStatus> {
    const res = await fetch('/api/admin/audit/health', { headers: getAuthHeaders() });
    return handleResponse<SystemHealthStatus>(res);
  }
};

