import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { financeApi, Adjustment } from '../../../services/tv4Api';
import {
  PageHeader, Card, TableWrap, Th, Td, Badge, Modal,
  PrimaryButton, SecondaryButton, Input, Field, Textarea, Select,
  statusTone, statusLabel, fmtMoney, Loading, ErrorBox, Empty, Toast,
} from '../../shared/ui';

export const AdjustmentsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('finance.manage');
  const canApprove = hasPermission('workflow.approve');
  const [list, setList] = useState<Adjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [paymentId, setPaymentId] = useState('');
  const [type, setType] = useState<'refund' | 'correction'>('refund');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const [decideOpen, setDecideOpen] = useState(false);
  const [decideAdjustment, setDecideAdjustment] = useState<Adjustment | null>(null);
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved');

  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, tone: 'success' | 'error' = 'success') => {
    setToast({ message: msg, tone });
    setTimeout(() => setToast(null), 4000);
  };

  const load = async () => {
    setLoading(true);
    try {
      setList(await financeApi.getAdjustments());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Không tải điều chỉnh');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (!canManage) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-10 text-center text-slate-500">
        Bạn không có quyền quản lý điều chỉnh thanh toán.
      </div>
    );
  }

  if (loading) return <Loading text="Đang tải điều chỉnh…" />;
  if (error) return <ErrorBox message={error} onRetry={load} />;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) { setError('Số tiền phải lớn hơn 0.'); return; }
    try {
      await financeApi.createAdjustment({ paymentId, type, amount: amt, reason: reason.trim() });
      setOpen(false); setPaymentId(''); setType('refund'); setAmount(''); setReason('');
      await load();
      showToast('Đã gửi yêu cầu điều chỉnh.');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gửi điều chỉnh thất bại.');
    }
  };

  const handleDecide = async () => {
    if (!decideAdjustment) return;
    try {
      await financeApi.decideAdjustment(decideAdjustment.id, { decision, reason: '' });
      setDecideOpen(false); setDecideAdjustment(null);
      await load();
      showToast(decision === 'approved' ? 'Đã duyệt điều chỉnh.' : 'Đã từ chối điều chỉnh.');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Duyệt thất bại.');
    }
  };

  const handleExecute = async (id: string) => {
    if (!confirm('Thực hiện điều chỉnh này sẽ áp dụng hoàn tiền/chỉnh sửa thanh toán. Tiếp tục?')) return;
    try {
      await financeApi.executeAdjustment(id);
      await load();
      showToast('Đã thực hiện điều chỉnh.');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Thực hiện thất bại.');
    }
  };

  const types = [
    { value: 'refund', label: 'Hoàn tiền' },
    { value: 'correction', label: 'Điều chỉnh sai sót' },
  ];

  return (
    <div>
      <PageHeader
        title="Điều chỉnh Thanh toán"
        subtitle="Yêu cầu hoàn tiền hoặc điều chỉnh sai sót giao dịch đã ghi nhận"
        action={
          canManage && (
            <PrimaryButton onClick={() => { setPaymentId(''); setType('refund'); setAmount(''); setReason(''); setOpen(true); }}>
              ＋ Yêu cầu điều chỉnh
            </PrimaryButton>
          )
        }
      />

      {toast && <Toast message={toast.message} onClose={() => setToast(null)} tone={toast.tone} />}

      <Card>
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Danh sách điều chỉnh</h3>
        </div>
        {list.length === 0 ? (
          <Empty text="Chưa có yêu cầu điều chỉnh nào." />
        ) : (
          <TableWrap>
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr>
                  <Th>Mã thanh toán</Th>
                  <Th>Loại</Th>
                  <Th>Số tiền</Th>
                  <Th>Lý do</Th>
                  <Th>Trạng thái</Th>
                  <Th>Hành động</Th>
                </tr>
              </thead>
              <tbody>
                {list.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <Td className="font-semibold text-slate-900">{a.paymentId}</Td>
                    <Td>{statusLabel(a.type)}</Td>
                    <Td>{fmtMoney(a.amount)}</Td>
                    <Td>{a.reason}</Td>
                    <Td>
                      <Badge tone={statusTone(a.status)}>{statusLabel(a.status)}</Badge>
                    </Td>
                    <Td className="flex gap-2">
                      {a.status === 'submitted' && canApprove && (
                        <SecondaryButton size="sm" onClick={() => { setDecideAdjustment(a); setDecision('approved'); setDecideOpen(true); }}>Duyệt</SecondaryButton>
                      )}
                      {a.status === 'submitted' && canApprove && (
                        <SecondaryButton size="sm" onClick={() => { setDecideAdjustment(a); setDecision('rejected'); setDecideOpen(true); }}>Từ chối</SecondaryButton>
                      )}
                      {a.status === 'approved' && canManage && (
                        <SecondaryButton size="sm" onClick={() => handleExecute(a.id)}>Thực hiện</SecondaryButton>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Card>

      <Modal title="Yêu cầu điều chỉnh" onClose={() => setOpen(false)} open={open}>
        <form onSubmit={handleCreate} className="space-y-4">
          <Field label="Mã thanh toán" required>
            <Input value={paymentId} onChange={(e) => setPaymentId(e.target.value)} required />
          </Field>
          <Field label="Loại điều chỉnh">
            <Select value={type} onChange={(e) => setType(e.target.value as 'refund' | 'correction')}>
              {types.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
            </Select>
          </Field>
          <Field label="Số tiền" required>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </Field>
          <Field label="Lý do" required>
            <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} required />
          </Field>
          <div className="flex justify-end gap-2">
            <SecondaryButton type="button" onClick={() => setOpen(false)}>Hủy</SecondaryButton>
            <PrimaryButton type="submit" disabled={!canManage}>Gửi yêu cầu</PrimaryButton>
          </div>
        </form>
      </Modal>

      <Modal title={`Quyết định: ${decideAdjustment?.id ?? ''}`} onClose={() => setDecideOpen(false)} open={decideOpen}>
        <form onSubmit={(e) => { e.preventDefault(); handleDecide(); }} className="space-y-4">
          <p className="text-sm text-slate-500">{statusLabel(decideAdjustment?.type ?? '')} {fmtMoney(decideAdjustment?.amount)} – {decideAdjustment?.reason ?? ''}</p>
          <Field label="Quyết định">
            <Select value={decision} onChange={(e) => setDecision(e.target.value as 'approved' | 'rejected')}>
              <option value="approved">Duyệt</option>
              <option value="rejected">Từ chối</option>
            </Select>
          </Field>
          <div className="flex justify-end gap-2">
            <SecondaryButton type="button" onClick={() => setDecideOpen(false)}>Hủy</SecondaryButton>
            <PrimaryButton type="submit" disabled={!canApprove}>{decision === 'approved' ? 'Duyệt' : 'Từ chối'}</PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
};
