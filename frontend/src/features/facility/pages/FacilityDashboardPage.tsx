import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { facilityApi, FacilityStats } from '../../../services/tv4Api';
import { Stat, Card, CardHeader, Th, Td, Loading, ErrorBox, Empty } from '../../shared/ui';
import { TrendingUp, Wrench, FileText, Clock } from 'lucide-react';

export const FacilityDashboardPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canView = hasPermission('rooms.manage');
  const [stats, setStats] = useState<FacilityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try { setStats(await facilityApi.getStats()); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Không tải bảng điều khiển'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (!canView) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-10 text-center text-slate-500">
        Bạn không có quyền xem bảng điều khiển CSVC.
      </div>
    );
  }

  if (loading) return <Loading text="Đang tải bảng điều khiển CSVC…" />;
  if (error) return <ErrorBox message={error} onRetry={load} />;
  if (!stats) return <Empty />;

  const s = stats.summary;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Phòng học" value={String(s.room_count)} icon={<FileText className="w-5 h-5" />} />
        <Stat label="Tài sản" value={String(s.asset_count)} icon={<TrendingUp className="w-5 h-5" />} />
        <Stat label="Tài sản cần sửa chữa" value={String(s.assets_needing_repair)} icon={<Wrench className="w-5 h-5" />} tone="text-red-600" />
        <Stat label="Bảo trì đến hạn" value={String(s.maintenance_due_count)} icon={<Clock className="w-5 h-5" />} tone="text-amber-600" />
      </div>

      <Card>
        <CardHeader title="Sự cố theo mức độ &amp; trạng thái" />
        {stats.incidents.length === 0 ? (
          <Empty text="Chưa có sự cố nào được ghi nhận." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr><Th>Mức độ</Th><Th>Trạng thái</Th><Th>Số lượng</Th></tr>
              </thead>
              <tbody>
                {stats.incidents.map((i) => (
                  <tr key={`${i.severity}-${i.status}`} className="hover:bg-slate-50">
                    <Td>{i.severity}</Td>
                    <Td>{i.status}</Td>
                    <Td className="font-semibold text-slate-900">{i.count}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
