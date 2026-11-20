import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  facilityApi, Proposal, Asset,
} from '../../../services/tv4Api';
import {
  PageHeader, Card, TableWrap, Th, Td, Badge, Modal,
  PrimaryButton, SecondaryButton, Input, Select, Field, Textarea,
  statusTone, statusLabel, fmtMoney, Loading, ErrorBox, Empty, Toast,
} from '../../shared/ui';

export const ProposalsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('assets.manage');
  const canApprove = hasPermission('facilities.approve_purchase') || hasPermission('workflow.approve');

  const [list, setList] = useState<Proposal[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  // Modal Create Proposal
  const [createOpen, setCreateOpen] = useState(false);
  const [propType, setPropType] = useState<'purchase' | 'replacement'>('purchase');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [assetId, setAssetId] = useState('');

  // Modal Decision
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [selectedProp, setSelectedProp] = useState<Proposal | null>(null);
  const [decisionType, setDecisionType] = useState<'approved' | 'rejected'>('approved');
  const [decisionReason, setDecisionReason] = useState('');

  const showToast = (message: string, tone: 'success' | 'error' = 'success') => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 4000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [props, asts] = await Promise.all([
        facilityApi.getProposals(),
        facilityApi.getAssets(),
      ]);
      setList(props);
      setAssets(asts);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Không thể tải danh sách đề xuất.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề đề xuất.');
      return;
    }
    if (propType === 'replacement' && !assetId) {
      setError('Đề xuất thay thế bắt buộc phải chọn thiết bị hiện có.');
      return;
    }
    try {
      await facilityApi.createProposal({
        type: propType,
        title: title.trim(),
        description: desc.trim(),
        quantity: Math.max(1, parseInt(quantity, 10) || 1),
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : undefined,
        assetId: propType === 'replacement' ? assetId : undefined,
      });
      setCreateOpen(false);
      setTitle('');
      setDesc('');
      setQuantity('1');
      setEstimatedCost('');
      setAssetId('');
      await load();
      showToast('Đã gửi đề xuất lên Ban giám hiệu thành công.');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gửi đề xuất thất bại.');
    }
  };

  const handleDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProp) return;
    try {
      await facilityApi.decideProposal(selectedProp.id, {
        decision: decisionType,
        reason: decisionReason.trim() || undefined,
      });
      setDecisionOpen(false);
      setSelectedProp(null);
      setDecisionReason('');
      await load();
      showToast(`Đã ${decisionType === 'approved' ? 'phê duyệt' : 'từ chối'} đề xuất.`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Xử lý đề xuất thất bại.');
    }
  };

  if (loading) return <Loading text="Đang tải đề xuất mua sắm & thay thế…" />;
  if (error) return <ErrorBox message={error} onRetry={load} />;

  return (
    <div>
      <PageHeader
        title="Đề xuất Mua sắm & Thay thế Thiết bị"
        subtitle="Lập tờ trình mua sắm, đề xuất thay thế thiết bị hỏng và theo dõi phê duyệt của BGH (FAC-22, FAC-23, FAC-24)"
        action={
          canManage && (
            <PrimaryButton onClick={() => setCreateOpen(true)}>＋ Lập đề xuất mới</PrimaryButton>
          )
        }
      />

      {toast && <Toast message={toast.message} onClose={() => setToast(null)} tone={toast.tone} />}

      <Card>
        {list.length === 0 ? (
          <Empty text="Chưa có đề xuất nào được tạo." />
        ) : (
          <TableWrap>
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr>
                  <Th>Mã đề xuất</Th>
                  <Th>Loại đề xuất</Th>
                  <Th>Tiêu đề</Th>
                  <Th>Số lượng</Th>
                  <Th>Dự toán kinh phí</Th>
                  <Th>Trạng thái</Th>
                  <Th>Thao tác</Th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <Td className="font-semibold text-slate-900">{p.id.slice(0, 8)}...</Td>
                    <Td>
                      <span className="font-medium text-slate-800">
                        {p.type === 'purchase' ? 'Mua sắm mới' : 'Thay thế thiết bị'}
                      </span>
                    </Td>
                    <Td>
                      <div>
                        <div className="font-medium text-slate-900">{p.title}</div>
                        {p.description && (
                          <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{p.description}</div>
                        )}
                      </div>
                    </Td>
                    <Td>{p.quantity}</Td>
                    <Td className="font-semibold text-slate-900">
                      {p.estimatedCost ? fmtMoney(p.estimatedCost) : '—'}
                    </Td>
                    <Td>
                      <Badge tone={statusTone(p.status)}>{statusLabel(p.status)}</Badge>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1.5">
                        {canApprove && (p.status === 'submitted' || p.status === 'in_review' || p.status === 'pending') && (
                          <SecondaryButton
                            size="sm"
                            onClick={() => {
                              setSelectedProp(p);
                              setDecisionType('approved');
                              setDecisionOpen(true);
                            }}
                          >
                            Xét duyệt
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

      {/* Modal Lập đề xuất */}
      <Modal title="Lập đề xuất mua sắm / thay thế" onClose={() => setCreateOpen(false)} open={createOpen}>
        <form onSubmit={handleCreate} className="space-y-4">
          <Field label="Loại đề xuất" required>
            <Select value={propType} onChange={(e) => setPropType(e.target.value as 'purchase' | 'replacement')}>
              <option value="purchase">Mua sắm thiết bị mới</option>
              <option value="replacement">Thay thế thiết bị cũ / hỏng</option>
            </Select>
          </Field>
          {propType === 'replacement' && (
            <Field label="Thiết bị cũ cần thay thế" required>
              <Select value={assetId} onChange={(e) => setAssetId(e.target.value)} required>
                <option value="">-- Chọn thiết bị cần thay thế --</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} - {a.name} ({statusLabel(a.status)})
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="Tiêu đề đề xuất" required>
            <Input
              required
              placeholder="VD: Mua sắm thêm 10 màn chiếu tương tác cho khối 9..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <Field label="Mô tả nhu cầu & lý do">
            <Textarea
              placeholder="Giải trình nhu cầu thực tế phục vụ công tác giảng dạy..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Số lượng" required>
              <Input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </Field>
            <Field label="Dự toán kinh phí (VNĐ)">
              <Input
                type="number"
                min="0"
                placeholder="VD: 50000000"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <SecondaryButton type="button" onClick={() => setCreateOpen(false)}>
              Hủy
            </SecondaryButton>
            <PrimaryButton type="submit">Gửi tờ trình</PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* Modal Duyệt đề xuất */}
      <Modal title="Phê duyệt đề xuất" onClose={() => setDecisionOpen(false)} open={decisionOpen}>
        <form onSubmit={handleDecision} className="space-y-4">
          <p className="text-sm text-slate-600">
            Xem xét đề xuất: <strong className="text-slate-900">{selectedProp?.title}</strong>
          </p>
          <Field label="Ý kiến phê duyệt" required>
            <Select value={decisionType} onChange={(e) => setDecisionType(e.target.value as 'approved' | 'rejected')}>
              <option value="approved">Đồng ý phê duyệt (Chấp thuận kinh phí)</option>
              <option value="rejected">Không đồng ý (Từ chối tờ trình)</option>
            </Select>
          </Field>
          <Field label="Ghi chú / Nhận xét lý do">
            <Textarea
              placeholder="Ý kiến chỉ đạo của Ban giám hiệu..."
              value={decisionReason}
              onChange={(e) => setDecisionReason(e.target.value)}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <SecondaryButton type="button" onClick={() => setDecisionOpen(false)}>
              Hủy
            </SecondaryButton>
            <PrimaryButton type="submit">Xác nhận quyết định</PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
};
