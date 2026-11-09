import {
  ExecutiveDashboardSummary,
  ApprovalRequestItem,
  CreateApprovalInput,
  ApprovalDecisionInput,
  SchoolTaskItem,
  CreateTaskInput
} from '../types/management.types';

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

export const managementApi = {
  // 1. Executive Dashboard
  async getExecutiveSummary(schoolId?: string): Promise<ExecutiveDashboardSummary> {
    const defaultSchool = schoolId || '00000000-0000-0000-0000-000000000000';
    const res = await fetch(`/api/management/dashboard/summary?schoolId=${defaultSchool}`, {
      headers: getAuthHeaders()
    });
    return handleResponse<ExecutiveDashboardSummary>(res);
  },

  // 2. Approval Engine (BF04)
  async getApprovalRequests(filter: { status?: string; requestType?: string; priority?: string } = {}): Promise<ApprovalRequestItem[]> {
    const params = new URLSearchParams();
    if (filter.status) params.append('status', filter.status);
    if (filter.requestType) params.append('requestType', filter.requestType);
    if (filter.priority) params.append('priority', filter.priority);

    const res = await fetch(`/api/approvals?${params.toString()}`, {
      headers: getAuthHeaders()
    });
    return handleResponse<ApprovalRequestItem[]>(res);
  },

  async getApprovalById(id: string): Promise<ApprovalRequestItem> {
    const res = await fetch(`/api/approvals/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse<ApprovalRequestItem>(res);
  },

  async createApprovalRequest(data: CreateApprovalInput): Promise<ApprovalRequestItem> {
    const res = await fetch('/api/approvals', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<ApprovalRequestItem>(res);
  },

  async processDecision(id: string, decision: ApprovalDecisionInput): Promise<{ message: string }> {
    const res = await fetch(`/api/approvals/${id}/decision`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(decision)
    });
    return handleResponse<{ message: string }>(res);
  },

  // 3. Task Management (BF08)
  async getTasks(schoolId?: string, status?: string, category?: string): Promise<SchoolTaskItem[]> {
    const defaultSchool = schoolId || '00000000-0000-0000-0000-000000000000';
    const params = new URLSearchParams({ schoolId: defaultSchool });
    if (status) params.append('status', status);
    if (category) params.append('category', category);

    const res = await fetch(`/api/management/tasks?${params.toString()}`, {
      headers: getAuthHeaders()
    });
    return handleResponse<SchoolTaskItem[]>(res);
  },

  async createTask(data: CreateTaskInput): Promise<SchoolTaskItem> {
    const res = await fetch('/api/management/tasks', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<SchoolTaskItem>(res);
  },

  async completeTask(id: string): Promise<{ message: string }> {
    const res = await fetch(`/api/management/tasks/${id}/complete`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse<{ message: string }>(res);
  }
};

