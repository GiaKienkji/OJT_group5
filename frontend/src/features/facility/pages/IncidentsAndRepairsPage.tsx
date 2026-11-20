import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  facilityApi, Incident, RepairRequest, Handler, Asset,
} from '../../../services/tv4Api';
import {
  PageHeader, Card, CardHeader, TableWrap, Th, Td, Badge, Modal,
  PrimaryButton, SecondaryButton, Input, Select, Field, Textarea,
  statusTone, statusLabel, fmtDateTime, Loading, ErrorBox, Empty, Toast,
} from '../../shared/ui';

export const IncidentsAndRepairsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canManageRepairs = hasPermission('repairs.manage');
  const canSubmit = hasPermission('workflow.submit');

  const [activeTab, setActiveTab] = useState<'incidents' | 'repairs'>('incidents');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [repairs, setRepairs] = useState<RepairRequest[]>([]);
  const [handlers, setHandlers] = useState<Handler[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  // Modal Report Incident
  const [reportOpen, setReportOpen] = useState(false);
  const [reportAssetId, setReportAssetId] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reportSeverity, setReportSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');

  // Modal Change Severity
  const [severityOpen, setSeverityOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [newSeverity, setNewSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');

  // Modal Create Repair
  const [repairOpen, setRepairOpen] = useState(false);
  const [repairTitle, setRepairTitle] = useState('');
  const [repairSchedule, setRepairSchedule] = useState('');

  // Modal Assign Handler
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<RepairRequest | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [assignNote, setAssignNote] = useState('');

  // Modal Progress
  const [progressOpen, setProgressOpen] = useState(false);
  const [progressNote, setProgressNote] = useState('');

  // Modal Result & Complete
  const [resultOpen, setResultOpen] = useState(false);
  const [workResult, setWorkResult] = useState('');
  const [cost, setCost] = useState('0');
  const [resCondition, setResCondition] = useState('Đã sửa xong, hoạt động tốt');
  const [resStatus, setResStatus] = useState('working');

  const showToast = (message: string, tone: 'success' | 'error' = 'success') => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 4000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [incs, reps, hnds, asts] = await Promise.all([
        facilityApi.getIncidents(),
        facilityApi.getRepairRequests(),
        facilityApi.getHandlers(),
        facilityApi.getAssets(),
      ]);
      setIncidents(incs);
      setRepairs(reps);
      setHandlers(hnds);
      setAssets(asts);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Không thể tải dữ liệu sự cố & sửa chữa.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportAssetId) {
      setError('Vui lòng chọn thiết bị.');
      return;
    }
    if (!reportDesc.trim()) {
      setError('Vui lòng mô tả sự cố.');
      return;
    }
    try {
      await facilityApi.createIncident({
        assetId: reportAssetId,
        description: reportDesc.trim(),
        severity: reportSeverity,
      });
      setReportOpen(false);
      setReportAssetId('');
      setReportDesc('');
      setReportSeverity('medium');
      await load();
      showToast('Đã tiếp nhận báo cáo sự cố thành công.');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Báo cáo sự cố thất bại.');
    }
  };

  const handleChangeSeverity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;
    try {
      await facilityApi.setIncidentSeverity(selectedIncident.id, { severity: newSeverity });
      setSeverityOpen(false);
      setSelectedIncident(null);
      await load();
      showToast('Đã cập nhật mức độ sự cố.');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Cập nhật mức độ thất bại.');
    }
  };

  const handleCreateRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;
    if (!repairTitle.trim()) {
      setError('Vui lòng nhập tiêu đề phiếu sửa chữa.');
      return;
    }
    try {
      await facilityApi.createRepairRequest({
        incidentId: selectedIncident.id,
        title: repairTitle.trim(),
        scheduledFor: repairSchedule || undefined,
      });
      setRepairOpen(false);
      setSelectedIncident(null);
      setRepairTitle('');
      setRepairSchedule('');
      await load();
      setActiveTab('repairs');
      showToast('Đã lập phiếu sửa chữa thành công.');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Tạo phiếu sửa chữa thất bại.');
    }
  };

  const handleAssignHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepair || !selectedStaffId) {
      setError('Vui lòng chọn nhân sự thực hiện.');
      return;
    }
    try {
      await facilityApi.assignRepairHandler(selectedRepair.id, {
        staffId: selectedStaffId,
        note: assignNote.trim() || undefined,
      });
      setAssignOpen(false);
      setSelectedRepair(null);
      setSelectedStaffId('');
      setAssignNote('');
      await load();
      showToast('Đã phân công nhân sự xử lý.');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Phân công nhân sự thất bại.');
    }
  };

  const handleAddProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepair || !progressNote.trim()) {
      setError('Vui lòng nhập tiến độ xử lý.');
      return;
    }
    try {
      await facilityApi.addRepairProgress(selectedRepair.id, { progressNote: progressNote.trim() });
      setProgressOpen(false);
      setSelectedRepair(null);
      setProgressNote('');
      await load();
      showToast('Đã cập nhật tiến độ xử lý.');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Cập nhật tiến độ thất bại.');
    }
  };

  const handleRecordResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepair || !workResult.trim()) {
      setError('Vui lòng nhập kết quả xử lý.');
      return;
    }
    try {
      await facilityApi.setRepairResult(selectedRepair.id, {
        result: workResult.trim(),
        cost: Number(cost) || 0,
        condition: resCondition.trim(),
        status: resStatus,
      });
      setResultOpen(false);
      setSelectedRepair(null);
      setWorkResult('');
      setCost('0');
      await load();
      showToast('Đã ghi nhận kết quả sửa chữa.');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ghi nhận kết quả thất bại.');
    }
  };

  const handleComplete = async (r: RepairRequest) => {
    try {
      await facilityApi.completeRepairRequest(r.id);
      await load();
      showToast('Đã xác nhận hoàn thành sửa chữa.');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Xác nhận hoàn thành thất bại.');
    }
  };

  if (loading) return <Loading text="Đang tải sự cố & sửa chữa CSVC…" />;
  if (error) return <ErrorBox message={error} onRetry={load} />;

  return (
    <div>
      <PageHeader
        title="Quản lý Sự cố & Sửa chữa"
        subtitle="Tiếp nhận báo cáo sự cố, phân loại, lập phiếu sửa chữa và theo dõi kết quả (FAC-13 đến FAC-19, FAC-25, FAC-26)"
        action={
          canSubmit && (
            <PrimaryButton onClick={() => setReportOpen(true)}>＋ Báo cáo sự cố</PrimaryButton>
          )
        }
      />

      {toast && <Toast message={toast.message} onClose={() => setToast(null)} tone={toast.tone} />}

      <div className="flex gap-2 border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('incidents')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'incidents'
              ? 'border-[#0B4F8A] text-[#0B4F8A]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Danh sách Sự cố ({incidents.length})
        </button>
        <button
          onClick={() => setActiveTab('repairs')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'repairs'
              ? 'border-[#0B4F8A] text-[#0B4F8A]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Phiếu Sửa chữa ({repairs.length})
        </button>
      </div>

      {activeTab === 'incidents' ? (
        <Card>
          <CardHeader title="Báo cáo sự cố thiết bị" />
          {incidents.length === 0 ? (
            <Empty text="Chưa có sự cố nào được ghi nhận." />
          ) : (
            <TableWrap>
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <Th>Thiết bị</Th>
                    <Th>Mô tả sự cố</Th>
                    <Th>Người báo</Th>
                    <Th>Mức độ</Th>
                    <Th>Trạng thái</Th>
                    <Th>Thời gian</Th>
                    <Th>Thao tác</Th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-slate-50">
                      <Td className="font-semibold text-slate-900">
                        {inc.asset_code} - {inc.asset_name}
                      </Td>
                      <Td>{inc.description}</Td>
                      <Td className="text-xs text-slate-600">{inc.reported_by_name || '—'}</Td>
                      <Td>
                        <Badge tone={statusTone(inc.priority)}>{statusLabel(inc.priority)}</Badge>
                      </Td>
                      <Td>
                        <Badge tone={statusTone(inc.status)}>{statusLabel(inc.status)}</Badge>
                      </Td>
                      <Td className="text-xs text-slate-500">{fmtDateTime(inc.created_at)}</Td>
                      <Td>
                        <div className="flex items-center gap-1.5">
                          {canManageRepairs && (
                            <>
                              <SecondaryButton
                                size="sm"
                                onClick={() => {
                                  setSelectedIncident(inc);
                                  setNewSeverity(inc.priority);
                                  setSeverityOpen(true);
                                }}
                              >
                                Phân loại
                              </SecondaryButton>
                              {inc.status === 'open' && (
                                <PrimaryButton
                                  size="sm"
                                  onClick={() => {
                                    setSelectedIncident(inc);
                                    setRepairTitle(`Sửa chữa sự cố: ${inc.description}`);
                                    setRepairOpen(true);
                                  }}
                                >
                                  Lập phiếu sửa
                                </PrimaryButton>
                              )}
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
      ) : (
        <Card>
          <CardHeader title="Danh sách phiếu sửa chữa thiết bị" />
          {repairs.length === 0 ? (
            <Empty text="Chưa có phiếu sửa chữa nào." />
          ) : (
            <TableWrap>
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <Th>Tiêu đề</Th>
                    <Th>Thiết bị</Th>
                    <Th>Lịch hẹn</Th>
                    <Th>Trạng thái</Th>
                    <Th>Kết quả / Tình trạng</Th>
                    <Th>Thao tác</Th>
                  </tr>
                </thead>
                <tbody>
                  {repairs.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <Td className="font-semibold text-slate-900">{r.title}</Td>
                      <Td className="text-xs text-slate-600">
                        {r.asset_code} - {r.asset_name}
                      </Td>
                      <Td>{r.scheduled_for ? fmtDateTime(r.scheduled_for) : '—'}</Td>
                      <Td>
                        <Badge tone={statusTone(r.status)}>{statusLabel(r.status)}</Badge>
                      </Td>
                      <Td className="text-xs text-slate-600">
                        {r.result_condition || r.result_status ? (
                          <span>
                            {r.result_condition} ({statusLabel(r.result_status || '')})
                          </span>
                        ) : (
                          'Chưa ghi nhận'
                        )}
                      </Td>
                      <Td>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {canManageRepairs && (
                            <>
                              <SecondaryButton
                                size="sm"
                                onClick={() => {
                                  setSelectedRepair(r);
                                  setAssignOpen(true);
                                }}
                              >
                                Phân công
                              </SecondaryButton>
                              <SecondaryButton
                                size="sm"
                                onClick={() => {
                                  setSelectedRepair(r);
                                  setProgressOpen(true);
                                }}
                              >
                                Tiến độ
                              </SecondaryButton>
                              <SecondaryButton
                                size="sm"
                                onClick={() => {
                                  setSelectedRepair(r);
                                  setResultOpen(true);
                                }}
                              >
                                Kết quả
                              </SecondaryButton>
                              {r.status !== 'completed' && (
                                <PrimaryButton size="sm" onClick={() => handleComplete(r)}>
                                  Hoàn thành
                                </PrimaryButton>
                              )}
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
      )}

      {/* Modal Báo cáo sự cố */}
      <Modal title="Báo cáo sự cố thiết bị" onClose={() => setReportOpen(false)} open={reportOpen}>
        <form onSubmit={handleReportIncident} className="space-y-4">
          <Field label="Thiết bị gặp sự cố" required>
            <Select value={reportAssetId} onChange={(e) => setReportAssetId(e.target.value)} required>
              <option value="">-- Chọn thiết bị --</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} - {a.name} ({a.category})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Mức độ nghiêm trọng" required>
            <Select
              value={reportSeverity}
              onChange={(e) => setReportSeverity(e.target.value as 'low' | 'medium' | 'high' | 'critical')}
            >
              <option value="low">Thấp (Chưa ảnh hưởng nhiều)</option>
              <option value="medium">Trung bình (Ảnh hưởng một phần)</option>
              <option value="high">Cao (Cần xử lý gấp)</option>
              <option value="critical">Nghiêm trọng (Ngừng trệ hoạt động)</option>
            </Select>
          </Field>
          <Field label="Mô tả hiện tượng hư hỏng" required>
            <Textarea
              required
              placeholder="VD: Máy chiếu phòng 201 bật không lên hình, đèn báo đỏ nhấp nháy..."
              value={reportDesc}
              onChange={(e) => setReportDesc(e.target.value)}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <SecondaryButton type="button" onClick={() => setReportOpen(false)}>
              Hủy
            </SecondaryButton>
            <PrimaryButton type="submit">Gửi báo cáo sự cố</PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* Modal Phân loại mức độ */}
      <Modal title="Phân loại mức độ sự cố" onClose={() => setSeverityOpen(false)} open={severityOpen}>
        <form onSubmit={handleChangeSeverity} className="space-y-4">
          <Field label="Mức độ ưu tiên xử lý" required>
            <Select
              value={newSeverity}
              onChange={(e) => setNewSeverity(e.target.value as 'low' | 'medium' | 'high' | 'critical')}
            >
              <option value="low">Thấp</option>
              <option value="medium">Trung bình</option>
              <option value="high">Cao</option>
              <option value="critical">Nghiêm trọng</option>
            </Select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <SecondaryButton type="button" onClick={() => setSeverityOpen(false)}>
              Hủy
            </SecondaryButton>
            <PrimaryButton type="submit">Lưu mức độ</PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* Modal Lập phiếu sửa chữa */}
      <Modal title="Lập phiếu sửa chữa thiết bị" onClose={() => setRepairOpen(false)} open={repairOpen}>
        <form onSubmit={handleCreateRepair} className="space-y-4">
          <Field label="Tiêu đề phiếu sửa chữa" required>
            <Input
              required
              value={repairTitle}
              onChange={(e) => setRepairTitle(e.target.value)}
            />
          </Field>
          <Field label="Ngày hẹn dự kiến">
            <Input
              type="datetime-local"
              value={repairSchedule}
              onChange={(e) => setRepairSchedule(e.target.value)}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <SecondaryButton type="button" onClick={() => setRepairOpen(false)}>
              Hủy
            </SecondaryButton>
            <PrimaryButton type="submit">Lập phiếu</PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* Modal Phân công nhân sự */}
      <Modal title="Phân công nhân sự xử lý" onClose={() => setAssignOpen(false)} open={assignOpen}>
        <form onSubmit={handleAssignHandler} className="space-y-4">
          <Field label="Nhân sự thực hiện" required>
            <Select value={selectedStaffId} onChange={(e) => setSelectedStaffId(e.target.value)} required>
              <option value="">-- Chọn nhân sự CSVC --</option>
              {handlers.map((h) => (
                <option key={h.user_id} value={h.user_id}>
                  {h.code} - {h.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Ghi chú phân công">
            <Textarea
              placeholder="Chỉ dẫn kỹ thuật hoặc yêu cầu cụ thể..."
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

      {/* Modal Cập nhật tiến độ */}
      <Modal title="Cập nhật tiến độ sửa chữa" onClose={() => setProgressOpen(false)} open={progressOpen}>
        <form onSubmit={handleAddProgress} className="space-y-4">
          <Field label="Tiến độ thực tế" required>
            <Textarea
              required
              placeholder="VD: Đã tháo linh kiện kiểm tra, đang chờ thay bóng đèn chiếu..."
              value={progressNote}
              onChange={(e) => setProgressNote(e.target.value)}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <SecondaryButton type="button" onClick={() => setProgressOpen(false)}>
              Hủy
            </SecondaryButton>
            <PrimaryButton type="submit">Lưu tiến độ</PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* Modal Ghi nhận kết quả */}
      <Modal title="Ghi nhận kết quả sửa chữa" onClose={() => setResultOpen(false)} open={resultOpen}>
        <form onSubmit={handleRecordResult} className="space-y-4">
          <Field label="Mô tả kết quả" required>
            <Textarea
              required
              placeholder="VD: Đã thay thế bóng đèn chiếu và vệ sinh quạt tản nhiệt thành công..."
              value={workResult}
              onChange={(e) => setWorkResult(e.target.value)}
            />
          </Field>
          <Field label="Chi phí sửa chữa (VNĐ)">
            <Input
              type="number"
              min="0"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
            />
          </Field>
          <Field label="Tình trạng thiết bị sau sửa" required>
            <Input
              required
              value={resCondition}
              onChange={(e) => setResCondition(e.target.value)}
            />
          </Field>
          <Field label="Trạng thái thiết bị" required>
            <Select value={resStatus} onChange={(e) => setResStatus(e.target.value)}>
              <option value="working">Hoạt động tốt</option>
              <option value="damaged">Vẫn còn lỗi / hỏng</option>
              <option value="maintenance">Cần theo dõi thêm</option>
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
