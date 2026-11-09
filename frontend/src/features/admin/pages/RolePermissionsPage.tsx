import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  Save, 
  CheckSquare,
  Square
} from 'lucide-react';
import { adminApi } from '../services/adminApi';
import { RoleDetail, PermissionItem } from '../types/admin.types';

export const RolePermissionsPage: React.FC = () => {
  const [roles, setRoles] = useState<RoleDetail[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [selectedRoleCode, setSelectedRoleCode] = useState<string>('teacher');
  const [activePermissions, setActivePermissions] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const initData = async () => {
      try {
        const [rolesRes, permsRes] = await Promise.all([
          adminApi.getRoles(),
          adminApi.getPermissions()
        ]);
        setRoles(rolesRes);
        setPermissions(permsRes);

        const currentRole = rolesRes.find(r => r.code === selectedRoleCode) || rolesRes[0];
        if (currentRole) {
          setSelectedRoleCode(currentRole.code);
          setActivePermissions(new Set(currentRole.permissionCodes));
        }
      } catch (err) {
        console.error(err);
      }
    };
    initData();
  }, []);

  const handleSelectRole = (code: string) => {
    setSelectedRoleCode(code);
    const role = roles.find(r => r.code === code);
    if (role) {
      setActivePermissions(new Set(role.permissionCodes));
    }
  };

  const handleTogglePermission = (pCode: string) => {
    const next = new Set(activePermissions);
    if (next.has(pCode)) {
      next.delete(pCode);
    } else {
      next.add(pCode);
    }
    setActivePermissions(next);
  };

  const handleSavePermissions = async () => {
    setSaving(true);
    try {
      await adminApi.updateRolePermissions(selectedRoleCode, Array.from(activePermissions));
      alert(`Đã cập nhật ma trận phân quyền cho vai trò ${selectedRoleCode} thành công!`);
      // Update local roles state
      setRoles(roles.map(r => r.code === selectedRoleCode ? { ...r, permissionCodes: Array.from(activePermissions) } : r));
    } catch (err: any) {
      alert(err.message || 'Lỗi khi lưu phân quyền');
    } finally {
      setSaving(false);
    }
  };

  // Group permissions by module
  const groupedPermissions = permissions.reduce((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {} as Record<string, PermissionItem[]>);

  const selectedRole = roles.find(r => r.code === selectedRoleCode);

  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Ma trận Phân quyền Vai trò (RBAC)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản trị quyền hạn chi tiết cho 09 Actor chính thức theo nguyên tắc phân quyền tối thiểu (Least Privilege).
          </p>
        </div>

        <button
          onClick={handleSavePermissions}
          disabled={saving}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Đang lưu...' : 'Lưu thay đổi phân quyền'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Role Selector Sidebar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase px-2 mb-2">09 Vai trò hệ thống</div>
          {roles.map((r) => {
            const isSelected = r.code === selectedRoleCode;
            return (
              <button
                key={r.code}
                onClick={() => handleSelectRole(r.code)}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between text-xs ${
                  isSelected
                    ? 'bg-blue-50 text-blue-800 font-bold border border-blue-200'
                    : 'text-slate-700 hover:bg-slate-50 font-medium'
                }`}
              >
                <div>
                  <div className="font-semibold">{r.nameVi}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{r.code}</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                  {r.permissionCodes.length} quyền
                </span>
              </button>
            );
          })}
        </div>

        {/* Permissions Matrix */}
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                Quyền hạn của vai trò: <span className="text-blue-600">{selectedRole?.nameVi}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Đang kích hoạt {activePermissions.size} / {permissions.length} quyền khả dụng
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActivePermissions(new Set(permissions.map(p => p.code)))}
                className="text-[11px] px-2.5 py-1 text-blue-600 hover:bg-blue-50 rounded-lg font-medium"
              >
                Chọn tất cả
              </button>
              <button
                onClick={() => setActivePermissions(new Set())}
                className="text-[11px] px-2.5 py-1 text-slate-500 hover:bg-slate-100 rounded-lg font-medium"
              >
                Bỏ chọn hết
              </button>
            </div>
          </div>

          {/* Grouped by Module */}
          <div className="space-y-6">
            {Object.entries(groupedPermissions).map(([moduleName, modulePerms]) => (
              <div key={moduleName} className="space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60 flex items-center justify-between">
                  <span>Module: {moduleName}</span>
                  <span className="text-[10px] font-normal text-slate-500 font-mono">
                    {modulePerms.filter(p => activePermissions.has(p.code)).length} / {modulePerms.length} quyền
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {modulePerms.map((p) => {
                    const isChecked = activePermissions.has(p.code);
                    return (
                      <div
                        key={p.code}
                        onClick={() => handleTogglePermission(p.code)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                          isChecked
                            ? 'bg-blue-50/50 border-blue-200 text-blue-900'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <div className="mt-0.5">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold font-mono text-[11px]">{p.code}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{p.description || 'Quyền thao tác hệ thống'}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
