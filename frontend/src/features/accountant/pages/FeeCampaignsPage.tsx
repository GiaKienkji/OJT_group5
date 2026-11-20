import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  financeApi, FeeCampaign, FeeCampaignCreate, CampaignRuleSave,
} from '../../../services/tv4Api';
import {
  PageHeader, TableWrap, Th, Td, Badge, Modal,
  PrimaryButton, SecondaryButton, Input, Select, Field,
  statusTone, statusLabel, fmtDate, Loading, ErrorBox, Empty, Toast,
} from '../../shared/ui';

const STATUS_ISSUED = 'issued';

interface RuleRow {
  feeCategoryId: string;
  gradeLevelId: string;
  classId: string;
  amount: string;
  dueDate: string;
}

export const FeeCampaignsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('fee_campaigns.manage');
  const [list, setList] = useState<FeeCampaign[]>([]);
  const [lookups, setLookups] = useState<{ academicYears: { id: string; name: string }[]; classes: { id: string; code: string; name: string }[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FeeCampaign | null>(null);
  const [name, setName] = useState('');
  const [academicYearId, setAcademicYearId] = useState<string>('');
  const [semesterId, setSemesterId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [status, setStatus] = useState('draft');

  const [ruleOpen, setRuleOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<FeeCampaign | null>(null);
  const [ruleRows, setRuleRows] = useState<RuleRow[]>([{ feeCategoryId: '', gradeLevelId: '', classId: '', amount: '', dueDate: '' }]);
  const [ruleLoading, setRuleLoading] = useState(false);
  const [ruleError, setRuleError] = useState('');

  const [applyOpen, setApplyOpen] = useState(false);
  const [applyCampaign, setApplyCampaign] = useState<FeeCampaign | null>(null);
  const [applyStudents, setApplyStudents] = useState<string[]>([]);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyResult, setApplyResult] = useState<{ createdCount: number; duplicateCount: number } | null>(null);

  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, tone: 'success' | 'error' = 'success') => {
    setToast({ message: msg, tone });
    setTimeout(() => setToast(null), 4000);
  };

  const closeToast = () => setToast(null);

  const load = async () => {
    setLoading(true);
    try {
      const [campaigns, lookups] = await Promise.all([
        financeApi.getFeeCampaigns(),
        financeApi.getLookups(),
      ]);
      setList(campaigns);
      setLookups({
        academicYears: lookups.AcademicYears,
        classes: lookups.Classes,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Không tải chiến dịch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (!canManage) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-10 text-center text-slate-500">
        Bạn không có quyền quản lý chiến dịch học phí.
      </div>
    );
  }

  if (loading) return <Loading text="Đang tải chiến dịch học phí…" />;
  if (error) return <ErrorBox message={error} onRetry={load} />;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Tên chiến dịch là bắt buộc.'); return; }
    if (!academicYearId) { setError('Chọn năm học.'); return; }
    try {
      const body: FeeCampaignCreate = {
        name: name.trim(),
        academicYearId,
        semesterId: semesterId || undefined,
        dueDate: dueDate || undefined,
        status,
      };
      if (editing) {
        await financeApi.updateFeeCampaign(editing.id, body);
      } else {
        await financeApi.createFeeCampaign(body);
      }
      setOpen(false); setName(''); setAcademicYearId(''); setSemesterId(''); setDueDate(''); setStatus('draft'); setEditing(null);
      await load();
      showToast(editing ? 'Cập nhật chiến dịch thành công.' : 'Tạo chiến dịch thành công.');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lưu chiến dịch thất bại.');
    }
  };

  const openRules = async (campaign: FeeCampaign) => {
    setSelectedCampaign(campaign);
    setRuleLoading(true);
    setRuleError('');
    try {
      const rs = await financeApi.getCampaignRules(campaign.id);
      setRuleRows(rs.map(r => ({
        feeCategoryId: r.fee_category_id,
        gradeLevelId: r.grade_level_id ?? '',
        classId: r.class_id ?? '',
        amount: String(r.amount),
        dueDate: r.due_date ? String(r.due_date).slice(0, 10) : '',
      })));
      setRuleOpen(true);
    } catch (e: unknown) {
      setRuleError(e instanceof Error ? e.message : 'Không tải quy định phí.');
    } finally {
      setRuleLoading(false);
    }
  };

  const saveRules = async () => {
    if (!selectedCampaign) return;
    const body: CampaignRuleSave[] = ruleRows.map(r => ({
      feeCategoryId: r.feeCategoryId,
      gradeLevelId: r.gradeLevelId || undefined,
      classId: r.classId || undefined,
      amount: Number(r.amount),
      dueDate: r.dueDate || undefined,
    }));
    setRuleLoading(true);
    try {
      await financeApi.saveCampaignRules(selectedCampaign.id, body);
      showToast('Lưu quy định phí thành công.');
    } catch (e: unknown) {
      setRuleError(e instanceof Error ? e.message : 'Lưu quy định phí thất bại.');
    } finally {
      setRuleLoading(false);
    }
  };

  const addRuleRow = () => setRuleRows([...ruleRows, { feeCategoryId: '', gradeLevelId: '', classId: '', amount: '', dueDate: '' }]);
  const removeRuleRow = (i: number) => setRuleRows(ruleRows.filter((_, idx) => idx !== i));

  const handleApply = async () => {
    if (!applyCampaign) return;
    setApplyLoading(true);
    setApplyResult(null);
    try {
      const res = await financeApi.createCampaignAssignments(applyCampaign.id, { studentIds: applyStudents });
      setApplyResult(res);
      showToast(`Đã gói phí cho ${res.createdCount} học sinh (${res.duplicateCount} trùng).`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gói phí thất bại.');
    } finally {
      setApplyLoading(false);
    }
  };

  const statuses = [
    { value: 'draft', label: 'Bản nháp' },
    { value: 'issued', label: 'Đã phát hành' },
    { value: 'closed', label: 'Đã đóng' },
  ];

  return (
    <div>
      <PageHeader
        title="Chiến dịch Học phí"
        subtitle="Tạo đợt thu, thiết lập quy định mức thu theo khối/lớp và áp dụng cho học sinh"
        action={
          canManage && (
            <PrimaryButton onClick={() => { setEditing(null); setName(''); setAcademicYearId(''); setSemesterId(''); setDueDate(''); setStatus('draft'); setOpen(true); }}>
              ＋ Tạo chiến dịch
            </PrimaryButton>
          )
        }
      />

      {toast && <Toast message={toast.message} onClose={closeToast} tone={toast.tone} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Danh sách chiến dịch</h3>
          </div>
          {list.length === 0 ? (
            <Empty text="Chưa có chiến dịch học phí." />
          ) : (
            <TableWrap>
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <Th>Tên chiến dịch</Th>
                    <Th>Năm học</Th>
                    <Th>Hạn nộp</Th>
                    <Th>Trạng thái</Th>
                    <Th>Hành động</Th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <Td className="font-semibold text-slate-900">{c.name}</Td>
                      <Td>{c.academic_year_name ?? '—'}</Td>
                      <Td>{fmtDate(c.due_on)}</Td>
                      <Td>
                        <Badge tone={statusTone(c.status)}>{statusLabel(c.status)}</Badge>
                      </Td>
                      <Td className="flex gap-2">
                        <SecondaryButton size="sm" onClick={() => openRules(c)}>Quy định phí</SecondaryButton>
                        {c.status === STATUS_ISSUED && (
                          <SecondaryButton size="sm" onClick={() => { setApplyCampaign(c); setApplyStudents([]); setApplyResult(null); setApplyOpen(true); }}>Gói phí</SecondaryButton>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 mb-6">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Bắt đầu nhanh</h3>
            <SecondaryButton onClick={() => { setEditing(null); setName(''); setAcademicYearId(''); setSemesterId(''); setDueDate(''); setStatus('draft'); setOpen(true); }}>
              ＋ Tạo mới
            </SecondaryButton>
          </div>
          <p className="text-sm text-slate-500 mb-4">Quản lý các đợt thu học phí theo năm học.</p>
          <ul className="text-sm text-slate-600 space-y-2">
            <li>• Tạo chiến dịch, chọn năm học và ngày hạn nộp.</li>
            <li>• Thiết lập quy định phí cho từng khối/lớp.</li>
            <li>• Phát hành để áp dụng khoản thu cho học sinh.</li>
          </ul>
        </div>
      </div>

      <Modal title={editing ? 'Cập nhật chiến dịch' : 'Tạo chiến dịch học phí'} onClose={() => setOpen(false)} open={open}>
        <form onSubmit={handleSave} className="space-y-4">
          <Field label="Tên chiến dịch" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Năm học">
            <Select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)}>
              <option value="">Chọn năm học</option>
              {(lookups?.academicYears ?? []).map((y) => (
                <option key={y.id} value={y.id}>{y.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Học kỳ (tùy chọn)">
            <Select value={semesterId} onChange={(e) => setSemesterId(e.target.value)}>
              <option value="">Tất cả học kỳ</option>
            </Select>
          </Field>
          <Field label="Ngày hạn nộp">
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
          <Field label="Trạng thái">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              {statuses.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
          </Field>
          <div className="flex justify-end gap-2">
            <SecondaryButton type="button" onClick={() => setOpen(false)}>Hủy</SecondaryButton>
            <PrimaryButton type="submit">{editing ? 'Cập nhật' : 'Tạo'}</PrimaryButton>
          </div>
        </form>
      </Modal>

      <Modal title={`Quy định phí: ${selectedCampaign?.name ?? ''}`} onClose={() => setRuleOpen(false)} open={ruleOpen}>
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Mức phí áp dụng cho mỗi loại phí, khối/lớp và ngày đến hạn.</p>
          <TableWrap>
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr>
                  <Th>Loại phí</Th>
                  <Th>Khối/Lớp</Th>
                  <Th>Số tiền</Th>
                  <Th>Đến hạn</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {ruleRows.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <Td>
                      <Select value={r.feeCategoryId} onChange={(e) => {
                        const nr = [...ruleRows]; nr[i].feeCategoryId = e.target.value; setRuleRows(nr);
                      }}>
                        <option value="">Chọn loại phí</option>
                      </Select>
                    </Td>
                    <Td>
                      <Select value={r.classId} onChange={(e) => {
                        const nr = [...ruleRows]; nr[i].classId = e.target.value || ''; nr[i].gradeLevelId = ''; setRuleRows(nr);
                      }}>
                        <option value="">Chọn lớp</option>
                        {(lookups?.classes ?? []).map((cl) => (
                          <option key={cl.id} value={cl.id}>{cl.code} – {cl.name}</option>
                        ))}
                      </Select>
                    </Td>
                    <Td>
                      <Input type="number" value={r.amount} onChange={(e) => {
                        const nr = [...ruleRows]; nr[i].amount = e.target.value; setRuleRows(nr);
                      }} />
                    </Td>
                    <Td>
                      <Input type="date" value={r.dueDate} onChange={(e) => {
                        const nr = [...ruleRows]; nr[i].dueDate = e.target.value; setRuleRows(nr);
                      }} />
                    </Td>
                    <Td><SecondaryButton size="sm" onClick={() => removeRuleRow(i)}>Xóa</SecondaryButton></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
          <div className="flex justify-end gap-2">
            <SecondaryButton size="sm" onClick={addRuleRow}>Thêm quy định</SecondaryButton>
            <SecondaryButton type="button" onClick={() => setRuleOpen(false)}>Hủy</SecondaryButton>
            <PrimaryButton onClick={saveRules} disabled={ruleLoading}>Lưu quy định</PrimaryButton>
          </div>
          {ruleError && <ErrorBox message={ruleError} />}
        </div>
      </Modal>

      <Modal title={`Gói phí: ${applyCampaign?.name ?? ''}`} onClose={() => setApplyOpen(false)} open={applyOpen}>
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Chọn học sinh sẽ được áp dụng khoản thu của chiến dịch này.</p>
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1 min-w-[260px]">
              <Field label="Chọn học sinh" required>
                <Select multiple value={applyStudents} onChange={(e) => {
                  setApplyStudents(Array.from(e.target.selectedOptions, (o) => o.value));
                }}>
                  <option value="" disabled>Chọn học sinh từ danh sách</option>
                </Select>
                <p className="text-xs text-slate-400 mt-1">Chọn một hoặc nhiều học sinh để áp dụng quy định phí.</p>
              </Field>
            </div>
            <div className="flex gap-2">
              <SecondaryButton onClick={() => setApplyOpen(false)}>Hủy</SecondaryButton>
              <PrimaryButton onClick={handleApply} disabled={applyLoading || applyStudents.length === 0}>
                Gói phí
              </PrimaryButton>
            </div>
          </div>
          {applyResult && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <p className="text-sm text-emerald-800">Đã tạo {applyResult.createdCount} khoản thu, {applyResult.duplicateCount} bị trùng bỏ qua.</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
