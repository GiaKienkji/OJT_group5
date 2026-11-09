import React, { useEffect, useState } from 'react';
import { 
  Check, 
  X, 
  RefreshCw
} from 'lucide-react';
import { managementApi } from '../services/managementApi';
import { ApprovalRequestItem } from '../types/management.types';

export const ApprovalCenterPage: React.FC = () => {
  const [requests, setRequests] = useState<ApprovalRequestItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequestItem | null>(null);
  const [decisionModal, setDecisionModal] = useState<{ open: boolean; type: 'approved' | 'rejected' }>({ open: false, type: 'approved' });
  const [decisionNote, setDecisionNote] = useState('');
  const [loading, setLoading] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await managementApi.getApprovalRequests({
        status: statusFilter || undefined,
        requestType: typeFilter || undefined
      });
      setRequests(res);
      if (res.length > 0 && !selectedRequest) {
        setSelectedRequest(res[0]);
      } else if (selectedRequest) {
        const updated = res.find(r => r.id === selectedRequest.id);
        setSelectedRequest(updated || res[0] || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [statusFilter, typeFilter]);

  const handleDecisionSubmit = async () => {
    if (!selectedRequest) return;
    try {
      await managementApi.processDecision(selectedRequest.id, {
        decision: decisionModal.type,
        note: decisionNote
      });
      alert(`Đã xử lý hồ sơ thành công: [${decisionModal.type === 'approved' ? 'Phê duyệt' : 'Từ chối'}]`);
      setDecisionModal({ open: false, type: 'approved' });
      setDecisionNote('');
      loadRequests();
    } catch (err: any) {
      alert(err.message || 'Lỗi xử lý hồ sơ');
    }
  };

  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Trung tâm Xét duyệt Hồ sơ & Đơn từ (Approval Engine - BF04)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Phê duyệt kế hoạch giảng dạy, thời khóa biểu, đơn nghỉ phép, đổi tiết và đề xuất cơ sở vật chất toàn trường.
          </p>
        </div>

        <button
          onClick={loadRequests}
          className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {['pending', 'approved', 'rejected', ''].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === s
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s === 'pending' ? 'Chờ duyệt' : s === 'approved' ? 'Đã duyệt' : s === 'rejected' ? 'Đã từ chối' : 'Tất cả'}
            </button>
          ))}
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
        >
          <option value="">-- Tất cả loại hồ sơ --</option>
          <option value="leave_teacher">Nghỉ phép giáo viên (TV3)</option>
          <option value="timetable_change">Đổi tiết giảng dạy (TV2)</option>
          <option value="substitute_teaching">Đề xuất dạy thay (TV2)</option>
          <option value="facility_purchase">Đề xuất mua sắm CSVC (TV4)</option>
          <option value="facility_repair">Báo hỏng / Sửa chữa CSVC (TV4)</option>
          <option value="leave_student">Học sinh xin nghỉ (TV5)</option>
        </select>
      </div>

      {/* Content Split: List & Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Requests List */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {requests.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-xs">
              {loading ? 'Đang tải dữ liệu...' : 'Không có hồ sơ nào phù hợp bộ lọc.'}
            </div>
          ) : (
            requests.map((r) => {
              const isSelected = selectedRequest?.id === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRequest(r)}
                  className={`p-4 cursor-pointer transition-all ${
                    isSelected ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[10px] text-slate-400 font-semibold">{r.requestCode}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      r.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : r.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                    }`}>
                      {r.status === 'pending' ? 'Chờ duyệt' : r.status === 'approved' ? 'Đã duyệt' : 'Từ chối'}
                    </span>
                  </div>

                  <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{r.title}</h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                    <span>{r.requesterName} ({r.requestTypeNameVi})</span>
                    <span>{new Date(r.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Request Detail Panel */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          {selectedRequest ? (
            <>
              {/* Header Info */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-indigo-600">{selectedRequest.requestCode}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-600">
                      {selectedRequest.requestTypeNameVi}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedRequest.title}</h3>
                </div>

                {selectedRequest.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDecisionModal({ open: true, type: 'rejected' })}
                      className="px-3.5 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <X className="w-4 h-4" />
                      Từ chối
                    </button>
                    <button
                      onClick={() => setDecisionModal({ open: true, type: 'approved' })}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <Check className="w-4 h-4" />
                      Phê duyệt ngay
                    </button>
                  </div>
                )}
              </div>

              {/* Meta details */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block mb-0.5">Người khởi tạo yêu cầu</span>
                  <span className="font-semibold text-slate-800">{selectedRequest.requesterName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Thời gian gửi</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(selectedRequest.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nội dung chi tiết</h4>
                <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200/70 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selectedRequest.description || 'Không có mô tả kèm theo.'}
                </div>
              </div>

              {/* Audit history */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Lịch sử thẩm định & Phê duyệt</h4>
                <div className="space-y-2">
                  {selectedRequest.histories.map((h) => (
                    <div key={h.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                          ✓
                        </div>
                        <div>
                          <span className="font-semibold text-slate-800">{h.actorName}</span>: {h.note || h.action}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(h.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              Chọn một hồ sơ từ danh sách bên trái để xem chi tiết.
            </div>
          )}
        </div>
      </div>

      {/* Modal Decision */}
      {decisionModal.open && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {decisionModal.type === 'approved' ? 'Phê duyệt Yêu cầu' : 'Từ chối Yêu cầu'}
            </h3>
            <p className="text-xs text-slate-500">
              Bạn đang thực hiện thao tác đối với hồ sơ <strong>{selectedRequest.title}</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi chú / Ý kiến chỉ đạo của BGH</label>
              <textarea
                rows={3}
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
                placeholder="Nhập ghi chú hoặc lý do phê duyệt/từ chối..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDecisionModal({ open: false, type: 'approved' })}
                className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDecisionSubmit}
                className={`px-4 py-2 text-white rounded-xl text-xs font-semibold shadow-xs ${
                  decisionModal.type === 'approved' ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
