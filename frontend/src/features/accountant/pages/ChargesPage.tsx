import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { financeApi, FeeAssignment, FeeAssignmentFilters } from '../../../services/tv4Api';
import {
  PageHeader, Card, TableWrap, Th, Td, Badge, Modal,
  PrimaryButton, SecondaryButton, Input, Select, Field, Textarea,
  statusTone, statusLabel, fmtMoney, fmtDate, Loading, ErrorBox, Empty, Toast,
} from '../../shared/ui';

export const ChargesPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canTrackDebts = hasPermission('debts.track');
  const [list, setList] = useState<FeeAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<FeeAssignmentFilters>({});
  const [debtsOnly, setDebtsOnly] = useState(false);
  const [exemptOpen, setExemptOpen] = useState(false);
  const [exemptCharge, setExemptCharge] = useState<FeeAssignment | null>(null);
  const [exemptAmount, setExemptAmount] = useState('');
  const [exemptReason, setExemptReason] = useState('');

  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, tone: 'success' | 'error' = 'success') => {
    setToast({ message: msg, tone });
    setTimeout(() => setToast(null), 4000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = debtsOnly
        ? await financeApi.getDebts(filters)
        : await financeApi.getFeeAssignments(filters);
      setList(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Không tải khoản thu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [debtsOnly]);

  if (!canTrackDebts) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-10 text-center text-slate-500">
        Bạn không có quyền theo dõi công nợ.
      </div>
    );
  }

  if (loading) return <Loading text="Đang tải khoản thu…" />;
  if (error) return <ErrorBox message={error} onRetry={load} />;

  const handleExemption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exemptCharge) return;
    const amount = Number(exemptAmount);
    if (!amount || amount <= 0) { setError('Số tiền miễn giảm phải lớn hơn 0.'); return; }
    if (!exemptReason.trim()) { setError('Lý do là bắt buộc.'); return; }
    try {
      await financeApi.createExemption(exemptCharge.id, { amount, reason: exemptReason.trim() });
      setExemptOpen(false); setExemptCharge(null); setExemptAmount(''); setExemptReason('');
      await load();
      showToast('Đã gửi yêu cầu miễn giảm.');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gửi yêu cầu thất bại.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Khoản thu &amp; Công nợ"
        subtitle={debtsOnly ? 'Danh sách học sinh còn nợ phải thu' : 'Danh sách tất cả khoản thu đã gói'}
        action={
          canTrackDebts && (
            <SecondaryButton onClick={() => setDebtsOnly(!debtsOnly)}>
              {debtsOnly ? 'Xem tất cả' : 'Chỉ công nợ'}
            </SecondaryButton>
          )
        }
      />

      {toast && <Toast message={toast.message} onClose={() => setToast(null)} tone={toast.tone} />}

      <Card>
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Bộ lọc</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4">
          <Field label="Trạng thái">
            <Select value={String(filters.status ?? '')} onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}>
              <option value="">Tất cả</option>
              <option value="unpaid">Chưa thu</option>
              <option value="partially_paid">Thu một phần</option>
              <option value="paid">Đã thu</option>
            </Select>
          </Field>
          <Field label="Quá hạn">
            <Select value={filters.overdue ? 'true' : 'false'} onChange={(e) => setFilters({ ...filters, overdue: e.target.value === 'true' })}>
              <option value="">Tất cả</option>
              <option value="true">Có</option>
              <option value="false">Không</option>
            </Select>
          </Field>
          <div className="flex items-end">
            <SecondaryButton onClick={load}>Lọc</SecondaryButton>
          </div>
        </div>
        {list.length === 0 ? (
          <Empty text={debtsOnly ? 'Không có công nợ.' : 'Không có khoản thu.'} />
        ) : (
          <TableWrap>
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr>
                  <Th>Học sinh</Th><Th>Lớp</Th><Th>Khoản phí</Th><Th>Chiến dịch</Th>
                  <Th>Phải thu</Th><Th>Đã thu</Th><Th>Còn nợ</Th><Th>Hạn nộp</Th><Th>TT</Th><Th>Hành động</Th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <Td className="font-semibold text-slate-900">{c.student_name}</Td>
                    <Td>{c.class_name}</Td>
                    <Td>{c.fee_name}</Td>
                    <Td className="text-xs text-slate-500">{c.campaign_name}</Td>
                    <Td>{fmtMoney(c.amount_due)}</Td>
                    <Td>{fmtMoney(c.amount_paid)}</Td>
                    <Td className={`font-semibold ${c.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{fmtMoney(c.balance)}</Td>
                    <Td>{fmtDate(c.due_date)}</Td>
                    <Td>
                      <Badge tone={statusTone(c.status)}>{statusLabel(c.status)}</Badge>
                      {c.overdue && <span className="text-xs text-red-600 font-semibold ml-1">QH</span>}
                    </Td>
                    <Td>
                      {c.balance > 0 && canTrackDebts && (
                        <SecondaryButton size="sm" onClick={() => { setExemptCharge(c); setExemptOpen(true); }}>Miễn giảm</SecondaryButton>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Card>

      <Modal title={`Miễn giảm: ${exemptCharge?.student_name ?? ''}`} onClose={() => setExemptOpen(false)} open={exemptOpen}>
        <form onSubmit={handleExemption} className="space-y-4">
          <p className="text-sm text-slate-500">{exemptCharge?.fee_name} – còn nợ {fmtMoney(exemptCharge?.balance)}</p>
          <Field label="Số tiền miễn giảm" required>
            <Input type="number" value={exemptAmount} onChange={(e) => setExemptAmount(e.target.value)} required />
          </Field>
          <Field label="Lý do" required>
            <Textarea value={exemptReason} onChange={(e) => setExemptReason(e.target.value)} required />
          </Field>
          <div className="flex justify-end gap-2">
            <SecondaryButton type="button" onClick={() => setExemptOpen(false)}>Hủy</SecondaryButton>
            <PrimaryButton type="submit">Gửi yêu cầu</PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
};
