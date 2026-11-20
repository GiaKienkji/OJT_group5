import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  financeApi, LookupResult, ReportRow,
} from '../../../services/tv4Api';
import {
  PageHeader, Card, TableWrap, Th, Td, PrimaryButton, SecondaryButton,
  Select, Field, Input, fmtMoney, Loading, ErrorBox, Toast,
} from '../../shared/ui';

export const FinanceReportsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('finance.manage');

  const [lookups, setLookups] = useState<LookupResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  const [reportType, setReportType] = useState<'collection' | 'debt'>('collection');
  const [format, setFormat] = useState<'xlsx' | 'pdf'>('xlsx');
  const [academicYearId, setAcademicYearId] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [classId, setClassId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [reportData, setReportData] = useState<ReportRow[]>([]);
  const [fetchingData, setFetchingData] = useState(false);
  const [exporting, setExporting] = useState(false);

  const showToast = (message: string, tone: 'success' | 'error' = 'success') => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 4000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const lk = await financeApi.getLookups();
      setLookups(lk);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Không tải được danh mục bộ lọc.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleQuery = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFetchingData(true);
    setError('');
    try {
      const filters: Record<string, string> = {
        reportType,
      };
      if (academicYearId) filters.academicYearId = academicYearId;
      if (semesterId) filters.semesterId = semesterId;
      if (classId) filters.classId = classId;
      if (reportType === 'collection') {
        if (fromDate) filters.fromDate = fromDate;
        if (toDate) filters.toDate = toDate;
      }

      const rows = await financeApi.getReports(filters);
      setReportData(rows);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Truy vấn báo cáo thất bại.');
    } finally {
      setFetchingData(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const filters: Record<string, string> = {
        reportType,
      };
      if (academicYearId) filters.academicYearId = academicYearId;
      if (semesterId) filters.semesterId = semesterId;
      if (classId) filters.classId = classId;
      if (reportType === 'collection') {
        if (fromDate) filters.fromDate = fromDate;
        if (toDate) filters.toDate = toDate;
      }

      const blob = await financeApi.exportReport({
        reportType,
        format,
        filters,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bao_cao_Tai_chinh_${reportType}_${new Date().toISOString().slice(0, 10)}.${format}`;
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
        Bạn không có quyền truy cập báo cáo tài chính.
      </div>
    );
  }

  if (loading) return <Loading text="Đang tải dữ liệu bộ lọc báo cáo…" />;
  if (error && !reportData.length) return <ErrorBox message={error} onRetry={load} />;

  return (
    <div>
      <PageHeader
        title="Báo cáo Thu chi & Công nợ"
        subtitle="Báo cáo thu theo lớp, theo kỳ, tổng hợp công nợ và xuất file Excel/PDF (ACC-22 đến ACC-25)"
      />

      {toast && <Toast message={toast.message} onClose={() => setToast(null)} tone={toast.tone} />}

      <Card>
        <div className="p-6">
          <form onSubmit={handleQuery} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Loại báo cáo" required>
                <Select
                  value={reportType}
                  onChange={(e) => {
                    setReportType(e.target.value as 'collection' | 'debt');
                    setReportData([]);
                  }}
                >
                  <option value="collection">Báo cáo Thu học phí / Khoản phí</option>
                  <option value="debt">Báo cáo Tổng hợp Công nợ</option>
                </Select>
              </Field>

              <Field label="Năm học">
                <Select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)}>
                  <option value="">-- Tất cả năm học --</option>
                  {lookups?.AcademicYears?.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Học kỳ">
                <Select value={semesterId} onChange={(e) => setSemesterId(e.target.value)}>
                  <option value="">-- Tất cả học kỳ --</option>
                  {lookups?.Semesters?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Lớp học">
                <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
                  <option value="">-- Tất cả các lớp --</option>
                  {lookups?.Classes?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>

              {reportType === 'collection' && (
                <>
                  <Field label="Từ ngày">
                    <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                  </Field>
                  <Field label="Đến ngày">
                    <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                  </Field>
                </>
              )}
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <PrimaryButton type="submit" disabled={fetchingData}>
                  {fetchingData ? 'Đang truy vấn...' : '🔍 Xem trước số liệu'}
                </PrimaryButton>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Định dạng:</span>
                <Select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as 'xlsx' | 'pdf')}
                  className="w-28 text-xs py-1"
                >
                  <option value="xlsx">Excel (.xlsx)</option>
                  <option value="pdf">PDF (.pdf)</option>
                </Select>
                <SecondaryButton type="button" onClick={handleExport} disabled={exporting}>
                  {exporting ? 'Đang xuất...' : `📥 Xuất tệp ${format.toUpperCase()}`}
                </SecondaryButton>
              </div>
            </div>
          </form>
        </div>
      </Card>

      {/* Bảng xem trước dữ liệu */}
      {reportData.length > 0 && (
        <Card className="mt-6">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">
              Kết quả xem trước ({reportData.length} bản ghi)
            </h3>
          </div>
          <TableWrap>
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50">
                <tr>
                  {Object.keys(reportData[0] || {}).map((col) => (
                    <Th key={col}>{col}</Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportData.slice(0, 50).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 border-t border-slate-100">
                    {Object.entries(row).map(([k, val]) => (
                      <Td key={k}>
                        {typeof val === 'number' && (k.toLowerCase().includes('amount') || k.toLowerCase().includes('debt') || k.toLowerCase().includes('paid') || k.toLowerCase().includes('due') || k.toLowerCase().includes('balance'))
                          ? fmtMoney(val)
                          : String(val ?? '—')}
                      </Td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Card>
      )}
    </div>
  );
};
