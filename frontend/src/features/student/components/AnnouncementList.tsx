import React from 'react';
import { Megaphone, Building2 } from 'lucide-react';
import { AnnouncementItem } from '../types/student.types';

interface AnnouncementListProps {
  announcements: AnnouncementItem[];
  onViewAll?: () => void;
  onSelect?: (item: AnnouncementItem) => void;
}

// Format relative time in Vietnamese (e.g., "2 giờ trước", "1 ngày trước")
const formatRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return 'Vừa xong';
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN');
};

export const AnnouncementList: React.FC<AnnouncementListProps> = ({
  announcements,
  onViewAll,
  onSelect
}) => {
  const displayItems = announcements.length > 0 ? announcements.slice(0, 3) : [
    {
      id: '1',
      title: 'Lịch kiểm tra giữa kỳ I đã được cập nhật',
      category: 'Phòng Giáo vụ',
      publishedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      isRead: false
    },
    {
      id: '2',
      title: 'Kế hoạch hoạt động ngoại khóa tháng 1',
      category: 'Đoàn trường',
      publishedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
      isRead: false
    },
    {
      id: '3',
      title: 'Hướng dẫn nộp học phí học kỳ II',
      category: 'Phòng Kế toán',
      publishedAt: new Date(Date.now() - 48 * 3600000).toISOString(),
      isRead: true
    }
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-slate-900 text-base sm:text-lg">
              Thông báo mới nhất
            </h2>
          </div>

          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
            >
              Xem tất cả
            </button>
          )}
        </div>

        {/* Announcement List */}
        <div className="space-y-4 my-auto">
          {displayItems.map((item, idx) => {
            const isUnread = !item.isRead;
            return (
              <div
                key={item.id || idx}
                onClick={() => onSelect && onSelect(item as AnnouncementItem)}
                className="flex items-start gap-3.5 cursor-pointer group"
              >
                {/* Dot Indicator: Blue if unread, Gray if read */}
                <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                  isUnread ? 'bg-blue-600 ring-2 ring-blue-100' : 'bg-slate-300'
                }`} />

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-semibold mt-1">
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-slate-600">{item.category || 'Nhà trường'}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(item.publishedAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
