import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { financeApi, FeeCategory } from '../../../services/tv4Api';
import {
  PageHeader, Card, TableWrap, Th, Td, Badge, Modal,
  PrimaryButton, SecondaryButton, Input, Field,
  statusTone, Loading, ErrorBox, Empty,
} from '../../shared/ui';

export const FeeCategoriesPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [list, setList] = useState<FeeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FeeCategory | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [active, setActive] = useState(true);

  const canManage = hasPermission('fee_categories.manage');

  const load = async () => {
    setLoading(true);
    try {
      setList(await financeApi.getFeeCategories());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Không tải danh mục');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Loading text="Đang tải danh mục học phí…" />;
  if (error) return <ErrorBox message={error} onRetry={load} />;

  const toggleActive = async (cat: FeeCategory) => {
    if (!canManage) return;
    try {
      await financeApi.updateFeeCategory(cat.id, { code: cat.code, name: cat.name, is_active: !cat.is_active });
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Không cập nhật trạng thái');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await financeApi.updateFeeCategory(editing.id, { code, name, is_active: active });
      } else {
        await financeApi.createFeeCategory({ code, name, is_active: active });
      }
      setOpen(false); setCode(''); setName(''); setActive(true); setEditing(null);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Không lưu danh mục');
    }
  };

  return (
    <div>
      <PageHeader
        title="Danh mục Khoản thu"
        subtitle="Quản lý mã và tên các khoản học phí"
        action={canManage ? (
          <PrimaryButton onClick={() => { setEditing(null); setCode(''); setName(''); setActive(true); setOpen(true); }}>
            ＋ Thêm danh mục
          </PrimaryButton>
        ) : null}
      />

      <Card>
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Danh sách Khoản thu</h3>
        </div>
        {list.length === 0 ? (
          <Empty text="Chưa có danh mục khoản thu" />
        ) : (
          <TableWrap>
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr><Th>Mã</Th><Th>Tên</Th><Th>Trạng thái</Th><Th>Hành động</Th></tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <Td className="font-semibold text-slate-900">{c.code}</Td>
                    <Td>{c.name}</Td>
                    <Td>
                      <Badge tone={statusTone(c.is_active ? 'active' : 'closed')}>
                        {c.is_active ? 'Hoạt động' : 'Khóa'}
                      </Badge>
                    </Td>
                    <Td>
                      {canManage && (
                        <button
                          onClick={() => toggleActive(c)}
                          className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${c.is_active ? 'text-emerald-700 hover:bg-emerald-50' : 'text-red-600 hover:bg-red-50'}`}
                        >
                          {c.is_active ? 'Khóa' : 'Kích hoạt'}
                        </button>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Card>

      <Modal title={editing ? 'Sửa danh mục' : 'Thêm danh mục'} onClose={() => setOpen(false)} open={open}>
        <form onSubmit={handleSave} className="space-y-3">
          <Field label="Mã khoản" required>
            <Input required value={code} onChange={(e) => setCode(e.target.value)} />
          </Field>
          <Field label="Tên khoản" required>
            <Input required value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Kích hoạt">
            <select value={active ? '1' : '0'} onChange={(e) => setActive(e.target.value === '1')} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B4F8A]/30">
              <option value="1">Có</option>
              <option value="0">Không</option>
            </select>
          </Field>
        </form>
        <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2">
          <SecondaryButton onClick={() => setOpen(false)}>Hủy</SecondaryButton>
          <PrimaryButton type="submit" disabled={!canManage}>
            <span role="img" aria-label="Lưu">💾</span> Lưu
          </PrimaryButton>
        </div>
      </Modal>
    </div>
  );
};
