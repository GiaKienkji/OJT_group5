import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Plus, 
  Lock, 
  Unlock, 
  KeyRound, 
  Download, 
  X,
  RefreshCw
} from 'lucide-react';
import { adminApi } from '../services/adminApi';
import { UserItem, CreateUserInput } from '../types/admin.types';

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [newPassword, setNewPassword] = useState('Soms@2026');

  // Form state
  const [createForm, setCreateForm] = useState<CreateUserInput>({
    fullName: '',
    email: '',
    phone: '',
    password: 'Soms@2026',
    roleCodes: ['teacher']
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers({
        page,
        pageSize: 10,
        searchTerm: searchTerm.trim() || undefined,
        roleCode: roleFilter || undefined,
        status: statusFilter || undefined
      });
      setUsers(res.items);
      setTotalCount(res.totalCount);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, roleFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const handleToggleLock = async (user: UserItem) => {
    const nextStatus = user.status === 'locked' ? 'active' : 'locked';
    const confirmMsg = nextStatus === 'locked' 
      ? `Bạn có chắc chắn muốn khóa tài khoản "${user.fullName}"?` 
      : `Mở khóa tài khoản "${user.fullName}"?`;
    
    if (window.confirm(confirmMsg)) {
      try {
        await adminApi.setUserStatus(user.id, nextStatus as 'active' | 'locked');
        loadUsers();
      } catch (err: any) {
        alert(err.message || 'Lỗi cập nhật trạng thái');
      }
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    try {
      await adminApi.resetPassword(selectedUser.id, newPassword);
      alert(`Đã đặt lại mật khẩu cho ${selectedUser.fullName} thành: ${newPassword}`);
      setShowResetModal(false);
      setSelectedUser(null);
    } catch (err: any) {
      alert(err.message || 'Lỗi đặt lại mật khẩu');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createUser(createForm);
      alert('Tạo người dùng mới thành công!');
      setShowCreateModal(false);
      setCreateForm({
        fullName: '',
        email: '',
        phone: '',
        password: 'Soms@2026',
        roleCodes: ['teacher']
      });
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Lỗi tạo người dùng');
    }
  };

  const roleOptions = [
    { code: 'system_admin', name: 'Quản trị hệ thống' },
    { code: 'school_management', name: 'Ban giám hiệu' },
    { code: 'academic_affairs', name: 'Giáo vụ' },
    { code: 'head_of_department', name: 'Tổ trưởng chuyên môn' },
    { code: 'teacher', name: 'Giáo viên' },
    { code: 'accountant', name: 'Kế toán' },
    { code: 'facility_staff', name: 'Nhân viên CSVC' },
    { code: 'student', name: 'Học sinh' },
    { code: 'parent', name: 'Phụ huynh' },
  ];

  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Danh sách Tài khoản Người dùng</h2>
          <p className="text-xs text-slate-500 mt-0.5">Tổng số {totalCount} tài khoản được quản lý trong hệ thống</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Tạo tài khoản mới
          </button>
          <button
            onClick={() => alert('Chức năng xuất danh sách Excel (ADM-20) đang kết xuất file...')}
            className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
          <button
            onClick={loadUsers}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-all"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo họ tên, số điện thoại..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
          >
            <option value="">-- Tất cả vai trò (9 Actor) --</option>
            {roleOptions.map((r) => (
              <option key={r.code} value={r.code}>{r.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
          >
            <option value="">-- Trạng thái --</option>
            <option value="active">Đang hoạt động</option>
            <option value="locked">Đã khóa</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Họ và Tên / Email</th>
                <th className="py-3 px-4">Số điện thoại</th>
                <th className="py-3 px-4">Vai trò (Role)</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Ngày tạo</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    {loading ? 'Đang tải dữ liệu...' : 'Không tìm thấy người dùng phù hợp.'}
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                          {u.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{u.fullName}</div>
                          <div className="text-[11px] text-slate-400">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {u.phone || '---'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {u.roleNamesVi.map((roleName, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-100"
                          >
                            {roleName}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                        u.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {u.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => { setSelectedUser(u); setShowResetModal(true); }}
                          title="Đặt lại mật khẩu"
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleLock(u)}
                          title={u.status === 'locked' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                          className={`p-1.5 rounded-lg transition-all ${
                            u.status === 'locked'
                              ? 'text-emerald-600 hover:bg-emerald-50'
                              : 'text-rose-500 hover:bg-rose-50'
                          }`}
                        >
                          {u.status === 'locked' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>Trang {page} / {Math.ceil(totalCount / 10) || 1}</div>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 bg-white border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 font-medium"
            >
              Trước
            </button>
            <button
              disabled={page >= Math.ceil(totalCount / 10)}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 bg-white border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 font-medium"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {/* Modal Create User */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Tạo Tài khoản Người dùng Mới</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Địa chỉ Email / Mã tài khoản *</label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="nguyenvana@soms.edu.vn"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số điện thoại</label>
                <input
                  type="text"
                  value={createForm.phone || ''}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  placeholder="0912345678"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mật khẩu khởi tạo</label>
                <input
                  type="text"
                  value={createForm.password || ''}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gán vai trò (Role)</label>
                <select
                  value={createForm.roleCodes[0] || 'teacher'}
                  onChange={(e) => setCreateForm({ ...createForm, roleCodes: [e.target.value] })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                >
                  {roleOptions.map((r) => (
                    <option key={r.code} value={r.code}>{r.name} ({r.code})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500"
                >
                  Lưu tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reset Password */}
      {showResetModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Đặt lại Mật khẩu</h3>
            <p className="text-xs text-slate-500">
              Đặt lại mật khẩu cho tài khoản <strong>{selectedUser.fullName}</strong> ({selectedUser.email}).
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mật khẩu mới</label>
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={handleResetPassword}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-500"
              >
                Xác nhận đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
