export interface ExecutiveDashboardSummary {
  kpis: SchoolKpis;
  attendanceToday: AttendanceMetric;
  finance: FinanceSummary;
  academicProgress: AcademicProgress;
  urgentAlerts: AlertItem[];
  pendingApprovals: ApprovalRequestItem[];
  activeTasks: SchoolTaskItem[];
}

export interface SchoolKpis {
  totalStudents: number;
  totalTeachers: number;
  totalStaff: number;
  totalClasses: number;
  pendingApprovalsCount: number;
  activeTasksCount: number;
  overdueTasksCount: number;
}

export interface AttendanceMetric {
  presentRatePercent: number;
  totalAbsentToday: number;
  excusedAbsent: number;
  unexcusedAbsent: number;
}

export interface FinanceSummary {
  totalExpectedRevenue: number;
  totalCollectedRevenue: number;
  outstandingDebt: number;
  collectionRatePercent: number;
}

export interface AcademicProgress {
  teachingScheduleCompletedPercent: number;
  gradesEnteredPercent: number;
  upcomingExamsCount: number;
}

export interface AlertItem {
  id: string;
  type: 'info' | 'warning' | 'danger';
  title: string;
  message: string;
  timestamp: string;
  actionUrl?: string;
}

export interface ApprovalRequestItem {
  id: string;
  requestCode: string;
  requestType: string;
  requestTypeNameVi: string;
  requesterId: string;
  requesterName: string;
  requesterRole?: string;
  title: string;
  description?: string;
  payloadJson?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  finalDecisionAt?: string;
  histories: ApprovalHistoryItem[];
}

export interface ApprovalHistoryItem {
  id: string;
  action: string;
  actorName: string;
  note?: string;
  createdAt: string;
}

export interface CreateApprovalInput {
  schoolId: string;
  requestType: string;
  title: string;
  description?: string;
  payloadJson?: string;
  priority?: string;
}

export interface ApprovalDecisionInput {
  decision: 'approved' | 'rejected';
  note?: string;
}

export interface SchoolTaskItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  categoryNameVi: string;
  createdBy: string;
  creatorName: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  assignments: TaskAssignmentItem[];
}

export interface TaskAssignmentItem {
  id: string;
  assigneeId: string;
  assigneeName: string;
  roleInTask: string;
  progressPercent: number;
  note?: string;
  assignedAt: string;
}

export interface CreateTaskInput {
  schoolId: string;
  title: string;
  description?: string;
  category?: string;
  priority?: string;
  dueDate?: string;
  assigneeIds: string[];
}

