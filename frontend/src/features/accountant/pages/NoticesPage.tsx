import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { financeApi, FeeCampaign, Notice } from '../../../services/tv4Api';
import {
  PageHeader, Card, TableWrap, Th, Td, Badge, Modal,
  PrimaryButton, SecondaryButton, Input, Field, Textarea, Select,
  fmtDateTime, Loading, ErrorBox, Empty, Toast,
} from '../../shared/ui';

export const NoticesPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('finance.manage');
  const [campaigns, setCampaigns] = useState<FeeCampaign[]>([]);
  const [campaignId, setCampaignId] = useState('');
  const [list, setList] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, tone: 'success' | 'error' = 'success') => {
    setToast({ message: msg, tone });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    (async () => {
      try {
        const cs = await financeApi.getFeeCampaigns();
        setCampaigns(cs);
        if (cs.length > 0 && !campaignId) setCampaignId(cs[0].id);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Không tải chiến dịch');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadNotices = async (id: string) => {
    if (!id) { setList([]); return; }
    try { setList(await financeApi.getNotices(id)); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Không tải thông báo'); }
  };

  useEffect(() => { loadNotices(campaignId); }, [campaignId]);

  if (!canManage) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-10 text-center text-slate-500">
        Bạn không có quyền quản lý thông báo.
      </div>
    );
  }

  if (loading) return <Loading text="Đang tải thông báo…" />;
  if (error) return <ErrorBox message={error} />;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignId) { setError('Chọn chiến dịch trước.'); return; }
    try {
      await financeApi.createNotice(campaignId, { title: title.trim(), message: message.trim() });
      setOpen(false); setTitle(''); setMessage('');
      await loadNotices(campaignId);
      showToast('Đã tạo thông báo.');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Tạo thông báo thất bại.');
    }
  };

  const handleSend = async (n: Notice) => {
    try {
      const res = await financeApi.sendNotice(n.id);
      await loadNotices(campaignId);
      showToast(`Đã gửi tới ${res.recipientCount} phụ huynh.`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gửi thông báo thất bại.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Thông báo Học phí"
        subtitle="Soạn và gửi thông báo thu phí tới phụ huynh theo chiến dịch"
        action={
          canManage && (
            <PrimaryButton onClick={() => { setTitle(''); setMessage(''); setOpen(true); }}>
              ＋ Soạn thông báo
            </PrimaryButton>
          )
        }
      />

      {toast && <Toast message={toast.message} onClose={() => setToast(null)} tone={toast.tone} />}

      <Card>
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Chiến dịch</h3>
          <Select value={campaignId} onChange={(e) => setCampaignId(e.target.value)} className="w-72">
            <option value="">Chọn chiến dịch</option>
            {campaigns.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </Select>
        </div>
        {list.length === 0 ? (
          <Empty text="Chưa có thông báo cho chiến dịch này." />
        ) : (
          <TableWrap>
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr><Th>Tiêu đề</Th><Th>Nội dung</Th><Th>Ngày tạo</Th><Th>Trạng thái</Th><Th>Hành động</Th></tr>
              </thead>
              <tbody>
                {list.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-50">
                    <Td className="font-semibold text-slate-900">{n.title}</Td>
                    <Td className="max-w-md truncate">{n.message}</Td>
                    <Td>{fmtDateTime(n.created_at)}</Td>
                    <Td><Badge tone={n.sent_at ? 'green' : 'amber'}>{n.sent_at ? 'Đã gửi' : 'Nháp'}</Badge></Td>
                    <Td>
                      {!n.sent_at && canManage && (
                        <SecondaryButton size="sm" onClick={() => handleSend(n)}><span role="img" aria-label="Gửi">📤</span> Gửi</SecondaryButton>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Card>

      <Modal title="Soạn thông báo" onClose={() => setOpen(false)} open={open}>
        <form onSubmit={handleCreate} className="space-y-4">
          <Field label="Tiêu đề" required>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Field>
          <Field label="Nội dung" required>
            <Textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} required />
          </Field>
          <div className="flex justify-end gap-2">
            <SecondaryButton type="button" onClick={() => setOpen(false)}>Hủy</SecondaryButton>
            <PrimaryButton type="submit">Tạo thông báo</PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
};
