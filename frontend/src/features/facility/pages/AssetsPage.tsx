import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { facilityApi, Asset } from '../../../services/tv4Api';
import {
  PageHeader, Card, TableWrap, Th, Td, Badge, Modal,
  PrimaryButton, SecondaryButton, Input, Select, Field,
  statusTone, statusLabel, Loading, ErrorBox, Empty,
} from '../../shared/ui';

export const AssetsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('assets.manage');
  const [list, setList] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [serial, setSerial] = useState('');
  const [roomId, setRoomId] = useState('');
  const [status, setStatus] = useState('working');
  const [condition, setCondition] = useState('');

  const load = async () => {
    setLoading(true);
    try { setList(await facilityApi.getAssets()); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Không tải tài sản'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (!canManage) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-10 text-center text-slate-500">
        Bạn không có quyền quản lý tài sản.
      </div>
    );
  }

  if (loading) return <Loading text="Đang tải tài sản…" />;
  if (error) return <ErrorBox message={error} onRetry={load} />;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await facilityApi.updateAsset(editing.id, { code, name, category, serialNumber: serial || undefined, roomId: roomId || undefined, status, condition: condition || undefined });
      } else {
        await facilityApi.createAsset({ code, name, category, serialNumber: serial || undefined, roomId: roomId || undefined, status, condition: condition || undefined });
      }
      setOpen(false); setCode(''); setName(''); setCategory(''); setSerial(''); setRoomId(''); setStatus('working'); setCondition(''); setEditing(null);
      await load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Lưu tài sản thất bại.'); }
  };

  const reset = () => { setEditing(null); setCode(''); setName(''); setCategory(''); setSerial(''); setRoomId(''); setStatus('working'); setCondition(''); setOpen(true); };
  const startEdit = (a: Asset) => { setEditing(a); setCode(a.code); setName(a.name); setCategory(a.category); setSerial(a.serialNumber || ''); setRoomId(a.roomId || ''); setStatus(a.status); setCondition(a.condition || ''); setOpen(true); };

  const statuses = ['working', 'damaged', 'maintenance', 'retired', 'lost'] as const;

  return (
    <div>
      <PageHeader
        title="Danh mục Tài sản"
        subtitle="Quản lý mã, tình trạng và phòng phân bổ cho từng thiết bị"
        action={canManage && <PrimaryButton onClick={reset}>＋ Thêm tài sản</PrimaryButton>}
      />
      <Card>
        {list.length === 0 ? <Empty text="Chưa có tài sản nào." /> : (
          <TableWrap>
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr><Th>Mã tài sản</Th><Th>Tên</Th><Th>Loại</Th><Th>Serial</Th><Th>Phòng</Th><Th>Trạng thái</Th><Th>Tình trạng</Th><Th>Hành động</Th></tr>
              </thead>
              <tbody>
                {list.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <Td className="font-semibold text-slate-900">{a.code}</Td>
                    <Td>{a.name}</Td>
                    <Td>{a.category}</Td>
                    <Td className="text-xs text-slate-500">{a.serialNumber}</Td>
                    <Td className="text-xs text-slate-500">{a.roomName}</Td>
                    <Td><Badge tone={statusTone(a.status)}>{statusLabel(a.status)}</Badge></Td>
                    <Td>{a.condition || '—'}</Td>
                    <Td><SecondaryButton size="sm" onClick={() => startEdit(a)}>Sửa</SecondaryButton></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Card>

      <Modal title={editing ? 'Sửa tài sản' : 'Thêm tài sản'} onClose={() => setOpen(false)} open={open}>
        <form onSubmit={handleSave} className="space-y-3">
          <Field label="Mã tài sản" required><Input required value={code} onChange={(e) => setCode(e.target.value)} /></Field>
          <Field label="Tên tài sản" required><Input required value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Loại tài sản" required><Input required value={category} onChange={(e) => setCategory(e.target.value)} /></Field>
          <Field label="Số렬"><Input value={serial} onChange={(e) => setSerial(e.target.value)} /></Field>
          <Field label="Phòng"><Input placeholder="ID phòng" value={roomId} onChange={(e) => setRoomId(e.target.value)} /></Field>
          <Field label="Trạng thái"><Select value={status} onChange={(e) => setStatus(e.target.value as string)}>{statuses.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}</Select></Field>
          <Field label="Tình trạng"><Input value={condition} onChange={(e) => setCondition(e.target.value)} /></Field>
          <div className="flex justify-end gap-2">
            <SecondaryButton onClick={() => setOpen(false)}>Hủy</SecondaryButton>
            <PrimaryButton type="submit">{editing ? 'Cập nhật' : 'Thêm'}</PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
};
