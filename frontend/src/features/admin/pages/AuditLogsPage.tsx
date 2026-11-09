import React, { useEffect, useState } from 'react';
import { 
  RefreshCw,
  LogOut
} from 'lucide-react';
import { adminApi } from '../services/adminApi';
import { AuditLogItem, UserSessionItem } from '../types/admin.types';

export const AuditLogsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'logs' | 'sessions'>('logs');
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [sessions, setSessions] = useState<UserSessionItem[]>([]);
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAuditLogs(page, 15, actionFilter || undefined);
      setLogs(res.items);
      setTotalCount(res.totalCount);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getActiveSessions();
      setSessions(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs();
    } else {
      loadSessions();
    }
  }, [activeTab, page, actionFilter]);

  const handleRevokeSession = async (sessionId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn buộc đăng xuất phiên làm việc này?')) {
      try {
        await adminApi.revokeSession(sessionId);
        alert('Đã thu hồi phiên đăng nhập thành công!');
        loadSessions();
      } catch (err: any) {
        alert(err.message || 'Lỗi khi thu hồi phiên');
      }
    }
  };

  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Nhật ký Hệ thống & Giám sát Phiên (Audit & Security)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ghi vết toàn bộ hành vi người dùng, phục vụ công tác an toàn thông tin và giải trình kiểm toán.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-200/70 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'logs' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Nhật ký Hoạt động (Audit Logs)
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'sessions' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Phiên đăng nhập ({sessions.length})
          </button>
        </div>
      </div>

      {activeTab === 'logs' ? (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-500">Lọc theo hành động:</span>
              <select
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
              >
                <option value="">-- Tất cả hành động --</option>
                <option value="LOGIN">Đăng nhập (LOGIN)</option>
                <option value="CREATE_USER">Tạo người dùng (CREATE_USER)</option>
                <option value="UPDATE_USER">Cập nhật người dùng (UPDATE_USER)</option>
                <option value="LOCK_USER">Khóa tài khoản (LOCK_USER)</option>
                <option value="RESET_PASSWORD">Đặt lại mật khẩu (RESET_PASSWORD)</option>
                <option value="UPDATE_ROLE_PERMISSIONS">Đổi phân quyền (UPDATE_ROLE_PERMISSIONS)</option>
                <option value="CREATE_APPROVAL_REQUEST">Tạo đơn phê duyệt</option>
                <option value="APPROVE_REQUEST">Phê duyệt đơn</option>
              </select>
            </div>

            <button
              onClick={loadLogs}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Logs Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Thời gian</th>
                    <th className="py-3 px-4">Hành động</th>
                    <th className="py-3 px-4">Người thực hiện</th>
                    <th className="py-3 px-4">Đối tượng tác động</th>
                    <th className="py-3 px-4">Chi tiết thao tác</th>
                    <th className="py-3 px-4">Địa chỉ IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400">
                        {loading ? 'Đang truy vấn...' : 'Chưa có bản ghi nhật ký phù hợp.'}
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {new Date(log.createdAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {log.userFullName || 'System Admin'}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {log.entityName || '---'} {log.entityId ? `(#${log.entityId.substring(0, 8)})` : ''}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={log.details || ''}>
                          {log.details || '---'}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                          {log.ipAddress || '127.0.0.1'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <div>Tổng cộng {totalCount} sự kiện đã lưu</div>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 font-medium"
                >
                  Trước
                </button>
                <button
                  disabled={page >= Math.ceil(totalCount / 15)}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 font-medium"
                >
                  Sau
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Sessions Table */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Danh sách các token đăng nhập còn hiệu lực trên các thiết bị
            </div>
            <button
              onClick={loadSessions}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Tài khoản</th>
                  <th className="py-3 px-4">IP / Địa điểm</th>
                  <th className="py-3 px-4">Thiết bị / Trình duyệt</th>
                  <th className="py-3 px-4">Đăng nhập lúc</th>
                  <th className="py-3 px-4">Hết hạn vào</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400">
                      Không có phiên làm việc nào đang kích hoạt.
                    </td>
                  </tr>
                ) : (
                  sessions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {s.userFullName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                        {s.ipAddress || '127.0.0.1'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate" title={s.userAgent || ''}>
                        {s.userAgent || 'Chrome Windows'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {new Date(s.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {new Date(s.expiresAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleRevokeSession(s.id)}
                          className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-[10px] font-semibold transition-all flex items-center gap-1 ml-auto"
                        >
                          <LogOut className="w-3 h-3" />
                          Thu hồi phiên
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
