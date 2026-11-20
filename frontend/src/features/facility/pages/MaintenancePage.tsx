import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  facilityApi, Maintenance, Handler, Asset,
} from '../../../services/tv4Api';
import {
  PageHeader, Card, TableWrap, Th, Td, Badge, Modal,
  PrimaryButton, SecondaryButton, Input, Select, Field, Textarea,
  statusTone, statusLabel, fmtDate, Loading, ErrorBox, Empty, Toast,
} from '../../shared/ui';

export const MaintenancePage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canManageRepairs = hasPermission('repairs.manage');

  const [list, setList] = useState<Maintenance[]>([]);
  const [handlers, setHandlers] = useState<Handler[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  // Modal Schedule
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [assetId, setAssetId] = useState('');
  const [title, setTitle] = useState('');
  const [maintenanceDate, setMaintenanceDate] = useState('');
  const [repeatMonths, setRepeatMonths] = useState('0');

  // Modal Assign Handler
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedMaint, setSelectedMaint] = useState<Maintenance | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [assignNote, setAssignNote] = useState('');

  // Modal Result
  const [resultOpen, setResultOpen] = useState(false);
  const [resultText, setResultText] = useState('');
  const [cost, setCost] = useState('0');
  const [resCondition, setResCondition] = useState('Đã bảo dưỡng định kỳ, thiết bị vận hành tốt');
  const [resStatus, setResStatus] = useState('working');

  const showToast = (message: string, tone: 'success' | 'error' = 'success') => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 4000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [maints, hnds, asts] = await Promise.all([
        facilityApi.getMaintenance(),
        facilityApi.getHandlers(),
        facilityApi.getAssets(),
      ]);
      setList(maints);
      setHandlers(hnds);
      setAssets(asts);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Không thể tải lịch bảo trì.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId) {
      setError('Vui lòng chọn thiết bị.');
      return;
    }
    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề bảo trì.');
      return;
    }
    if (!maintenanceDate) {
      setError('Vui lòng chọn ngày bảo trì.');
      return;
    }
    try {
      await facilityApi.createMaintenance({
        assetId,
        title: title.trim(),
        maintenanceDate,
        repeatIntervalMonths: Number(repeatMonths) > 0 ? Number(repeatMonths) : undefined,
      });
      setScheduleOpen(false);
      setAssetId('');
      setTitle('');
      setMaintenanceDate('');
      setRepeatMonths('0');
      await load();
      showToast('Đã tạo lịch bảo trì định kỳ thành công.');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lập lịch bảo trì thất bại.');
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaint || !selectedStaffId) {
      setError('Vui lòng chọn nhân sự.');
      return;
    }
    try {
      await facilityApi.assignMaintenanceHandler(selectedMaint.id, {
        staffId: selectedStaffId,
        note: assignNote.trim() || undefined,
      });
      setAssignOpen(false);
      setSelectedMaint(null);
      setSelectedStaffId('');
      setAssignNote('');
      await load();
      showToast('Đã phân công nhân sự bảo trì.');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Phân công nhân sự thất bại.');
    }
  };

  const handleResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaint || !resultText.trim()) {
      setError('Vui lòng nhập kết quả bảo trì.');
      return;
    }
    try {
      await facilityApi.setMaintenanceResult(selectedMaint.id, {
        result: resultText.trim(),
        cost: Number(cost) || 0,
        condition: resCondition.trim(),
        status: resStatus,
      });
      setResultOpen(false);
      setSelectedMaint(null);
      setResultText('');
      setCost('0');
      await load();
      showToast('Đã ghi nhận kết quả bảo trì thành công.');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ghi nhận kết quả bảo trì thất bại.');
    }
  };

  if (loading) return <Loading text="Đang tải lịch bảo trì định kỳ…" />;
  if (error) return <ErrorBox message={error} onRetry={load} />;

  return (
    <div>
      <PageHeader
        title="Lập lịch & Bảo trì Định kỳ"
        subtitle="Quản lý kế hoạch bảo dưỡng định kỳ, phân công nhân sự và ghi nhận kết quả (FAC-20, FAC-21)"
        action={
          canManageRepairs && (
            <PrimaryButton onClick={() => setScheduleOpen(true)}>＋ Lập lịch bảo trì</PrimaryButton>
          )
        }
      />

      {toast && <Toast message={toast.message} onClose={() => setToast(null)} tone={toast.tone} />}

      <Card>
        {list.length === 0 ? (
          <Empty text="Chưa có lịch bảo trì định kỳ nào." />
        ) : (
          <TableWrap>
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr>
                  <Th>Mã lịch</Th>
                  <Th>Tiêu đề bảo trì</Th>
                  <Th>Mã thiết bị</Th>
                  <Th>Ngày bảo trì</Th>
                  <Th>Chu kỳ lặp</Th>
                  <Th>Trạng thái</Th>
                  <Th>Thao tác</Th>
                </tr>
              </thead>
              <tbody>
                {list.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <Td className="font-semibold text-slate-900">{m.id.slice(0, 8)}...</Td>
                    <Td>{m.title}</Td>
                    <Td className="text-xs text-slate-600">{m.assetCode ? `${m.assetCode} - ${m.assetName}` : (m.assetId ? m.assetId.slice(0, 8) + '...' : '—')}</Td>
                    <Td>{m.scheduledFor ? fmtDate(m.scheduledFor) : '—'}</Td>
                    <Td className="text-xs text-slate-500">
                      {m.repeatIntervalMonths ? `${m.repeatIntervalMonths} tháng/lần` : 'Một lần'}
                    </Td>
                    <Td>
                      <Badge tone={statusTone(m.status)}>{statusLabel(m.status)}</Badge>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1.5">
                        {canManageRepairs && (
                          <>
                            <SecondaryButton
                              size="sm"
                              onClick={() => {
                                setSelectedMaint(m);
                                setAssignOpen(true);
                              }}
                            >
                              Phân công
                            </SecondaryButton>
                            <SecondaryButton
                              size="sm"
                              onClick={() => {
                                setSelectedMaint(m);
                                setResultOpen(true);
                              }}
                            >
                              Kết quả
                            </SecondaryButton>
                          </>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Card>

      {/* Modal Lập lịch bảo trì */}
      <Modal title="Lập lịch bảo trì định kỳ" onClose={() => setScheduleOpen(false)} open={scheduleOpen}>
        <form onSubmit={handleSchedule} className="space-y-4">
          <Field label="Thiết bị cần bảo trì" required>
            <Select value={assetId} onChange={(e) => setAssetId(e.target.value)} required>
              <option value="">-- Chọn thiết bị --</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} - {a.name} ({a.category})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tiêu đề kế hoạch" required>
            <Input
              required
              placeholder="VD: Bảo dưỡng hệ thống điều hòa khối nhà A..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <Field label="Ngày thực hiện" required>
            <Input
              type="date"
              required
              value={maintenanceDate}
              onChange={(e) => setMaintenanceDate(e.target.value)}
            />
          </Field>
          <Field label="Chu kỳ lặp lại (tháng)">
            <Select value={repeatMonths} onChange={(e) => setRepeatMonths(e.target.value)}>
              <option value="0">Không lặp lại (Chỉ một lần)</option>
              <option value="1">Hàng tháng (1 tháng)</option>
              <option value="3">Hàng quý (3 tháng)</option>
              <option value="6">Mỗi nửa năm (6 tháng)</option>
              <option value="12">Hàng năm (12 tháng)</option>
            </Select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <SecondaryButton type="button" onClick={() => setScheduleOpen(false)}>
              Hủy
            </SecondaryButton>
            <PrimaryButton type="submit">Lưu lịch bảo trì</PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* Modal Phân công nhân sự */}
      <Modal title="Phân công nhân sự bảo trì" onClose={() => setAssignOpen(false)} open={assignOpen}>
        <form onSubmit={handleAssign} className="space-y-4">
          <Field label="Nhân sự thực hiện" required>
            <Select value={selectedStaffId} onChange={(e) => setSelectedStaffId(e.target.value)} required>
              <option value="">-- Chọn nhân sự CSVC --</option>
              {handlers.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.code} - {h.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Ghi chú công việc">
            <Textarea
              placeholder="Nội dung cần kiểm tra bảo dưỡng cụ thể..."
              value={assignNote}
              onChange={(e) => setAssignNote(e.target.value)}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <SecondaryButton type="button" onClick={() => setAssignOpen(false)}>
              Hủy
            </SecondaryButton>
            <PrimaryButton type="submit">Phân công</PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* Modal Ghi nhận kết quả */}
      <Modal title="Ghi nhận kết quả bảo trì" onClose={() => setResultOpen(false)} open={resultOpen}>
        <form onSubmit={handleResult} className="space-y-4">
          <Field label="Kết quả bảo trì" required>
            <Textarea
              required
              placeholder="VD: Đã vệ sinh lưới lọc bụi, bổ sung gas và kiểm tra mạch điện hoạt động bình thường..."
              value={resultText}
              onChange={(e) => setResultText(e.target.value)}
            />
          </Field>
          <Field label="Chi phí bảo trì (VNĐ)">
            <Input
              type="number"
              min="0"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
            />
          </Field>
          <Field label="Tình trạng thiết bị" required>
            <Input
              required
              value={resCondition}
              onChange={(e) => setResCondition(e.target.value)}
            />
          </Field>
          <Field label="Trạng thái cập nhật" required>
            <Select value={resStatus} onChange={(e) => setResStatus(e.target.value)}>
              <option value="working">Hoạt động tốt</option>
              <option value="maintenance">Cần theo dõi thêm</option>
              <option value="damaged">Phát hiện hỏng hóc</option>
            </Select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <SecondaryButton type="button" onClick={() => setResultOpen(false)}>
              Hủy
            </SecondaryButton>
            <PrimaryButton type="submit">Lưu kết quả</PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
};
