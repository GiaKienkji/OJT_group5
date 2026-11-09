import React, { useEffect, useState } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Plus, 
  Save, 
  School as SchoolIcon
} from 'lucide-react';
import { adminApi } from '../services/adminApi';
import { SchoolConfig, AcademicYearItem, CreateAcademicYearInput } from '../types/admin.types';

export const SchoolConfigPage: React.FC = () => {
  const [selectedSchool, setSelectedSchool] = useState<SchoolConfig | null>(null);
  const [academicYears, setAcademicYears] = useState<AcademicYearItem[]>([]);
  const [showAddYearModal, setShowAddYearModal] = useState(false);
  const [savingSchool, setSavingSchool] = useState(false);

  // New Year Form
  const [newYearForm, setNewYearForm] = useState<CreateAcademicYearInput>({
    schoolId: '',
    code: '2026-2027',
    name: 'Năm học 2026 - 2027',
    startDate: '2026-09-01',
    endDate: '2027-05-31',
    isActive: false
  });

  const loadData = async () => {
    try {
      const schoolsList = await adminApi.getAllSchools();
      const primary = schoolsList[0];
      if (primary) {
        setSelectedSchool(primary);
        const years = await adminApi.getAcademicYears(primary.id);
        setAcademicYears(years);
        setNewYearForm(prev => ({ ...prev, schoolId: primary.id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) return;
    setSavingSchool(true);
    try {
      await adminApi.updateSchoolConfig(selectedSchool.id, selectedSchool);
      alert('Đã cập nhật cấu hình nhà trường thành công!');
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật cấu hình');
    } finally {
      setSavingSchool(false);
    }
  };

  const handleCreateYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) return;
    try {
      await adminApi.createAcademicYear({ ...newYearForm, schoolId: selectedSchool.id });
      alert('Tạo năm học mới thành công!');
      setShowAddYearModal(false);
      const years = await adminApi.getAcademicYears(selectedSchool.id);
      setAcademicYears(years);
    } catch (err: any) {
      alert(err.message || 'Lỗi tạo năm học');
    }
  };

  const handleActivateYear = async (yearId: string) => {
    if (!selectedSchool) return;
    try {
      await adminApi.activateAcademicYear(selectedSchool.id, yearId);
      const years = await adminApi.getAcademicYears(selectedSchool.id);
      setAcademicYears(years);
    } catch (err: any) {
      alert(err.message || 'Lỗi kích hoạt năm học');
    }
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Cấu hình Đơn vị Trường & Niên khóa</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Quản lý thông tin pháp lý của trường, thiết lập năm học và các học kỳ làm chuẩn cho Giáo vụ (TV2) xếp thời khóa biểu.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* School Information */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <SchoolIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Thông tin Nhà trường</h3>
              <p className="text-xs text-slate-500">Mã định danh trường học trên hệ thống SOMS</p>
            </div>
          </div>

          {selectedSchool ? (
            <form onSubmit={handleUpdateSchool} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã trường</label>
                  <input
                    type="text"
                    disabled
                    value={selectedSchool.code}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cấp trường</label>
                  <select
                    value={selectedSchool.level}
                    onChange={(e) => setSelectedSchool({ ...selectedSchool, level: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  >
                    <option value="THPT">THPT (Cấp 3)</option>
                    <option value="THCS">THCS (Cấp 2)</option>
                    <option value="LIEN_CAP">Liên cấp 2-3</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên trường đầy đủ *</label>
                <input
                  type="text"
                  required
                  value={selectedSchool.name}
                  onChange={(e) => setSelectedSchool({ ...selectedSchool, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email liên hệ</label>
                  <input
                    type="email"
                    value={selectedSchool.email || ''}
                    onChange={(e) => setSelectedSchool({ ...selectedSchool, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={selectedSchool.phone || ''}
                    onChange={(e) => setSelectedSchool({ ...selectedSchool, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Địa chỉ trụ sở</label>
                <textarea
                  rows={2}
                  value={selectedSchool.address || ''}
                  onChange={(e) => setSelectedSchool({ ...selectedSchool, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingSchool}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold flex items-center gap-2 transition-all shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  {savingSchool ? 'Đang lưu...' : 'Lưu thông tin trường'}
                </button>
              </div>
            </form>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">Chưa có thông tin trường.</div>
          )}
        </div>

        {/* Academic Years & Semesters */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Niên khóa & Học kỳ</h3>
                <p className="text-xs text-slate-500">Cấu hình khung thời gian đào tạo</p>
              </div>
            </div>

            <button
              onClick={() => setShowAddYearModal(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm năm học
            </button>
          </div>

          <div className="space-y-4">
            {academicYears.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Chưa có niên khóa nào được tạo. Hãy nhấn "Thêm năm học" để khởi tạo.
              </div>
            ) : (
              academicYears.map((y) => (
                <div 
                  key={y.id}
                  className={`p-4 rounded-xl border transition-all ${
                    y.isActive 
                      ? 'border-indigo-300 bg-indigo-50/30 ring-1 ring-indigo-200' 
                      : 'border-slate-200 bg-white hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{y.name}</span>
                      <span className="font-mono text-[10px] text-slate-500 px-2 py-0.5 rounded bg-slate-100">
                        {y.code}
                      </span>
                      {y.isActive && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          Hiện hành
                        </span>
                      )}
                    </div>
                    {!y.isActive && (
                      <button
                        onClick={() => handleActivateYear(y.id)}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-200 hover:bg-indigo-50"
                      >
                        Đặt làm năm học hiện hành
                      </button>
                    )}
                  </div>

                  {/* Semesters list */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                    {y.semesters.map((s) => (
                      <div key={s.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="font-semibold text-slate-800 flex items-center justify-between">
                          <span>{s.name} ({s.code})</span>
                          {s.isCurrent && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">
                              Đang diễn ra
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 font-mono">
                          {s.startDate} → {s.endDate}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal Add Year */}
      {showAddYearModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Khởi tạo Năm học Mới</h3>
            <form onSubmit={handleCreateYear} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mã niên khóa *</label>
                <input
                  type="text"
                  required
                  value={newYearForm.code}
                  onChange={(e) => setNewYearForm({ ...newYearForm, code: e.target.value })}
                  placeholder="2026-2027"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên năm học *</label>
                <input
                  type="text"
                  required
                  value={newYearForm.name}
                  onChange={(e) => setNewYearForm({ ...newYearForm, name: e.target.value })}
                  placeholder="Năm học 2026 - 2027"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bắt đầu *</label>
                  <input
                    type="date"
                    required
                    value={newYearForm.startDate}
                    onChange={(e) => setNewYearForm({ ...newYearForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kết thúc *</label>
                  <input
                    type="date"
                    required
                    value={newYearForm.endDate}
                    onChange={(e) => setNewYearForm({ ...newYearForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddYearModal(false)}
                  className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-500"
                >
                  Lưu niên khóa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
