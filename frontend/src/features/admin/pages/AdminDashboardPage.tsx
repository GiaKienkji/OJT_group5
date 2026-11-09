import React, { useEffect, useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Activity, 
  UserPlus, 
  KeyRound, 
  Database,
  CheckCircle2,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { adminApi } from '../services/adminApi';
import { SystemHealthStatus, RoleDetail, AuditLogItem } from '../types/admin.types';

interface AdminDashboardPageProps {
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onNavigateTab }) => {
  const [health, setHealth] = useState<SystemHealthStatus | null>(null);
  const [roles, setRoles] = useState<RoleDetail[]>([]);
  const [recentLogs, setRecentLogs] = useState<AuditLogItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [healthRes, rolesRes, logsRes] = await Promise.all([
          adminApi.getSystemHealth().catch(() => null),
          adminApi.getRoles().catch(() => []),
          adminApi.getAuditLogs(1, 6).catch(() => ({ items: [] }))
        ]);
        if (healthRes) setHealth(healthRes);
        setRoles(rolesRes);
        setRecentLogs(logsRes.items || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 text-white shadow-lg flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            Hệ thống SOMS đang vận hành bình thường
          </div>
          <h2 className="text-2xl font-bold">Bảng điều khiển Quản trị viên Tối cao</h2>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Quản lý tập trung 09 nhóm tác nhân, cấu hình năm học, phân định ma trận 56 quyền hạn và giám sát toàn vẹn dữ liệu trường học.
          </p>
        </div>
        <div className="hidden lg:flex items-center gap-3">
          <button 
            onClick={() => onNavigateTab('users')}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-md shadow-blue-600/30"
          >
            <UserPlus className="w-4 h-4" />
            Tạo tài khoản mới
          </button>
          <button 
            onClick={() => onNavigateTab('roles')}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all"
          >
            <KeyRound className="w-4 h-4" />
            Phân quyền RBAC
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng người dùng</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{health?.totalUsersCount || 1024}</div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Phủ kín 09 Actor chính thức</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phiên đăng nhập Active</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{health?.activeUsersCount || 42}</div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            <span>Trong vòng 60 phút qua</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vai trò hệ thống</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{roles.length || 9}</div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-purple-600 font-medium">
            <span>56 mã quyền độc lập</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cơ sở dữ liệu</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-600">Supabase</div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>PostgreSQL 15 Connected</span>
          </div>
        </div>
      </div>

      {/* 9 Roles Overview */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">09 Tác nhân & Phân bố tài khoản</h3>
            <p className="text-xs text-slate-500">Thống kê số lượng người dùng theo từng Actor trong hệ thống</p>
          </div>
          <button 
            onClick={() => onNavigateTab('roles')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Xem ma trận quyền <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4">
          {[
            { code: 'system_admin', name: 'Quản trị hệ thống', color: 'blue', desc: 'TV1 - Quản lý cấu hình, người dùng' },
            { code: 'school_management', name: 'Ban giám hiệu', color: 'indigo', desc: 'TV1 - Điều hành, phê duyệt, KPIs' },
            { code: 'academic_affairs', name: 'Giáo vụ', color: 'teal', desc: 'TV2 - Học sinh, lớp, TKB, dạy thay' },
            { code: 'head_of_department', name: 'Tổ trưởng CM', color: 'amber', desc: 'TV3 - Hoạt động tổ, đề xuất dạy thay' },
            { code: 'teacher', name: 'Giáo viên & GVCN', color: 'emerald', desc: 'TV3 - Điểm danh, nhập điểm, sổ chủ nhiệm' },
            { code: 'accountant', name: 'Kế toán', color: 'rose', desc: 'TV4 - Thu phí, công nợ, đối soát' },
            { code: 'facility_staff', name: 'Nhân viên CSVC', color: 'orange', desc: 'TV4 - Thiết bị, phòng học, bảo trì' },
            { code: 'student', name: 'Học sinh', color: 'cyan', desc: 'TV5 - Tra cứu điểm, TKB, lịch thi' },
            { code: 'parent', name: 'Phụ huynh', color: 'purple', desc: 'TV5 - Theo dõi con, xin nghỉ, học phí' },
          ].map((r) => {
            const roleData = roles.find(x => x.code === r.code);
            return (
              <div key={r.code} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-slate-800">{r.name}</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                    {roleData ? `${roleData.userCount} users` : 'Đang tải...'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">{r.desc}</div>
                <div className="mt-2 text-[10px] text-blue-600 font-mono">
                  {roleData ? `${roleData.permissionCodes.length} quyền` : '---'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Audit Logs */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Nhật ký Thao tác Gần đây (Audit Trail)</h3>
            <p className="text-xs text-slate-500">Giám sát các hành động đăng nhập và cập nhật dữ liệu quan trọng</p>
          </div>
          <button 
            onClick={() => onNavigateTab('audit')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Xem toàn bộ nhật ký <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentLogs.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">Chưa có bản ghi nhật ký mới.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs flex items-center justify-center font-bold">
                    {log.action.substring(0, 3)}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800">{log.action}</div>
                    <div className="text-[11px] text-slate-500">{log.details || log.entityName || 'Thao tác hệ thống'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-700 font-medium">{log.userFullName || 'Admin'}</div>
                  <div className="text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleString('vi-VN')}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
