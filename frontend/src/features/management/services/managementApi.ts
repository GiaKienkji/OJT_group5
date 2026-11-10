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

// In-memory demo data for standalone / quick testing
let mockApprovalRequests: ApprovalRequestItem[] = [
  {
    id: 'app-01',
    requestCode: 'REQ-2026-001',
    requestType: 'teacher_leave',
    requestTypeNameVi: 'Nghỉ phép giáo viên (TV3)',
    requesterId: '5',
    requesterName: 'Nguyễn Thị Giáo Viên',
    requesterRole: 'Giáo viên bộ môn Toán',
    title: 'Đơn xin nghỉ ốm và sắp xếp dạy thay ngày 12/11',
    description: 'Em xin phép nghỉ ốm 1 ngày thứ Tư (12/11) do bị sốt xuất huyết nhẹ. Cô Hoa (Tổ Toán) đã đồng ý nhận dạy thay 2 tiết lớp 10A2 để đảm bảo tiến độ chương trình.',
    status: 'pending',
    priority: 'high',
    createdAt: '2026-11-10T08:00:00Z',
    histories: [
      { id: 'h1', action: 'SUBMITTED', actorName: 'Nguyễn Thị Giáo Viên', note: 'Gửi đơn kèm giấy khám bệnh', createdAt: '2026-11-10T08:00:00Z' },
      { id: 'h2', action: 'DEPT_ENDORSED', actorName: 'Phạm Tổ Trưởng', note: 'Tổ Toán đã thống nhất cô Hoa dạy thay', createdAt: '2026-11-10T08:30:00Z' }
    ]
  },
  {
    id: 'app-02',
    requestCode: 'REQ-2026-002',
    requestType: 'room_change',
    requestTypeNameVi: 'Đổi tiết & phòng học (TV2)',
    requesterId: '3',
    requesterName: 'Lê Văn Giáo Vụ',
    requesterRole: 'Giáo vụ',
    title: 'Đổi tiết môn Hóa lớp 12A1 sang phòng thí nghiệm 01',
    description: 'Đổi từ phòng học lý thuyết 302 sang Phòng thực hành Hóa vào tiết 3 sáng thứ Năm (13/11) phục vụ tiết dạy thao giảng cấp cụm.',
    status: 'pending',
    priority: 'medium',
    createdAt: '2026-11-09T14:30:00Z',
    histories: [
      { id: 'h3', action: 'SUBMITTED', actorName: 'Lê Văn Giáo Vụ', note: 'Đã kiểm tra phòng Lab 01 còn trống', createdAt: '2026-11-09T14:30:00Z' }
    ]
  },
  {
    id: 'app-03',
    requestCode: 'REQ-2026-003',
    requestType: 'facility_purchase',
    requestTypeNameVi: 'Mua sắm & Sửa chữa CSVC (TV4)',
    requesterId: '7',
    requesterName: 'Đặng Cơ Sở Vật Chất',
    requesterRole: 'Nhân viên CSVC',
    title: 'Đề xuất thay thế bóng đèn LED và bảng trượt phòng 204',
    description: 'Bảng phấn lớp 10A4 bị tróc sơn và 2 bóng đèn huỳnh quang bị chập chờn. Dự toán chi phí: 1.850.000 VNĐ trích từ quỹ bảo trì thường xuyên.',
    status: 'pending',
    priority: 'medium',
    createdAt: '2026-11-09T10:15:00Z',
    histories: [
      { id: 'h4', action: 'SUBMITTED', actorName: 'Đặng Cơ Sở Vật Chất', note: 'Đã lấy 2 báo giá cạnh tranh', createdAt: '2026-11-09T10:15:00Z' }
    ]
  },
  {
    id: 'app-04',
    requestCode: 'REQ-2026-004',
    requestType: 'student_leave',
    requestTypeNameVi: 'Học sinh xin nghỉ (TV5)',
    requesterId: '9',
    requesterName: 'Nguyễn Văn Ba (Phụ huynh)',
    requesterRole: 'Phụ huynh',
    title: 'Đơn xin phép cho học sinh Nguyễn Văn An (10A1) nghỉ khám bệnh',
    description: 'Gia đình xin phép cho cháu An nghỉ học ngày 11/11 để đi tái khám định kỳ tại Bệnh viện Nhi Đồng.',
    status: 'approved',
    priority: 'low',
    createdAt: '2026-11-08T16:00:00Z',
    finalDecisionAt: '2026-11-08T18:00:00Z',
    histories: [
      { id: 'h5', action: 'SUBMITTED', actorName: 'Nguyễn Văn Ba', note: 'Đã báo GVCN', createdAt: '2026-11-08T16:00:00Z' },
      { id: 'h6', action: 'APPROVED', actorName: 'Trần Hiệu Trưởng', note: 'Đồng ý cho học sinh nghỉ có phép', createdAt: '2026-11-08T18:00:00Z' }
    ]
  }
];

let mockTasks: SchoolTaskItem[] = [
  {
    id: 'tsk-01',
    title: 'Hoàn thiện đề thi giữa học kỳ 1 các bộ môn',
    description: 'Tổ trưởng chuyên môn tập hợp ma trận đề, ngân hàng câu hỏi trắc nghiệm và tự luận nộp về BGH kiểm duyệt.',
    category: 'academic',
    categoryNameVi: 'Chuyên môn & Đào tạo',
    createdBy: '2',
    creatorName: 'Trần Hiệu Trưởng',
    priority: 'high',
    status: 'in_progress',
    dueDate: '2026-11-20',
    createdAt: '2026-11-05T08:00:00Z',
    assignments: [
      { id: 'as-1', assigneeId: '4', assigneeName: 'Phạm Tổ Trưởng', roleInTask: 'Chủ trì tổng hợp', progressPercent: 65, assignedAt: '2026-11-05T08:00:00Z' }
    ]
  },
  {
    id: 'tsk-02',
    title: 'Kiểm tra an toàn hệ thống điện và PCCC toàn trường đợt 2',
    description: 'Rà soát các bình chữa cháy, tủ điện tổng hành lang các dãy phòng học A, B, C chuẩn bị đoàn kiểm tra liên ngành.',
    category: 'facility',
    categoryNameVi: 'Cơ sở vật chất',
    createdBy: '2',
    creatorName: 'Trần Hiệu Trưởng',
    priority: 'urgent',
    status: 'in_progress',
    dueDate: '2026-11-12',
    createdAt: '2026-11-07T08:00:00Z',
    assignments: [
      { id: 'as-2', assigneeId: '7', assigneeName: 'Đặng Cơ Sở Vật Chất', roleInTask: 'Chịu trách nhiệm chính', progressPercent: 80, assignedAt: '2026-11-07T08:00:00Z' }
    ]
  },
  {
    id: 'tsk-03',
    title: 'Chuẩn bị kế hoạch tổ chức Lễ kỷ niệm Ngày Nhà giáo VN 20/11',
    description: 'Xây dựng kịch bản chương trình, hội diễn văn nghệ học sinh, phát động phong trào thi đua tiết dạy tốt và lập danh sách khen thưởng.',
    category: 'event',
    categoryNameVi: 'Phong trào & Sự kiện',
    createdBy: '2',
    creatorName: 'Trần Hiệu Trưởng',
    priority: 'medium',
    status: 'not_started',
    dueDate: '2026-11-18',
    createdAt: '2026-11-08T09:00:00Z',
    assignments: [
      { id: 'as-3', assigneeId: '4', assigneeName: 'Phạm Tổ Trưởng', roleInTask: 'Trưởng ban nội dung', progressPercent: 25, assignedAt: '2026-11-08T09:00:00Z' }
    ]
  }
];

export const managementApi = {
  // 1. Executive Dashboard
  async getExecutiveSummary(schoolId?: string): Promise<ExecutiveDashboardSummary> {
    const defaultSchool = schoolId || '00000000-0000-0000-0000-000000000000';
    try {
      const res = await fetch(`/api/management/dashboard/summary?schoolId=${defaultSchool}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) return await handleResponse<ExecutiveDashboardSummary>(res);
    } catch {}

    const pendingCount = mockApprovalRequests.filter(r => r.status === 'pending').length;
    const activeCount = mockTasks.filter(t => t.status === 'in_progress' || t.status === 'not_started').length;

    return {
      kpis: {
        totalStudents: 850,
        totalTeachers: 58,
        totalStaff: 12,
        totalClasses: 24,
        pendingApprovalsCount: pendingCount,
        activeTasksCount: activeCount,
        overdueTasksCount: 1
      },
      attendanceToday: {
        presentRatePercent: 98.4,
        totalAbsentToday: 14,
        excusedAbsent: 12,
        unexcusedAbsent: 2
      },
      finance: {
        totalExpectedRevenue: 3200000000,
        totalCollectedRevenue: 2850000000,
        outstandingDebt: 350000000,
        collectionRatePercent: 89.1
      },
      academicProgress: {
        teachingScheduleCompletedPercent: 94.5,
        gradesEnteredPercent: 88.0,
        upcomingExamsCount: 2
      },
      urgentAlerts: [
        {
          id: 'alt-1',
          type: 'warning',
          title: 'Cảnh báo thiếu tiết môn Toán lớp 11A1',
          message: 'Tuần 12 ghi nhận thiếu 2 tiết môn Toán do cô Lan nghỉ ốm, cần điều phối giáo viên dạy bù.',
          timestamp: 'Hôm nay, 08:30',
          actionUrl: '/management/approvals'
        },
        {
          id: 'alt-2',
          type: 'info',
          title: 'Khuyến nghị AI: Tối ưu phòng thực hành Tin học',
          message: 'Phòng máy tính 02 có tỷ lệ sử dụng 92% vào thứ Ba và thứ Năm. Gợi ý chuyển 2 lớp sang phòng 03 để giảm tải thiết bị.',
          timestamp: 'Hôm nay, 09:15',
          actionUrl: '/management/approvals'
        },
        {
          id: 'alt-3',
          type: 'danger',
          title: 'Nhiệm vụ kiểm định thiết bị PCCC đến hạn',
          message: 'Hồ sơ kiểm định định kỳ phòng cháy chữa cháy cần được BGH phê duyệt trước 17:00 ngày mai.',
          timestamp: 'Hôm qua, 16:00',
          actionUrl: '/management/tasks'
        }
      ],
      pendingApprovals: mockApprovalRequests.filter(r => r.status === 'pending'),
      activeTasks: mockTasks
    };
  },

  // 2. Approval Engine (BF04)
  async getApprovalRequests(filter: { status?: string; requestType?: string; priority?: string } = {}): Promise<ApprovalRequestItem[]> {
    try {
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.requestType) params.append('requestType', filter.requestType);
      if (filter.priority) params.append('priority', filter.priority);

      const res = await fetch(`/api/approvals?${params.toString()}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) return await handleResponse<ApprovalRequestItem[]>(res);
    } catch {}

    let items = [...mockApprovalRequests];
    if (filter.status) items = items.filter(r => r.status === filter.status);
    if (filter.requestType) items = items.filter(r => r.requestType === filter.requestType);
    if (filter.priority) items = items.filter(r => r.priority === filter.priority);
    return items;
  },

  async getApprovalById(id: string): Promise<ApprovalRequestItem> {
    try {
      const res = await fetch(`/api/approvals/${id}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) return await handleResponse<ApprovalRequestItem>(res);
    } catch {}
    return mockApprovalRequests.find(r => r.id === id) || mockApprovalRequests[0];
  },

  async createApprovalRequest(data: CreateApprovalInput): Promise<ApprovalRequestItem> {
    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (res.ok) return await handleResponse<ApprovalRequestItem>(res);
    } catch {}

    const newItem: ApprovalRequestItem = {
      id: 'app-' + Date.now(),
      requestCode: `REQ-2026-${Math.floor(100 + Math.random() * 900)}`,
      requestType: data.requestType,
      requestTypeNameVi: data.requestType === 'teacher_leave' ? 'Nghỉ phép giáo viên' : 'Đề xuất vận hành',
      requesterId: 'demo-user',
      requesterName: 'Người dùng SOMS',
      title: data.title,
      description: data.description,
      status: 'pending',
      priority: (data.priority as any) || 'medium',
      createdAt: new Date().toISOString(),
      histories: [
        { id: 'h-' + Date.now(), action: 'SUBMITTED', actorName: 'Người dùng SOMS', note: 'Đã gửi đề xuất', createdAt: new Date().toISOString() }
      ]
    };
    mockApprovalRequests.unshift(newItem);
    return newItem;
  },

  async processDecision(id: string, decision: ApprovalDecisionInput): Promise<{ message: string }> {
    try {
      const res = await fetch(`/api/approvals/${id}/decision`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(decision)
      });
      if (res.ok) return await handleResponse<{ message: string }>(res);
    } catch {}

    const item = mockApprovalRequests.find(r => r.id === id);
    if (item) {
      item.status = decision.decision;
      item.finalDecisionAt = new Date().toISOString();
      item.histories.push({
        id: 'h-' + Date.now(),
        action: decision.decision === 'approved' ? 'APPROVED' : 'REJECTED',
        actorName: 'Ban giám hiệu (Trần Hiệu Trưởng)',
        note: decision.note || (decision.decision === 'approved' ? 'Đã duyệt' : 'Từ chối'),
        createdAt: new Date().toISOString()
      });
    }
    return { message: 'Đã xử lý quyết định thành công' };
  },

  // 3. Task Management (BF08)
  async getTasks(schoolId?: string, status?: string, category?: string): Promise<SchoolTaskItem[]> {
    const defaultSchool = schoolId || '00000000-0000-0000-0000-000000000000';
    try {
      const params = new URLSearchParams({ schoolId: defaultSchool });
      if (status) params.append('status', status);
      if (category) params.append('category', category);

      const res = await fetch(`/api/management/tasks?${params.toString()}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) return await handleResponse<SchoolTaskItem[]>(res);
    } catch {}

    let items = [...mockTasks];
    if (status) items = items.filter(t => t.status === status);
    if (category) items = items.filter(t => t.category === category);
    return items;
  },

  async createTask(data: CreateTaskInput): Promise<SchoolTaskItem> {
    try {
      const res = await fetch('/api/management/tasks', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (res.ok) return await handleResponse<SchoolTaskItem>(res);
    } catch {}

    const newTask: SchoolTaskItem = {
      id: 'tsk-' + Date.now(),
      title: data.title,
      description: data.description,
      category: data.category || 'academic',
      categoryNameVi: data.category === 'facility' ? 'Cơ sở vật chất' : 'Chuyên môn & Đào tạo',
      createdBy: '2',
      creatorName: 'Trần Hiệu Trưởng (BGH)',
      priority: (data.priority as any) || 'medium',
      status: 'not_started',
      dueDate: data.dueDate,
      createdAt: new Date().toISOString(),
      assignments: [
        { id: 'as-' + Date.now(), assigneeId: '4', assigneeName: 'Phạm Tổ Trưởng', roleInTask: 'Chủ trì', progressPercent: 0, assignedAt: new Date().toISOString() }
      ]
    };
    mockTasks.unshift(newTask);
    return newTask;
  },

  async completeTask(id: string): Promise<{ message: string }> {
    try {
      const res = await fetch(`/api/management/tasks/${id}/complete`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) return await handleResponse<{ message: string }>(res);
    } catch {}

    const task = mockTasks.find(t => t.id === id);
    if (task) {
      task.status = 'completed';
      task.completedAt = new Date().toISOString();
      task.assignments.forEach(a => a.progressPercent = 100);
    }
    return { message: 'Đã xác nhận hoàn thành nhiệm vụ' };
  }
};
