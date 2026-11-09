import React, { useEffect, useState } from 'react';
import { 
  Users, 
  GraduationCap, 
  Clock, 
  DollarSign, 
  AlertTriangle, 
  Sparkles,
  ArrowUpRight,
  FileCheck
} from 'lucide-react';
import { managementApi } from '../services/managementApi';
import { ExecutiveDashboardSummary } from '../types/management.types';

interface ExecutiveDashboardPageProps {
  onNavigateTab: (tab: string) => void;
}

export const ExecutiveDashboardPage: React.FC<ExecutiveDashboardPageProps> = ({ onNavigateTab }) => {
  const [data, setData] = useState<ExecutiveDashboardSummary | null>(null);

  const loadDashboard = async () => {
    try {
      const res = await managementApi.getExecutiveSummary();
      setData(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Hệ thống Quản trị & Điều hành Trường học Toàn diện (SOMS)
          </div>
          <h2 className="text-2xl font-bold">Bảng Điều Hành Ban Giám Hiệu</h2>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Giám sát chất lượng đào tạo, chuyên cần, nhân sự giảng dạy và duyệt các đề xuất vận hành liên phòng ban.
          </p>
        </div>
        <div className="hidden lg:flex items-center gap-3">
          <button 
            onClick={() => onNavigateTab('approvals')}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-md shadow-indigo-600/30"
          >
            <FileCheck className="w-4 h-4" />
            Xét duyệt hồ sơ ({data?.kpis.pendingApprovalsCount || 0})
          </button>
        </div>
      </div>

      {/* 4 Core KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase">Sĩ số Học sinh</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{data?.kpis.totalStudents || 850}</div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1 font-medium">
            <span>24 Lớp học (Khối 10, 11, 12)</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase">Chuyên cần hôm nay</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-600">
            {data?.attendanceToday.presentRatePercent || 97.2}%
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            Vắng: {data?.attendanceToday.totalAbsentToday || 21} (Có phép: {data?.attendanceToday.excusedAbsent || 18})
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase">Hồ sơ chờ phê duyệt</span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-rose-600">
            {data?.kpis.pendingApprovalsCount || 3}
          </div>
          <div className="mt-2 text-xs text-rose-600 font-medium flex items-center gap-1">
            <span>Cần BGH xem xét ký duyệt</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase">Thu học phí học kỳ</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {data?.finance.collectionRatePercent || 89.1}%
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            Đã thu: 2.85 tỷ / 3.20 tỷ VNĐ
          </div>
        </div>
      </div>

      {/* Urgent Alerts & AI Suggestions */}
      {data?.urgentAlerts && data.urgentAlerts.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Cảnh báo Điều hành & Khuyến nghị Trợ lý AI (MGT-29 → MGT-32)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.urgentAlerts.map((alert) => (
              <div 
                key={alert.id}
                className={`p-4 rounded-xl border text-xs flex flex-col justify-between ${
                  alert.type === 'danger'
                    ? 'bg-rose-50/50 border-rose-200 text-rose-900'
                    : alert.type === 'warning'
                      ? 'bg-amber-50/50 border-amber-200 text-amber-900'
                      : 'bg-indigo-50/50 border-indigo-200 text-indigo-900'
                }`}
              >
                <div>
                  <div className="font-bold flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-current" />
                    {alert.title}
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">{alert.message}</p>
                </div>
                {alert.actionUrl && (
                  <button 
                    onClick={() => onNavigateTab(alert.actionUrl!.includes('approvals') ? 'approvals' : 'tasks')}
                    className="mt-3 font-semibold underline text-left hover:opacity-80"
                  >
                    Xem chi tiết →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Approvals & Tasks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Approvals Preview */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Hồ sơ chờ BGH phê duyệt (BF04)</h3>
              <p className="text-xs text-slate-500">Đơn nghỉ giáo viên, dự thảo TKB, đề xuất mua sắm CSVC</p>
            </div>
            <button 
              onClick={() => onNavigateTab('approvals')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              Xem tất cả <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {data?.pendingApprovals && data.pendingApprovals.length > 0 ? (
              data.pendingApprovals.map((req) => (
                <div key={req.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-800">{req.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {req.requestTypeNameVi}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Người đề xuất: <strong>{req.requesterName}</strong> • {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                  <button 
                    onClick={() => onNavigateTab('approvals')}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs"
                  >
                    Ký duyệt
                  </button>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs">
                Không có hồ sơ nào đang chờ duyệt.
              </div>
            )}
          </div>
        </div>

        {/* School Tasks Preview */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Nhiệm vụ & Tiến độ Đang triển khai (BF08)</h3>
              <p className="text-xs text-slate-500">BGH giao cho Tổ trưởng chuyên môn và Cơ sở vật chất</p>
            </div>
            <button 
              onClick={() => onNavigateTab('tasks')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              Quản lý việc <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {data?.activeTasks && data.activeTasks.length > 0 ? (
              data.activeTasks.map((task) => (
                <div key={task.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900">{task.title}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                      {task.categoryNameVi}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Phụ trách: {task.assignments[0]?.assigneeName || 'Tổ bộ môn'}</span>
                    <span>Hạn chót: {task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : 'Trong tuần'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs">
                Tất cả nhiệm vụ đã hoàn tất.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
