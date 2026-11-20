import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { financeApi, Payment } from '../../../services/tv4Api';
import {
  PageHeader, Card, TableWrap, Th, Td, Badge, Modal,
  PrimaryButton, SecondaryButton, Input, Select, Field,
  statusTone, statusLabel, fmtMoney, fmtDate, Loading, ErrorBox, Empty, Toast,
} from '../../shared/ui';

export const PaymentsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canRecord = hasPermission('payments.record');
  const canReconcile = hasPermission('payments.reconcile');
  const [list, setList] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<{ studentId?: string; status?: string }>({});
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [allocations, setAllocations] = useState<{ chargeId: string; amount: string }[]>([{ chargeId: '', amount: '' }]);

  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyPayment, setVerifyPayment] = useState<Payment | null>(null);
  const [verifyDecision, setVerifyDecision] = useState<'verified' | 'rejected'>('verified');

  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, tone: 'success' | 'error' = 'success') => {
    setToast({ message: msg, tone });
    setTimeout(() => setToast(null), 4000);
  };

  const load = async () => {
    setLoading(true);
    try {
      setList(await financeApi.getPayments(filters));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Không tải thanh toán');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filters.studentId, filters.status]);

  if (!canRecord && !canReconcile) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-10 text-center text-slate-500">
        Bạn không có quyền quản lý thanh toán.
      </div>
    );
  }

  if (loading) return <Loading text="Đang tải thanh toán…" />;
  if (error) return <ErrorBox message={error} onRetry={load} />;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) { setError('Số tiền phải lớn hơn 0.'); return; }
    const allocs = allocations.filter(a => a.chargeId && Number(a.amount) > 0);
    const sum = allocs.reduce((s, a) => s + Number(a.amount), 0);
    if (sum !== amt) { setError('Tổng phân phối phải bằng số tiền thanh toán.'); return; }
    try {
      await financeApi.createPayment({
        studentId,
        amount: amt,
        paymentMethod: method as 'cash' | 'bank_transfer' | 'gateway',
        allocations: allocs.map(a => ({ chargeId: a.chargeId, amount: Number(a.amount) })),
      });
      setOpen(false); setStudentId(''); setAmount(''); setMethod('cash'); setAllocations([{ chargeId: '', amount: '' }]);
      await load();
      showToast('Đã ghi nhận thanh toán.');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ghi nhận thanh toán thất bại.');
    }
  };

  const addAlloc = () => setAllocations([...allocations, { chargeId: '', amount: '' }]);
  const removeAlloc = (i: number) => setAllocations(allocations.filter((_, idx) => idx !== i));

  const handleVerify = async () => {
    if (!verifyPayment) return;
    try {
      await financeApi.verifyPayment(verifyPayment.id, { decision: verifyDecision });
      setVerifyOpen(false); setVerifyPayment(null);
      await load();
      showToast(verifyDecision === 'verified' ? 'Đã xác nhận thanh toán.' : 'Đã từ chối thanh toán.');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Xác nhận thất bại.');
    }
  };

  const methods = [
    { value: 'cash', label: 'Tiền mặt' },
    { value: 'bank_transfer', label: 'Chuyển khoản' },
    { value: 'gateway', label: 'Cổng thanh toán' },
  ];

  return (
    <div>
      <PageHeader
        title="Thanh toán"
        subtitle="Ghi nhận và xác nhận thanh toán học phí"
        action={canRecord && (
          <PrimaryButton onClick={() => { setStudentId(''); setAmount(''); setMethod('cash'); setAllocations([{ chargeId: '', amount: '' }]); setOpen(true); }}>
            ＋ Ghi nhận thanh toán
          </PrimaryButton>
        )}
      />

      {toast && <Toast message={toast.message} onClose={() => setToast(null)} tone={toast.tone} />}

      <Card>
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Danh sách thanh toán</h3>
          <div className="flex gap-2">
            <Select value={filters.status || ''} onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}>
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Chờ xử lý</option>
              <option value="verified">Đã xác nhận</option>
              <option value="rejected">Từ chối</option>
              <option value="refunded">Hoàn tiền</option>
            </Select>
            <SecondaryButton onClick={load}><span role="img" aria-label="Làm mới">🔄</span></SecondaryButton>
          </div>
        </div>
        {list.length === 0 ? (
          <Empty text="Chưa có giao dịch thanh toán." />
        ) : (
          <TableWrap>
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr><Th>Học sinh</Th><Th>Số tiền</Th><Th>Hình thức</Th><Th>Ngày</Th><Th>TT</Th><Th>Hành động</Th></tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <Td className="font-semibold text-slate-900">{p.student_name}</Td>
                    <Td>{fmtMoney(p.amount)}</Td>
                    <Td>{statusLabel(p.method)}</Td>
                    <Td>{fmtDate(p.paid_at)}</Td>
                    <Td><Badge tone={statusTone(p.status)}>{statusLabel(p.status)}</Badge></Td>
                    <Td className="flex gap-2">
                      {p.status === 'pending' && canReconcile && (
                        <SecondaryButton size="sm" onClick={() => { setVerifyPayment(p); setVerifyDecision('verified'); setVerifyOpen(true); }}>Xác nhận</SecondaryButton>
                      )}
                      {p.status === 'pending' && canReconcile && (
                        <SecondaryButton size="sm" onClick={() => { setVerifyPayment(p); setVerifyDecision('rejected'); setVerifyOpen(true); }}>Từ chối</SecondaryButton>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Card>

      <Modal title="Ghi nhận thanh toán" onClose={() => setOpen(false)} open={open}>
        <form onSubmit={handleSave} className="space-y-4">
          <Field label="Học sinh" required>
            <Input placeholder="Mã hoặc tên học sinh" value={studentId} onChange={(e) => setStudentId(e.target.value)} required />
          </Field>
          <Field label="Số tiền" required>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </Field>
          <Field label="Hình thức">
            <Select value={method} onChange={(e) => setMethod(e.target.value as 'cash' | 'bank_transfer' | 'gateway')}>
              {methods.map((m) => (<option key={m.value} value={m.value}>{m.label}</option>))}
            </Select>
          </Field>
          <Field label="Phân phối khoản thu" required>
            <div className="space-y-2">
              {allocations.map((a, i) => (
                <div key={i} className="flex gap-2">
                  <Input placeholder="Mã khoản thu" value={a.chargeId} onChange={(e) => { const n = [...allocations]; n[i].chargeId = e.target.value; setAllocations(n); }} />
                  <Input type="number" placeholder="Số tiền" value={a.amount} onChange={(e) => { const n = [...allocations]; n[i].amount = e.target.value; setAllocations(n); }} />
                  {allocations.length > 1 && <SecondaryButton size="sm" onClick={() => removeAlloc(i)}>Xóa</SecondaryButton>}
                </div>
              ))}
              <SecondaryButton size="sm" onClick={addAlloc}>Thêm phân phối</SecondaryButton>
            </div>
          </Field>
          <div className="flex justify-end gap-2">
            <SecondaryButton type="button" onClick={() => setOpen(false)}>Hủy</SecondaryButton>
            <PrimaryButton type="submit" disabled={!canRecord}>Lưu</PrimaryButton>
          </div>
        </form>
      </Modal>

      <Modal title={`Xác nhận: ${verifyPayment?.student_name ?? ''}`} onClose={() => setVerifyOpen(false)} open={verifyOpen}>
        <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }} className="space-y-4">
          <p className="text-sm text-slate-500">{fmtMoney(verifyPayment?.amount ?? 0)} – {statusLabel(verifyPayment?.status ?? '')}</p>
          <Field label="Quyết định">
            <Select value={verifyDecision} onChange={(e) => setVerifyDecision(e.target.value as 'verified' | 'rejected')}>
              <option value="verified">Xác nhận</option>
              <option value="rejected">Từ chối</option>
            </Select>
          </Field>
          <div className="flex justify-end gap-2">
            <SecondaryButton type="button" onClick={() => setVerifyOpen(false)}>Hủy</SecondaryButton>
            <PrimaryButton type="submit">Xác nhận</PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
};
