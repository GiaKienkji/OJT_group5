import React, { useState, useEffect } from 'react';
import { DollarSign, Wallet, TrendingUp, CalendarCheck, RefreshCcw } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { financeApi, FinanceDashboard, FeeAssignment, Payment, FeeCampaign } from '../../../services/tv4Api';
import {
  PageHeader, Stat, Card, CardHeader, TableWrap, Th, Td, Badge,
  fmtMoney, fmtDate, statusTone, statusLabel, Loading, ErrorBox, Empty,
} from '../../shared/ui';

interface DashData {
  dash: FinanceDashboard;
  debts: FeeAssignment[];
  payments: Payment[];
  campaigns: FeeCampaign[];
}

export const FinanceDashboardPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canView = hasPermission('finance.manage');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [dash, debts, payments, campaigns] = await Promise.all([
        financeApi.getDashboard(),
        financeApi.getDebts(),
        financeApi.getPayments(),
        financeApi.getFeeCampaigns(),
      ]);
      setData({ dash, debts, payments, campaigns });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Không tải được dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (!canView) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-10 text-center text-slate-500">
        Bạn không có quyền truy cập khu vực tài chính.
      </div>
    );
  }

  if (loading) return <Loading text="Đang tải tổng quan tài chính…" />;
  if (error) return <ErrorBox message={error} onRetry={load} />;
  if (!data) return <Empty />;

  const indicator = (v: string | number | undefined): string => {
    const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
    if (isNaN(n)) return '—';
    return fmtMoney(n);
  };

  return (
    <div>
      <PageHeader title="Tổng quan Tài chính" subtitle="Tình hình thu chi và công nợ học sinh" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Stat label="Đã thu" value={indicator(data.dash.totalCollected)} icon={<DollarSign className="w-5 h-5" />} tone="text-emerald-600" />
        <Stat label="Công nợ phải thu" value={indicator(data.dash.outstandingDebt)} icon={<Wallet className="w-5 h-5" />} tone="text-red-600" />
        <Stat label="Chiến dịch đang chạy" value={String(data.dash.activeCampaigns ?? '—')} icon={<TrendingUp className="w-5 h-5" />} tone="text-[#0B4F8A]" />
        <Stat label="Thanh toán hôm nay" value={String(data.dash.paymentsToday ?? '—')} icon={<CalendarCheck className="w-5 h-5" />} tone="text-amber-600" />
        <Stat label="Giao dịch chưa đối soát" value={String(data.dash.unreconciledTransactions ?? '—')} icon={<RefreshCcw className="w-5 h-5" />} tone="text-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Công nợ học sinh gần đây" />
          {data.debts.length === 0 ? (
            <Empty text="Không có công nợ" />
          ) : (
            <TableWrap>
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <Th>Học sinh</Th>
                    <Th>Khoản phí</Th>
                    <Th>Phải thu</Th>
                    <Th>Còn nợ</Th>
                    <Th>Hạn</Th>
                    <Th>TT</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.debts.slice(0, 6).map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <Td className="font-semibold text-slate-900">{d.studentName}</Td>
                      <Td>{d.feeName}</Td>
                      <Td>{fmtMoney(d.amountDue)}</Td>
                      <Td className="text-red-600 font-semibold">{fmtMoney(d.balance)}</Td>
                      <Td>{fmtDate(d.dueDate)}</Td>
                      <Td>
                        <Badge tone={statusTone(d.status)}>{statusLabel(d.status)}</Badge>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </Card>

        <Card>
          <CardHeader title="Thanh toán gần đây" />
          {data.payments.length === 0 ? (
            <Empty text="Chưa có giao dịch" />
          ) : (
            <TableWrap>
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <Th>Học sinh</Th>
                    <Th>Số tiền</Th>
                    <Th>Hình thức</Th>
                    <Th>Ngày</Th>
                    <Th>TT</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.slice(0, 6).map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <Td className="font-semibold text-slate-900">{p.studentName}</Td>
                      <Td>{fmtMoney(p.amount)}</Td>
                      <Td>{statusLabel(p.method)}</Td>
                      <Td>{fmtDate(p.paidAt)}</Td>
                      <Td>
                        <Badge tone={statusTone(p.status)}>{statusLabel(p.status)}</Badge>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </Card>
      </div>
    </div>
  );
};