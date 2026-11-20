import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { facilityApi, BorrowRequest, Asset } from '../../../services/tv4Api';
import {
  PageHeader, Card, TableWrap, Th, Td, Badge, Modal,
  PrimaryButton, SecondaryButton, Input, Select, Field, Textarea,
  statusTone, statusLabel, fmtDateTime, Loading, ErrorBox, Empty, Toast,
} from '../../shared/ui';

export const BorrowRequestsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('assets.manage');
  const canSubmit = hasPermission('workflow.submit');

  const [list, setList] = useState<BorrowRequest[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  // Create modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [assetId, setAssetId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [dueAt, setDueAt] = useState('');

  // Handover modal state
  const [handoverOpen, setHandoverOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<BorrowRequest | null>(null);
  const [handoverNote, setHandoverNote] = useState('');

  // Return modal state
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnCondition, setReturnCondition] = useState('Tốt');
  const [returnStatus, setReturnStatus] = useState('working');
  const [returnNote, setReturnNote] = useState('');

  const showToast = (message: string, tone: 'success' | 'error' = 'success') => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 4000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [reqs, asts] = await Promise.all([
        facilityApi.getBorrowRequests(),
        facilityApi.getAssets({ status: 'working' }),
      ]);
      setList(reqs);
      setAssets(asts);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Không thể tải danh sách mượn trả.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId) {
      setError('Vui lòng chọn thiết bị.');
      return;
    }
    if (!purpose.trim()) {
      setError('Vui lòng nhập mục đích mượn.');
      return;
    }
    try {
      await facilityApi.createBorrowRequest({
        assetId,
        purpose: purpose.trim(),
        dueAt: dueAt || undefined,
      });
      setCreateOpen(false);
      setAssetId('');
      setPurpose('');
      setDueAt('');
      await load();
      showToast('Đã tạo yêu cầu mượn thiết bị thành công.');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Tạo yêu cầu mượn thất bại.');
    }
  };

  const handleHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;
    try {
      await facilityApi.handoverBorrow(selectedReq.id, { note: handoverNote.trim() || undefined });
      setHandoverOpen(false);
      setSelectedReq(null);
      setHandoverNote('');
      await load();
      showToast('Đã xác nhận bàn giao thiết bị.');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Bàn giao thiết bị thất bại.');
    }
  };

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;
    try {
      await facilityApi.returnBorrow(selectedReq.id, {
        condition: returnCondition.trim() || 'Tốt',
        status: returnStatus,
        note: returnNote.trim() || undefined,
      });
      setReturnOpen(false);
      setSelectedReq(null);
      setReturnCondition('Tốt');
      setReturnStatus('working');
      setReturnNote('');
      await load();
      showToast('Đã xác nhận thu hồi / trả thiết bị.');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Xác nhận trả thiết bị thất bại.');
    }
  };

  if (loading) return <Loading text="Đang tải danh sách mượn trả thiết bị…" />;
  if (error) return <ErrorBox message={error} onRetry={load} />;

  return (
    <div>
      <PageHeader
        title="Quản lý Mượn / Trả thiết bị"
        subtitle="Tiếp nhận yêu cầu mượn, bàn giao và xác nhận trả thiết bị (FAC-10, FAC-11, FAC-12)"
        action={
          canSubmit && (
            <PrimaryButton onClick={() => setCreateOpen(true)}>＋ Mượn thiết bị</PrimaryButton>
          )
        }
      />

      {toast && <Toast message={toast.message} onClose={() => setToast(null)} tone={toast.tone} />}

      <Card>
        {list.length === 0 ? (
          <Empty text="Chưa có yêu cầu mượn thiết bị nào." />
        ) : (
          <TableWrap>
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr>
                  <Th>Mã yêu cầu</Th>
                  <Th>Mã thiết bị</Th>
                  <Th>Mục đích</Th>
                  <Th>Hạn trả dự kiến</Th>
                  <Th>Trạng thái</Th>
                  <Th>Thao tác</Th>
                </tr>
              </thead>
              <tbody>
                {list.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50">
                    <Td className="font-semibold text-slate-900">{req.id.slice(0, 8)}...</Td>
                    <Td className="text-xs text-slate-600">{req.assetCode ? `${req.assetCode} - ${req.assetName}` : `${req.assetId.slice(0, 8)}...`}</Td>
                    <Td>{req.purpose}</Td>
                    <Td>{req.dueAt ? fmtDateTime(req.dueAt) : '—'}</Td>
                    <Td>
                      <Badge tone={statusTone(req.status)}>{statusLabel(req.status)}</Badge>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1.5">
                        {canManage && req.status === 'pending' && (
                          <PrimaryButton
                            size="sm"
                            onClick={() => {
                              setSelectedReq(req);
                              setHandoverOpen(true);
                            }}
                          >
                            Bàn giao
                          </PrimaryButton>
                        )}
                        {canManage && (req.status === 'in_progress' || req.status === 'handed_over') && (
                          <SecondaryButton
                            size="sm"
                            onClick={() => {
                              setSelectedReq(req);
                              setReturnOpen(true);
                            }}
                          >
                            Thu hồi / Trả
                          </SecondaryButton>
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

      {/* Modal Tạo yêu cầu mượn */}
      <Modal title="Tạo yêu cầu mượn thiết bị" onClose={() => setCreateOpen(false)} open={createOpen}>
        <form onSubmit={handleCreate} className="space-y-4">
          <Field label="Thiết bị" required>
            <Select value={assetId} onChange={(e) => setAssetId(e.target.value)} required>
              <option value="">-- Chọn thiết bị đang hoạt động --</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} - {a.name} ({a.category})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Mục đích mượn" required>
            <Input
              required
              placeholder="VD: Dạy học thực hành môn Tin học, hội thảo..."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </Field>
          <Field label="Hạn trả dự kiến">
            <Input
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <SecondaryButton type="button" onClick={() => setCreateOpen(false)}>
              Hủy
            </SecondaryButton>
            <PrimaryButton type="submit">Gửi yêu cầu</PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* Modal Bàn giao */}
      <Modal title="Xác nhận bàn giao thiết bị" onClose={() => setHandoverOpen(false)} open={handoverOpen}>
        <form onSubmit={handleHandover} className="space-y-4">
          <p className="text-sm text-slate-600">
            Bạn đang xác nhận bàn giao thiết bị cho yêu cầu{' '}
            <strong className="text-slate-900">{selectedReq?.id.slice(0, 8)}</strong>.
          </p>
          <Field label="Ghi chú bàn giao">
            <Textarea
              placeholder="Tình trạng phụ kiện kèm theo, số lượng bàn giao..."
              value={handoverNote}
              onChange={(e) => setHandoverNote(e.target.value)}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <SecondaryButton type="button" onClick={() => setHandoverOpen(false)}>
              Hủy
            </SecondaryButton>
            <PrimaryButton type="submit">Xác nhận bàn giao</PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* Modal Thu hồi / Trả */}
      <Modal title="Xác nhận trả thiết bị" onClose={() => setReturnOpen(false)} open={returnOpen}>
        <form onSubmit={handleReturn} className="space-y-4">
          <p className="text-sm text-slate-600">
            Kiểm tra và xác nhận thu hồi thiết bị cho yêu cầu{' '}
            <strong className="text-slate-900">{selectedReq?.id.slice(0, 8)}</strong>.
          </p>
          <Field label="Tình trạng khi nhận lại" required>
            <Input
              required
              placeholder="VD: Hoạt động bình thường, xước nhẹ..."
              value={returnCondition}
              onChange={(e) => setReturnCondition(e.target.value)}
            />
          </Field>
          <Field label="Trạng thái thiết bị cập nhật" required>
            <Select value={returnStatus} onChange={(e) => setReturnStatus(e.target.value)}>
              <option value="working">Hoạt động tốt</option>
              <option value="damaged">Bị hỏng / lỗi</option>
              <option value="maintenance">Cần bảo dưỡng</option>
            </Select>
          </Field>
          <Field label="Ghi chú hoàn trả">
            <Textarea
              placeholder="Nhận xét chi tiết khi nhận lại thiết bị..."
              value={returnNote}
              onChange={(e) => setReturnNote(e.target.value)}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <SecondaryButton type="button" onClick={() => setReturnOpen(false)}>
              Hủy
            </SecondaryButton>
            <PrimaryButton type="submit">Xác nhận thu hồi</PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
};
