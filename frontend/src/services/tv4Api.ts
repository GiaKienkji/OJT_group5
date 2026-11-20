
const API_BASE = '/api';

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('soms_access_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      detail = typeof body === 'string' ? body : JSON.stringify(body);
    } catch {
      detail = res.statusText;
    }
    throw new ApiError(detail || res.statusText, res.status);
  }
  if (res.status === 204) return undefined as unknown as T;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return (await res.json()) as T;
  return (await res.text()) as unknown as T;
}

const request = <T>(path: string, init?: RequestInit): Promise<T> =>
  fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...getAuthHeaders(), ...(init?.headers || {}) },
  }).then((r) => handleResponse<T>(r));

// ================= TYPES =================

type Params = Record<string, string | number | boolean | undefined>;

export interface FinanceMe {
  user_id: string;
  full_name: string;
  phone?: string | null;
  avatar_path?: string | null;
}

export interface LookupResult {
  AcademicYears: { id: string; name: string }[];
  Semesters: { id: string; name: string; code: string; academic_year_id: string }[];
  Grades: { id: string; code: string; name: string }[];
  Classes: { id: string; code: string; name: string; academic_year_id: string; grade_level_id: string }[];
  Students: { id: string; code: string; name: string; class_id: string; class_name: string }[];
}

export interface FinanceDashboard {
  total_collected: string;
  outstanding_debt: string;
  active_campaigns: string;
  payments_today: string;
  unreconciled_transactions: string;
}

export interface FeeCategory {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
}
export interface FeeCategoryCreate { code: string; name: string; is_active?: boolean; }

export interface FeeCampaign {
  id: string;
  name: string;
  academic_year_id: string;
  semester_id?: string | null;
  due_on?: string | null;
  status: string;
  academic_year_name?: string;
}
export interface FeeCampaignCreate {
  name: string;
  academicYearId: string;
  semesterId?: string;
  dueDate?: string;
  status?: string;
}

export interface CampaignRule {
  id: string;
  fee_category_id: string;
  grade_level_id?: string | null;
  class_id?: string | null;
  amount: number;
  due_date?: string | null;
}
export interface CampaignRuleSave {
  feeCategoryId: string;
  gradeLevelId?: string;
  classId?: string;
  amount: number;
  dueDate?: string;
}

export interface FeeAssignment {
  id: string;
  student_id: string;
  student_name: string;
  class_name: string;
  fee_name: string;
  amount: number;
  discount: number;
  amount_due: number;
  amount_paid: number;
  balance: number;
  status: 'unpaid' | 'partially_paid' | 'paid';
  due_date?: string | null;
  overdue: boolean;
  campaign_id: string;
  campaign_name: string;
}
export interface FeeAssignmentFilters extends Params {}

export interface Exemption {
  id: string;
  amount: number;
  reason: string;
  status: string;
  created_at: string;
}
export interface ExemptionCreate { amount: number; reason: string; }
export interface ExemptionDecision { decision: 'approved' | 'rejected'; reason?: string; }

export interface Notice {
  id: string;
  title: string;
  message: string;
  created_at: string;
  sent_at?: string | null;
}
export interface NoticeCreate { title: string; message: string; }

export interface Payment {
  id: string;
  student_id: string;
  student_name: string;
  student_code: string;
  class_name: string;
  amount: number;
  method: 'cash' | 'bank_transfer' | 'gateway';
  status: 'pending' | 'verified' | 'rejected' | 'refunded';
  paid_at?: string | null;
  recorded_by_name?: string | null;
  verified_by_name?: string | null;
  allocations: { chargeId: string; amount: number }[];
  adjustments: unknown[];
}
export interface PaymentCreate {
  studentId: string;
  amount: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'gateway';
  paidAt?: string;
  allocations: { chargeId: string; amount: number }[];
}
export interface PaymentVerify { decision: 'verified' | 'rejected'; reason?: string; }

export interface BankTransaction {
  id: string;
  transaction_id?: string;
  reference?: string | null;
  amount: number;
  transaction_at?: string | null;
  description?: string | null;
  status: string;
}
export interface BankTxImport {
  source: string;
  transactions: {
    transactionId: string;
    reference?: string;
    amount: number;
    transactionAt: string;
    description?: string;
  }[];
}
export interface ReconcileMatch { bankTransactionId: string; paymentId: string; }

export interface Adjustment {
  id: string;
  payment_id: string;
  type: 'refund' | 'correction';
  amount: number;
  reason: string;
  status: string;
}
export interface AdjustmentCreate { paymentId: string; type: 'refund' | 'correction'; amount: number; reason: string; }
export interface AdjustmentDecision { decision: string; reason?: string; }

export interface Receipt { id: string; payment_id: string; receipt_no?: string; created_at: string; }

export type ReportRow = Record<string, unknown>;
export interface ReportExport { reportType: string; format: string; filters: Params; }

// ================= FACILITY =================

export interface Room {
  id: string;
  code: string;
  name?: string | null;
  room_type: string;
  capacity: number;
  status: 'available' | 'maintenance' | 'closed';
}
export interface RoomCreate { code: string; name?: string; roomType: string; capacity: number; status?: string; }

export interface AssetCategory { id: string; name: string; is_active: boolean; }

export interface Asset {
  id: string;
  code: string;
  name: string;
  category: string;
  serial_number?: string | null;
  room_id?: string | null;
  room_name?: string | null;
  status: 'working' | 'damaged' | 'maintenance' | 'retired' | 'lost';
  condition?: string | null;
  notes?: string | null;
}
export interface AssetCreate {
  code: string;
  name: string;
  category: string;
  serialNumber?: string;
  roomId?: string;
  status?: string;
  condition?: string;
  notes?: string;
}
export interface AssetAssign { assetId: string; roomId?: string; note?: string; }
export interface AssetCondition { condition: string; status: string; note?: string; }
export type AssetHistoryRow = Record<string, unknown>;

export interface Inventory {
  id: string;
  title: string;
  observations: { assetId: string; observedRoomId?: string; condition: string; status: string; present: boolean }[];
}
export interface InventoryCreate {
  title: string;
  observations: { assetId: string; observedRoomId?: string; condition: string; status: string; present: boolean }[];
}

export interface BorrowRequest {
  id: string;
  asset_id: string;
  purpose: string;
  due_at?: string | null;
  status: string;
}
export interface BorrowRequestCreate { assetId: string; purpose: string; dueAt?: string; }

export interface Incident {
  id: string;
  asset_id: string;
  asset_code: string;
  asset_name: string;
  reported_by: string;
  reported_by_name: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
}
export interface IncidentCreate { assetId: string; description: string; severity: 'low' | 'medium' | 'high' | 'critical'; }

export interface RepairRequest {
  id: string;
  asset_id: string;
  asset_code: string;
  asset_name: string;
  title: string;
  status: string;
  scheduled_for?: string | null;
  incident_id?: string | null;
  repeat_interval_months?: number | null;
  result_condition?: string | null;
  result_status?: string | null;
  completed_by?: string | null;
}
export interface RepairRequestCreate { incidentId: string; title: string; scheduledFor?: string; }

export interface Handler { user_id: string; code: string; name: string; }
export interface RepairHandler { staffId: string; note?: string; }
export interface RepairProgress { progressNote: string; }
export interface RepairResult { result: string; cost: number; condition: string; status: string; }

export interface Maintenance {
  id: string;
  asset_id: string;
  title: string;
  maintenance_date?: string | null;
  repeat_interval_months?: number | null;
  status: string;
}
export interface MaintenanceCreate { assetId: string; title: string; maintenanceDate: string; repeatIntervalMonths?: number; }

export interface Proposal {
  id: string;
  type: string;
  title: string;
  description: string;
  quantity: number;
  estimated_cost?: number | null;
  asset_id?: string | null;
  status: string;
}
export interface ProposalCreate { type: string; title: string; description: string; quantity: number; estimatedCost?: number; assetId?: string; }
export interface ProposalDecision { decision: 'approved' | 'rejected'; reason?: string; }

export interface FacilityStats {
  summary: {
    room_count: number;
    asset_count: number;
    assets_needing_repair: number;
    open_repair_requests: number;
    maintenance_due_count: number;
    pending_proposals: number;
  };
  incidents: { severity: string; status: string; count: number }[];
}

// ================= FINANCE API =================

export const financeApi = {
  getMe: (): Promise<FinanceMe> => request<FinanceMe>('/finance/me'),
  updateMe: (body: { fullName: string; phone: string }): Promise<FinanceMe> =>
    request<FinanceMe>('/finance/me', { method: 'PUT', body: JSON.stringify(body) }),

  getLookups: (params?: Params): Promise<LookupResult> => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<LookupResult>(`/finance/lookups${qs ? '?' + qs : ''}`);
  },

  getDashboard: (): Promise<FinanceDashboard> => request<FinanceDashboard>('/finance/dashboard'),

  getFeeCategories: (): Promise<FeeCategory[]> => request<FeeCategory[]>('/finance/fee-categories'),
  createFeeCategory: (body: FeeCategoryCreate): Promise<FeeCategory> =>
    request<FeeCategory>('/finance/fee-categories', { method: 'POST', body: JSON.stringify(body) }),
  updateFeeCategory: (id: string, body: FeeCategoryCreate): Promise<FeeCategory> =>
    request<FeeCategory>(`/finance/fee-categories/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  getFeeCampaigns: (): Promise<FeeCampaign[]> => request<FeeCampaign[]>('/finance/fee-campaigns'),
  createFeeCampaign: (body: FeeCampaignCreate): Promise<FeeCampaign> =>
    request<FeeCampaign>('/finance/fee-campaigns', { method: 'POST', body: JSON.stringify(body) }),
  updateFeeCampaign: (id: string, body: FeeCampaignCreate): Promise<FeeCampaign> =>
    request<FeeCampaign>(`/finance/fee-campaigns/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  getCampaignRules: (campaignId: string): Promise<CampaignRule[]> =>
    request<CampaignRule[]>(`/finance/fee-campaigns/${campaignId}/rules`),
  saveCampaignRules: (campaignId: string, body: CampaignRuleSave[]): Promise<CampaignRule[]> =>
    request<CampaignRule[]>(`/finance/fee-campaigns/${campaignId}/rules`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  createCampaignAssignments: (
    campaignId: string,
    body: { studentIds: string[] },
  ): Promise<{ createdCount: number; duplicateCount: number }> =>
    request(`/finance/fee-campaigns/${campaignId}/assignments`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getFeeAssignments: (filters?: FeeAssignmentFilters): Promise<FeeAssignment[]> => {
    const qs = new URLSearchParams(filters as Record<string, string>).toString();
    return request<FeeAssignment[]>(`/finance/fee-assignments${qs ? '?' + qs : ''}`);
  },
  getDebts: (filters?: FeeAssignmentFilters): Promise<FeeAssignment[]> => {
    const qs = new URLSearchParams(filters as Record<string, string>).toString();
    return request<FeeAssignment[]>(`/finance/debts${qs ? '?' + qs : ''}`);
  },

  getExemptions: (chargeId: string): Promise<Exemption[]> =>
    request<Exemption[]>(`/finance/fee-assignments/${chargeId}/exemptions`),
  createExemption: (chargeId: string, body: ExemptionCreate): Promise<Exemption> =>
    request<Exemption>(`/finance/fee-assignments/${chargeId}/exemptions`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  decideExemption: (exemptionId: string, body: ExemptionDecision): Promise<FeeAssignment> =>
    request<FeeAssignment>(`/finance/exemptions/${exemptionId}/decision`, { method: 'POST', body: JSON.stringify(body) }),

  getNotices: (campaignId: string): Promise<Notice[]> =>
    request<Notice[]>(`/finance/fee-campaigns/${campaignId}/notices`),
  createNotice: (campaignId: string, body: NoticeCreate): Promise<Notice> =>
    request<Notice>(`/finance/fee-campaigns/${campaignId}/notices`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  sendNotice: (noticeId: string): Promise<{ recipientCount: number; notificationIds: string[] }> =>
    request(`/finance/notices/${noticeId}/send`, { method: 'POST' }),
  sendReminder: (
    chargeId: string,
    body: { channel?: string; message?: string; requestKey?: string },
  ): Promise<{ recipientCount: number; notificationIds: string[] }> =>
    request(`/finance/debts/${chargeId}/reminder`, { method: 'POST', body: JSON.stringify(body) }),

  getPayments: (params?: { studentId?: string; status?: string }): Promise<Payment[]> => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<Payment[]>(`/finance/payments${qs ? '?' + qs : ''}`);
  },
  createPayment: (body: PaymentCreate): Promise<Payment> =>
    request<Payment>('/finance/payments', { method: 'POST', body: JSON.stringify(body) }),
  verifyPayment: (paymentId: string, body: PaymentVerify): Promise<Payment> =>
    request<Payment>(`/finance/payments/${paymentId}/verify`, { method: 'POST', body: JSON.stringify(body) }),

  getBankTransactions: (params?: { status?: string }): Promise<BankTransaction[]> => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<BankTransaction[]>(`/finance/bank-transactions${qs ? '?' + qs : ''}`);
  },
  importBankTransactions: (body: BankTxImport): Promise<unknown> =>
    request('/finance/bank-transactions/import', { method: 'POST', body: JSON.stringify(body) }),
  reconcile: (matches: ReconcileMatch[]): Promise<unknown> =>
    request('/finance/payments/reconcile', { method: 'POST', body: JSON.stringify({ matches }) }),

  getAdjustments: (): Promise<Adjustment[]> => request<Adjustment[]>('/finance/adjustments'),
  createAdjustment: (body: AdjustmentCreate): Promise<Adjustment> =>
    request<Adjustment>('/finance/adjustments', { method: 'POST', body: JSON.stringify(body) }),
  decideAdjustment: (id: string, body: AdjustmentDecision): Promise<{ id: string; status: string }> =>
    request(`/finance/adjustments/${id}/decision`, { method: 'POST', body: JSON.stringify(body) }),
  executeAdjustment: (id: string): Promise<unknown> =>
    request(`/finance/adjustments/${id}/execute`, { method: 'POST' }),

  getReceipt: (paymentId: string): Promise<Receipt> => request<Receipt>(`/finance/receipts/${paymentId}`),
  createReceipt: (paymentId: string): Promise<Receipt> =>
    request<Receipt>(`/finance/receipts/${paymentId}`, { method: 'POST' }),
  downloadReceipt: (id: string): Promise<Blob> =>
    fetch(`${API_BASE}/finance/receipts/${id}/download`, { headers: getAuthHeaders() }).then((r) => {
      if (!r.ok) throw new ApiError(r.statusText, r.status);
      return r.blob();
    }),

  getPaymentHistory: (params?: { studentId?: string }): Promise<Payment[]> => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<Payment[]>(`/finance/payment-history${qs ? '?' + qs : ''}`);
  },

  getReports: (filters?: Params): Promise<ReportRow[]> => {
    const qs = new URLSearchParams(filters as Record<string, string>).toString();
    return request<ReportRow[]>(`/finance/reports${qs ? '?' + qs : ''}`);
  },
  exportReport: (body: ReportExport): Promise<Blob> =>
    fetch(`${API_BASE}/finance/reports/export`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((r) => {
      if (!r.ok) throw new ApiError(r.statusText, r.status);
      return r.blob();
    }),
};

// ================= FACILITY API =================

export const facilityApi = {
  getRooms: (): Promise<Room[]> => request<Room[]>('/facility/rooms'),
  createRoom: (body: RoomCreate): Promise<Room> =>
    request<Room>('/facility/rooms', { method: 'POST', body: JSON.stringify(body) }),
  updateRoom: (id: string, body: RoomCreate): Promise<Room> =>
    request<Room>(`/facility/rooms/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  getAssetCategories: (): Promise<AssetCategory[]> => request<AssetCategory[]>('/facility/assets/categories'),
  createAssetCategory: (body: { name: string; is_active?: boolean }): Promise<AssetCategory> =>
    request<AssetCategory>('/facility/assets/categories', { method: 'POST', body: JSON.stringify(body) }),
  updateAssetCategory: (id: string, body: { name: string; is_active?: boolean }): Promise<AssetCategory> =>
    request<AssetCategory>(`/facility/assets/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  getAssets: (params?: { roomId?: string; category?: string; status?: string }): Promise<Asset[]> => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<Asset[]>(`/facility/assets${qs ? '?' + qs : ''}`);
  },
  createAsset: (body: AssetCreate): Promise<Asset> =>
    request<Asset>('/facility/assets', { method: 'POST', body: JSON.stringify(body) }),
  updateAsset: (id: string, body: AssetCreate): Promise<Asset> =>
    request<Asset>(`/facility/assets/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  assignAsset: (body: AssetAssign): Promise<unknown> =>
    request('/facility/assets/assign', { method: 'POST', body: JSON.stringify(body) }),
  setAssetCondition: (id: string, body: AssetCondition): Promise<Asset> =>
    request<Asset>(`/facility/assets/${id}/condition`, { method: 'POST', body: JSON.stringify(body) }),
  getAssetHistory: (id: string): Promise<AssetHistoryRow[]> =>
    request<AssetHistoryRow[]>(`/facility/assets/${id}/history`),

  getInventory: (params?: { roomId?: string; category?: string; status?: string }): Promise<Inventory[]> => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<Inventory[]>(`/facility/inventory${qs ? '?' + qs : ''}`);
  },
  createInventory: (body: InventoryCreate): Promise<Inventory> =>
    request<Inventory>('/facility/inventory', { method: 'POST', body: JSON.stringify(body) }),
  getInventoryDetail: (id: string): Promise<Inventory> =>
    request<Inventory>(`/facility/inventory/${id}`),

  getBorrowRequests: (): Promise<BorrowRequest[]> => request<BorrowRequest[]>('/facility/borrow-requests'),
  createBorrowRequest: (body: BorrowRequestCreate): Promise<BorrowRequest> =>
    request<BorrowRequest>('/facility/borrow-requests', { method: 'POST', body: JSON.stringify(body) }),
  handoverBorrow: (id: string, body?: { note?: string }): Promise<unknown> =>
    request(`/facility/borrow-requests/${id}/handover`, { method: 'POST', body: JSON.stringify(body || {}) }),
  returnBorrow: (id: string, body: { condition: string; status: string; note?: string }): Promise<unknown> =>
    request(`/facility/borrow-requests/${id}/return`, { method: 'POST', body: JSON.stringify(body) }),

  getIncidents: (): Promise<Incident[]> => request<Incident[]>('/facility/incidents'),
  createIncident: (body: IncidentCreate): Promise<Incident> =>
    request<Incident>('/facility/incidents', { method: 'POST', body: JSON.stringify(body) }),
  setIncidentSeverity: (
    id: string,
    body: { severity: 'low' | 'medium' | 'high' | 'critical' },
  ): Promise<Incident> =>
    request<Incident>(`/facility/incidents/${id}/severity`, { method: 'POST', body: JSON.stringify(body) }),

  getRepairRequests: (params?: { assetId?: string }): Promise<RepairRequest[]> => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<RepairRequest[]>(`/facility/repair-requests${qs ? '?' + qs : ''}`);
  },
  createRepairRequest: (body: RepairRequestCreate): Promise<RepairRequest> =>
    request<RepairRequest>('/facility/repair-requests', { method: 'POST', body: JSON.stringify(body) }),
  assignRepairHandler: (id: string, body: RepairHandler): Promise<Handler> =>
    request<Handler>(`/facility/repair-requests/${id}/handler`, { method: 'POST', body: JSON.stringify(body) }),
  addRepairProgress: (id: string, body: RepairProgress): Promise<unknown> =>
    request(`/facility/repair-requests/${id}/progress`, { method: 'POST', body: JSON.stringify(body) }),
  setRepairResult: (id: string, body: RepairResult): Promise<unknown> =>
    request(`/facility/repair-requests/${id}/result`, { method: 'POST', body: JSON.stringify(body) }),
  completeRepairRequest: (id: string): Promise<unknown> =>
    request(`/facility/repair-requests/${id}/complete`, { method: 'POST' }),

  getMaintenance: (params?: { assetId?: string; status?: string }): Promise<Maintenance[]> => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<Maintenance[]>(`/facility/maintenance${qs ? '?' + qs : ''}`);
  },
  createMaintenance: (body: MaintenanceCreate): Promise<Maintenance> =>
    request<Maintenance>('/facility/maintenance', { method: 'POST', body: JSON.stringify(body) }),
  assignMaintenanceHandler: (id: string, body: RepairHandler): Promise<Handler> =>
    request<Handler>(`/facility/maintenance/${id}/handler`, { method: 'POST', body: JSON.stringify(body) }),
  setMaintenanceResult: (id: string, body: RepairResult): Promise<unknown> =>
    request(`/facility/maintenance/${id}/result`, { method: 'POST', body: JSON.stringify(body) }),

  getProposals: (): Promise<Proposal[]> => request<Proposal[]>('/facility/proposals'),
  createProposal: (body: ProposalCreate): Promise<Proposal> =>
    request<Proposal>('/facility/proposals', { method: 'POST', body: JSON.stringify(body) }),
  decideProposal: (id: string, body: ProposalDecision): Promise<{ id: string; status: string }> =>
    request(`/facility/proposals/${id}/decision`, { method: 'POST', body: JSON.stringify(body) }),

  getRepairHistory: (params?: { assetId?: string }): Promise<RepairRequest[]> => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<RepairRequest[]>(`/facility/repair-history${qs ? '?' + qs : ''}`);
  },

  getStats: (): Promise<FacilityStats> => request<FacilityStats>('/facility/stats'),
  getHandlers: (): Promise<Handler[]> => request<Handler[]>('/facility/handlers'),

  exportReport: (body: {
    reportType: string;
    format: string;
    roomId?: string;
    category?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<Blob> =>
    fetch(`${API_BASE}/facility/reports/export`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((r) => {
      if (!r.ok) throw new ApiError(r.statusText, r.status);
      return r.blob();
    }),
};

export { ApiError };
