import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { facilityApi, Room } from '../../../services/tv4Api';
import {
  PageHeader, Card, TableWrap, Th, Td, Badge, Modal,
  PrimaryButton, SecondaryButton, Input, Select, Field,
  statusTone, statusLabel, Loading, ErrorBox, Empty,
} from '../../shared/ui';

export const RoomsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('rooms.manage');
  const [list, setList] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [roomType, setRoomType] = useState('classroom');
  const [capacity, setCapacity] = useState('');
  const [status, setStatus] = useState('available');

  const load = async () => {
    setLoading(true);
    try { setList(await facilityApi.getRooms()); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Không tải phòng học'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (!canManage) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-10 text-center text-slate-500">
        Bạn không có quyền quản lý phòng học.
      </div>
    );
  }

  if (loading) return <Loading text="Đang tải phòng học…" />;
  if (error) return <ErrorBox message={error} onRetry={load} />;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await facilityApi.updateRoom(editing.id, { code, name: name || undefined, roomType, capacity: Number(capacity), status });
      } else {
        await facilityApi.createRoom({ code, name: name || undefined, roomType, capacity: Number(capacity), status });
      }
      setOpen(false); setCode(''); setName(''); setRoomType('classroom'); setCapacity(''); setStatus('available'); setEditing(null);
      await load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Lưu phòng học thất bại.'); }
  };

  const reset = () => { setEditing(null); setCode(''); setName(''); setRoomType('classroom'); setCapacity(''); setStatus('available'); setOpen(true); };
  const startEdit = (r: Room) => { setEditing(r); setCode(r.code); setName(r.name || ''); setRoomType(r.room_type); setCapacity(String(r.capacity)); setStatus(r.status); setOpen(true); };

  return (
    <div>
      <PageHeader
        title="Quản lý Phòng học"
        subtitle="Tạo, cập nhật và theo dõi trạng thái các phòng học"
        action={canManage && <PrimaryButton onClick={reset}>＋ Thêm phòng</PrimaryButton>}
      />
      <Card>
        {list.length === 0 ? <Empty text="Chưa có phòng học nào." /> : (
          <TableWrap>
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr><Th>Mã phòng</Th><Th>Tên</Th><Th>Loại</Th><Th>Sức chứa</Th><Th>Trạng thái</Th><Th>Hành động</Th></tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <Td className="font-semibold text-slate-900">{r.code}</Td>
                    <Td>{r.name}</Td>
                    <Td>{r.room_type}</Td>
                    <Td>{r.capacity}</Td>
                    <Td><Badge tone={statusTone(r.status)}>{statusLabel(r.status)}</Badge></Td>
                    <Td><SecondaryButton size="sm" onClick={() => startEdit(r)}>Sửa</SecondaryButton></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Card>

      <Modal title={editing ? 'Sửa phòng' : 'Thêm phòng'} onClose={() => setOpen(false)} open={open}>
        <form onSubmit={handleSave} className="space-y-3">
          <Field label="Mã phòng" required><Input required value={code} onChange={(e) => setCode(e.target.value)} /></Field>
          <Field label="Tên phòng"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Loại phòng">
            <Select value={roomType} onChange={(e) => setRoomType(e.target.value)}>
              <option value="classroom">Lớp học</option>
              <option value="office">Phòng hành chính</option>
              <option value="laboratory">Phòng thí nghiệm</option>
              <option value="library">Thư viện</option>
            </Select>
          </Field>
          <Field label="Sức chứa" required><Input type="number" required value={capacity} onChange={(e) => setCapacity(e.target.value)} /></Field>
          <Field label="Trạng thái">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="available">Hoạt động</option>
              <option value="maintenance">Bảo trì</option>
              <option value="closed">Đóng</option>
            </Select>
          </Field>
          <div className="flex justify-end gap-2">
            <SecondaryButton onClick={() => setOpen(false)}>Hủy</SecondaryButton>
            <PrimaryButton type="submit">{editing ? 'Cập nhật' : 'Thêm'}</PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
};