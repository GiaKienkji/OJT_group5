import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  facilityApi, Room, AssetCategory,
} from '../../../services/tv4Api';
import {
  PageHeader, Card, PrimaryButton, Select, Field, Input,
  Loading, ErrorBox, Toast,
} from '../../shared/ui';

export const FacilityReportsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('assets.manage') || hasPermission('rooms.manage');

  const [rooms, setRooms] = useState<Room[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  const [reportType, setReportType] = useState<'inventory' | 'maintenance'>('inventory');
  const [format, setFormat] = useState<'xlsx' | 'pdf'>('xlsx');
  const [roomId, setRoomId] = useState('');
  const [category, setCategory] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [exporting, setExporting] = useState(false);

  const showToast = (message: string, tone: 'success' | 'error' = 'success') => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 4000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [rms, cats] = await Promise.all([
        facilityApi.getRooms(),
        facilityApi.getAssetCategories(),
      ]);
      setRooms(rms);
      setCategories(cats);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Không tải được danh mục lọc báo cáo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setExporting(true);
    try {
      const blob = await facilityApi.exportReport({
        reportType,
        format,
        roomId: roomId || undefined,
        category: category || undefined,
        fromDate: reportType === 'maintenance' && fromDate ? fromDate : undefined,
        toDate: reportType === 'maintenance' && toDate ? toDate : undefined,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bao_cao_CSVC_${reportType}_${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('Đã xuất báo cáo thành công.');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Xuất báo cáo thất bại.');
    } finally {
      setExporting(false);
    }
  };

  if (!canManage) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-10 text-center text-slate-500">
        Bạn không có quyền xuất báo cáo cơ sở vật chất.
      </div>
    );
  }

  if (loading) return <Loading text="Đang tải dữ liệu báo cáo…" />;
  if (error) return <ErrorBox message={error} onRetry={load} />;

  return (
    <div>
      <PageHeader
        title="Báo cáo & Xuất dữ liệu CSVC"
        subtitle="Tổng hợp dữ liệu kiểm kê tài sản, lịch sử bảo trì và xuất tệp Excel/PDF (FAC-27)"
      />

      {toast && <Toast message={toast.message} onClose={() => setToast(null)} tone={toast.tone} />}

      <Card>
        <div className="p-6">
          <form onSubmit={handleExport} className="max-w-2xl space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Loại báo cáo" required>
                <Select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as 'inventory' | 'maintenance')}
                >
                  <option value="inventory">Kiểm kê & Danh mục Tài sản</option>
                  <option value="maintenance">Lịch sử & Kết quả Bảo trì</option>
                </Select>
              </Field>
              <Field label="Định dạng tệp" required>
                <Select value={format} onChange={(e) => setFormat(e.target.value as 'xlsx' | 'pdf')}>
                  <option value="xlsx">Bảng tính Excel (.xlsx)</option>
                  <option value="pdf">Tài liệu PDF (.pdf)</option>
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Theo phòng học">
                <Select value={roomId} onChange={(e) => setRoomId(e.target.value)}>
                  <option value="">-- Tất cả phòng học --</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.code} ({r.name || 'Phòng'})
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Theo loại thiết bị">
                <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">-- Tất cả loại thiết bị --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            {reportType === 'maintenance' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Từ ngày">
                  <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </Field>
                <Field label="Đến ngày">
                  <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </Field>
              </div>
            )}

            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
              <div className="text-xs text-slate-500">
                {reportType === 'inventory'
                  ? 'Báo cáo kiểm kê phản ánh hiện trạng số lượng và tình trạng tài sản tại thời điểm hiện tại.'
                  : 'Báo cáo bảo trì liệt kê chi phí, kết quả và nhân sự thực hiện theo khung thời gian đã chọn.'}
              </div>
              <PrimaryButton type="submit" disabled={exporting}>
                {exporting ? 'Đang kết xuất...' : `Xuất tệp ${format.toUpperCase()}`}
              </PrimaryButton>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};
