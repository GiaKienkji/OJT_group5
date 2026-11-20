import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  facilityApi, Inventory, Asset, Room,
} from '../../../services/tv4Api';
import {
  PageHeader, Card, TableWrap, Th, Td, Badge, Modal,
  PrimaryButton, SecondaryButton, Input, Select, Field,
  statusTone, statusLabel, Loading, ErrorBox, Empty, Toast,
} from '../../shared/ui';

interface ObsRow {
  assetId: string;
  assetCode: string;
  assetName: string;
  originalRoomName?: string;
  observedRoomId?: string;
  condition: string;
  status: string;
  present: boolean;
}

export const InventoryPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('assets.manage');

  const [list, setList] = useState<Inventory[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  // Modal Create Inventory
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [obsRows, setObsRows] = useState<ObsRow[]>([]);

  // Modal Detail
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedInv, setSelectedInv] = useState<Inventory | null>(null);

  const showToast = (message: string, tone: 'success' | 'error' = 'success') => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 4000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [invRes, asts, rms] = await Promise.all([
        facilityApi.getInventory(),
        facilityApi.getAssets(),
        facilityApi.getRooms(),
      ]);
      setList(invRes.sessions || []);
      setAssets(asts);
      setRooms(rms);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Không thể tải danh sách kiểm kê.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreateModal = () => {
    setTitle(`Đợt kiểm kê tài sản ngày ${new Date().toLocaleDateString('vi-VN')}`);
    setObsRows(
      assets.map((a) => ({
        assetId: a.id,
        assetCode: a.code,
        assetName: a.name,
        originalRoomName: a.roomName || 'Chưa xếp phòng',
        observedRoomId: a.roomId || '',
        condition: a.condition || 'Tốt',
        status: a.status || 'working',
        present: true,
      })),
    );
    setCreateOpen(true);
  };

  const updateObs = (idx: number, patch: Partial<ObsRow>) => {
    setObsRows((prev) => {
      const clone = [...prev];
      clone[idx] = { ...clone[idx], ...patch };
      return clone;
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Vui lòng nhập tên đợt kiểm kê.');
      return;
    }
    try {
      await facilityApi.createInventory({
        title: title.trim(),
        observations: obsRows.map((o) => ({
          assetId: o.assetId,
          observedRoomId: o.observedRoomId || undefined,
          condition: o.condition.trim() || 'Tốt',
          status: o.status,
          present: o.present,
        })),
      });
      setCreateOpen(false);
      setTitle('');
      await load();
      showToast('Đã lưu kết quả kiểm kê tài sản thành công.');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lưu kết quả kiểm kê thất bại.');
    }
  };

  const viewDetail = async (id: string) => {
    try {
      const detail = await facilityApi.getInventoryDetail(id);
      setSelectedInv(detail);
      setDetailOpen(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Không tải được chi tiết kiểm kê.');
    }
  };

  if (loading) return <Loading text="Đang tải dữ liệu kiểm kê tài sản…" />;
  if (error) return <ErrorBox message={error} onRetry={load} />;

  return (
    <div>
      <PageHeader
        title="Kiểm kê Tài sản Định kỳ"
        subtitle="Đối chiếu số lượng thực tế, tình trạng tài sản và phát hiện bất thường (FAC-09)"
        action={
          canManage && (
            <PrimaryButton onClick={openCreateModal}>＋ Tạo đợt kiểm kê mới</PrimaryButton>
          )
        }
      />

      {toast && <Toast message={toast.message} onClose={() => setToast(null)} tone={toast.tone} />}

      <Card>
        {list.length === 0 ? (
          <Empty text="Chưa có đợt kiểm kê nào được thực hiện." />
        ) : (
          <TableWrap>
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr>
                  <Th>Mã phiên</Th>
                  <Th>Tên đợt kiểm kê</Th>
                  <Th>Số lượng quan sát</Th>
                  <Th>Thao tác</Th>
                </tr>
              </thead>
              <tbody>
                {list.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <Td className="font-semibold text-slate-900">{inv.id.slice(0, 8)}...</Td>
                    <Td className="font-medium text-slate-900">{inv.title}</Td>
                    <Td>{inv.observations?.length ?? 0} tài sản</Td>
                    <Td>
                      <SecondaryButton size="sm" onClick={() => viewDetail(inv.id)}>
                        Xem chi tiết
                      </SecondaryButton>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Card>

      {/* Modal Tạo phiên kiểm kê */}
      <Modal title="Tạo phiên kiểm kê thực tế" onClose={() => setCreateOpen(false)} open={createOpen}>
        <form onSubmit={handleCreate} className="space-y-4 max-h-[80vh] flex flex-col">
          <Field label="Tiêu đề phiên kiểm kê" required>
            <Input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <Th>Có mặt</Th>
                  <Th>Mã - Tên thiết bị</Th>
                  <Th>Phòng ghi nhận</Th>
                  <Th>Tình trạng</Th>
                  <Th>Trạng thái</Th>
                </tr>
              </thead>
              <tbody>
                {obsRows.map((o, idx) => (
                  <tr key={o.assetId} className="hover:bg-slate-50 border-t border-slate-100">
                    <Td>
                      <input
                        type="checkbox"
                        checked={o.present}
                        onChange={(e) => updateObs(idx, { present: e.target.checked })}
                        className="rounded text-[#0B4F8A] focus:ring-[#0B4F8A]"
                      />
                    </Td>
                    <Td>
                      <div className="font-medium text-slate-900">{o.assetCode}</div>
                      <div className="text-slate-500">{o.assetName}</div>
                    </Td>
                    <Td>
                      <Select
                        value={o.observedRoomId}
                        onChange={(e) => updateObs(idx, { observedRoomId: e.target.value })}
                        className="text-xs py-1"
                      >
                        <option value="">-- Chưa gán phòng --</option>
                        {rooms.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.code} ({r.name || 'Phòng'})
                          </option>
                        ))}
                      </Select>
                    </Td>
                    <Td>
                      <Input
                        value={o.condition}
                        onChange={(e) => updateObs(idx, { condition: e.target.value })}
                        className="text-xs py-1"
                      />
                    </Td>
                    <Td>
                      <Select
                        value={o.status}
                        onChange={(e) => updateObs(idx, { status: e.target.value })}
                        className="text-xs py-1"
                      >
                        <option value="working">Hoạt động</option>
                        <option value="damaged">Hỏng</option>
                        <option value="maintenance">Bảo trì</option>
                        <option value="lost">Mất</option>
                      </Select>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <SecondaryButton type="button" onClick={() => setCreateOpen(false)}>
              Hủy
            </SecondaryButton>
            <PrimaryButton type="submit">Lưu đợt kiểm kê</PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* Modal Xem chi tiết */}
      <Modal title="Chi tiết đợt kiểm kê" onClose={() => setDetailOpen(false)} open={detailOpen}>
        <div className="space-y-4 max-h-[80vh] flex flex-col">
          <div className="font-bold text-slate-900 text-base">{selectedInv?.title}</div>
          <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <Th>Mã tài sản</Th>
                  <Th>Hiện diện</Th>
                  <Th>Phòng kiểm tra</Th>
                  <Th>Tình trạng</Th>
                  <Th>Trạng thái</Th>
                </tr>
              </thead>
              <tbody>
                {selectedInv?.observations?.map((o) => (
                  <tr key={o.assetId} className="hover:bg-slate-50 border-t border-slate-100">
                    <Td className="font-semibold text-slate-900">{o.assetId.slice(0, 8)}...</Td>
                    <Td>
                      <Badge tone={o.present ? 'green' : 'red'}>
                        {o.present ? 'Có mặt' : 'Vắng mặt / Thất lạc'}
                      </Badge>
                    </Td>
                    <Td>{o.observedRoomId ? o.observedRoomId.slice(0, 8) + '...' : '—'}</Td>
                    <Td>{o.condition || '—'}</Td>
                    <Td>
                      <Badge tone={statusTone(o.status)}>{statusLabel(o.status)}</Badge>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end pt-2">
            <SecondaryButton onClick={() => setDetailOpen(false)}>Đóng</SecondaryButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};
