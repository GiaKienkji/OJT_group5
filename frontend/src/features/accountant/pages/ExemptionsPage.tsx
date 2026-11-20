import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { financeApi, Exemption } from '../../../services/tv4Api';
import {
  PageHeader, Card, TableWrap, Th, Td, Badge, Modal,
  PrimaryButton, SecondaryButton, Field, Select,
  statusTone, statusLabel, fmtMoney, fmtDate, Loading, ErrorBox, Empty, Toast,
} from '../../shared/ui';

export const ExemptionsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canApprove = hasPermission('workflow.approve');
  const [list, setList] = useState<Exemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [decideOpen, setDecideOpen] = useState(false);
  const [decideExemption, setDecideExemption] = useState<Exemption | null>(null);
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved');

  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, tone: 'success' | 'error' = 'success') => {
    setToast({ message: msg, tone });
    setTimeout(() => setToast(null), 4000);
  };

  const load = async () => {
    setLoading(true);
    try { setList([]); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Không tải yêu cầu miễn giảm'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (!canApprove) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-10 text-center text-slate-500">
        Bạn không có quyền duyệt yêu cầu miễn giảm.
      </div>
    );
  }

  if (loading) return <Loading text="Đang tải yêu cầu miễn giảm…" />;
  if (error) return <ErrorBox message={error} onRetry={load} />;

  const handleDecide = async () => {
    if (!decideExemption) return;
    try {
      await financeApi.decideExemption(decideExemption.id, { decision, reason: '' });
      setDecideOpen(false); setDecideExemption(null);
      await load();
      showToast(decision === 'approved' ? 'Đã duyệt miễn giảm.' : 'Đã từ chối miễn giảm.');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Duyệt thất bại.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Yêu cầu Miễn giảm"
        subtitle="Duyệt hoặc từ chối yêu cầu miễn giảm khoản thu học sinh"
        action={
          canApprove && (
            <SecondaryButton onClick={load}><span role="img" aria-label="Làm mới">🔄</span> Làm mới</SecondaryButton>
          )
        }
      />

      {toast && <Toast message={toast.message} onClose={() => setToast(null)} tone={toast.tone} />}

      <Card>
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Danh sách yêu cầu miễn giảm</h3>
        </div>
        <p className="text-sm text-slate-500 p-4 m-0">Yêu cầu miễn giảm được sinh từ trang Công nợ khi kế toán chọn "Miễn giảm" trên một khoản thu. Duyệt yêu cầu ở đây.</p>
        {list.length === 0 ? (
          <Empty text="Chưa có yêu cầu miễn giảm nào chờ duyệt." />
        ) : (
          <TableWrap>
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr><Th>Học sinh</Th><Th>Số tiền</Th><Th>Lý do</Th><Th>Ngày tạo</Th><Th>Trạng thái</Th><Th>Hành động</Th></tr>
              </thead>
              <tbody>
                {list.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <Td className="font-semibold text-slate-900">{e.id}</Td>
                    <Td>{fmtMoney(e.amount)}</Td>
                    <Td>{e.reason}</Td>
                    <Td>{fmtDate(e.created_at)}</Td>
                    <Td><Badge tone={statusTone(e.status)}>{statusLabel(e.status)}</Badge></Td>
                    <Td>
                      {e.status === 'submitted' && canApprove && (
                        <SecondaryButton size="sm" onClick={() => { setDecideExemption(e); setDecision('approved'); setDecideOpen(true); }}>Duyệt</SecondaryButton>
                      )}
                      {e.status === 'submitted' && canApprove && (
                        <SecondaryButton size="sm" onClick={() => { setDecideExemption(e); setDecision('rejected'); setDecideOpen(true); }}>Từ chối</SecondaryButton>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Card>

      <Modal title={`Quyết định: ${decideExemption?.id ?? ''}`} onClose={() => setDecideOpen(false)} open={decideOpen}>
        <form onSubmit={(e) => { e.preventDefault(); handleDecide(); }} className="space-y-4">
          <p className="text-sm text-slate-500">Số tiền: {fmtMoney(decideExemption?.amount ?? 0)} – Lý do: {decideExemption?.reason ?? ''}</p>
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
