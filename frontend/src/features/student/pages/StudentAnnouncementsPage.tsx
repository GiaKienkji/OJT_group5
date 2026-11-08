import React, { useState, useEffect, useMemo } from 'react';
import {
  Megaphone,
  Star,
  BookOpen,
  Calendar,
  Flag,
  Users,
  MoreHorizontal,
  Search,
  Filter,
  Eye,
  Share2,
  Paperclip,
  Download,
  CheckCircle2,
  Info,
  User,
  ChevronLeft,
  ChevronRight,
  FileText,
  Coins,
  Trophy,
  Check,
  X
} from 'lucide-react';
import { AnnouncementItem } from '../types/student.types';
import { useStudentAnnouncements } from '../context/StudentAnnouncementsContext';

// Category icon & color mapping
const CATEGORY_STYLES: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    bgClass: string;
    textClass: string;
    borderClass: string;
  }
> = {
  exam: {
    icon: Calendar,
    bgClass: 'bg-blue-50 text-blue-600',
    textClass: 'text-blue-600',
    borderClass: 'border-blue-100'
  },
  activity: {
    icon: Megaphone,
    bgClass: 'bg-rose-50 text-rose-500',
    textClass: 'text-rose-500',
    borderClass: 'border-rose-100'
  },
  important: {
    icon: Coins,
    bgClass: 'bg-sky-50 text-sky-600',
    textClass: 'text-sky-600',
    borderClass: 'border-sky-100'
  },
  study: {
    icon: BookOpen,
    bgClass: 'bg-blue-50 text-blue-600',
    textClass: 'text-blue-600',
    borderClass: 'border-blue-100'
  },
  union: {
    icon: Users,
    bgClass: 'bg-indigo-50 text-indigo-600',
    textClass: 'text-indigo-600',
    borderClass: 'border-indigo-100'
  },
  award: {
    icon: Trophy,
    bgClass: 'bg-amber-50 text-amber-600',
    textClass: 'text-amber-600',
    borderClass: 'border-amber-100'
  },
  all: {
    icon: FileText,
    bgClass: 'bg-slate-50 text-slate-600',
    textClass: 'text-slate-600',
    borderClass: 'border-slate-100'
  }
};

export const StudentAnnouncementsPage: React.FC = () => {
  const {
    announcements,
    unreadCount: unreadTotalCount,
    markAsRead,
    markAllAsRead,
    toggleBookmark
  } = useStudentAnnouncements();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'unread' | 'read' | 'bookmarked'>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);

  // Selected item: when null => Full width list mode; when set => Collapsed split mode!
  const [selectedItem, setSelectedItem] = useState<AnnouncementItem | null>(null);

  // Pagination state (5 items per page to match mockup)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  // Filtered list based on category, search and filter mode
  const filteredList = useMemo(() => {
    return announcements.filter((item) => {
      // Category filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'important' && !item.isImportant) return false;
        if (selectedCategory === 'study' && item.category !== 'study') return false;
        if (selectedCategory === 'exam' && item.category !== 'exam') return false;
        if (selectedCategory === 'activity' && item.category !== 'activity') return false;
        if (selectedCategory === 'union' && item.category !== 'union') return false;
        if (selectedCategory === 'other' && item.category !== 'other') return false;
      }

      // Filter mode (unread, read, bookmarked)
      if (filterMode === 'unread' && item.isRead) return false;
      if (filterMode === 'read' && !item.isRead) return false;
      if (filterMode === 'bookmarked' && !item.isBookmarked) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchAuthor = item.authorName.toLowerCase().includes(query);
        const matchBody = item.body.toLowerCase().includes(query);
        return matchTitle || matchAuthor || matchBody;
      }

      return true;
    });
  }, [announcements, selectedCategory, filterMode, searchQuery]);

  // Paginated items for current page
  const totalPages = Math.max(1, Math.ceil(filteredList.length / itemsPerPage));
  const currentPaginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredList.slice(start, start + itemsPerPage);
  }, [filteredList, currentPage]);

  // Auto-reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, filterMode, searchQuery]);

  // Click handler: Collapse list and select item, mark as read
  const handleSelectItem = (item: AnnouncementItem) => {
    setSelectedItem({ ...item, isRead: true });

    // Mark as read immediately across context & backend
    if (!item.isRead) {
      markAsRead(item.id);
    }
  };

  // Toggle bookmark
  const handleToggleBookmark = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    toggleBookmark(id);
    if (selectedItem?.id === id) {
      setSelectedItem((prev) => (prev ? { ...prev, isBookmarked: !prev.isBookmarked } : null));
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    return {
      all: announcements.length,
      important: announcements.filter((a) => a.isImportant).length,
      study: announcements.filter((a) => a.category === 'study').length,
      exam: announcements.filter((a) => a.category === 'exam').length,
      activity: announcements.filter((a) => a.category === 'activity').length,
      union: announcements.filter((a) => a.category === 'union').length,
      other: announcements.filter((a) => a.category === 'other').length
    };
  }, [announcements]);

  return (
    <div className="space-y-5 pb-12">
      {/* 1. Header Banner matching mockup media_1794152658168_f4cfc07c.jpg */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 shadow-sm p-6 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4 relative z-10 max-w-2xl">
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <Megaphone className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Thông báo nhà trường
            </h1>
            <p className="text-sm text-slate-500 font-normal mt-1">
              Cập nhật các thông tin quan trọng, kế hoạch, lịch thi và hoạt động dành cho học sinh.
            </p>
          </div>
        </div>

        {/* Right side Illustration decorative composition */}
        <div className="hidden lg:flex items-center gap-3 relative z-10 opacity-95">
          <div className="relative w-48 h-20 flex items-end justify-center">
            <div className="relative bg-gradient-to-tr from-blue-500 to-sky-400 rounded-xl w-28 h-20 shadow-md p-2 text-white flex flex-col justify-between">
              <div className="flex justify-between items-center border-b border-white/20 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Thông báo</span>
                <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
              </div>
              <div className="grid grid-cols-4 gap-1 text-[8px] text-center font-mono opacity-80">
                <span>08</span>
                <span>07</span>
                <span className="bg-white text-blue-600 rounded font-bold">06</span>
                <span>04</span>
              </div>
              <div className="text-[9px] font-semibold text-sky-100 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-300" /> Bản tin mới
              </div>
            </div>
            <div className="absolute -left-6 bottom-0 w-16 h-8 bg-amber-400 rounded-lg shadow-sm transform -rotate-6 border border-amber-500/20"></div>
            <div className="absolute -left-4 bottom-3 w-16 h-6 bg-rose-400 rounded-lg shadow-sm transform rotate-3 border border-rose-500/20"></div>
          </div>
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-50/60 to-transparent pointer-events-none" />
      </div>

      {/* 2. Category Filter Tabs Row (Matching exactly the 7 tabs in mockup) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
        {/* Tất cả */}
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5">
            <span className="w-1.5 h-1.5 rounded-xs bg-current"></span>
            <span className="w-1.5 h-1.5 rounded-xs bg-current"></span>
            <span className="w-1.5 h-1.5 rounded-xs bg-current"></span>
            <span className="w-1.5 h-1.5 rounded-xs bg-current"></span>
          </div>
          <span>Tất cả ({categoryCounts.all})</span>
        </button>

        {/* Quan trọng */}
        <button
          type="button"
          onClick={() => setSelectedCategory('important')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            selectedCategory === 'important'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${selectedCategory === 'important' ? 'text-white' : 'text-rose-500'}`} />
          <span>Quan trọng ({categoryCounts.important})</span>
        </button>

        {/* Học tập */}
        <button
          type="button"
          onClick={() => setSelectedCategory('study')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            selectedCategory === 'study'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <BookOpen className={`w-3.5 h-3.5 ${selectedCategory === 'study' ? 'text-white' : 'text-blue-500'}`} />
          <span>Học tập ({categoryCounts.study})</span>
        </button>

        {/* Kiểm tra - Thi */}
        <button
          type="button"
          onClick={() => setSelectedCategory('exam')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            selectedCategory === 'exam'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <Calendar className={`w-3.5 h-3.5 ${selectedCategory === 'exam' ? 'text-white' : 'text-blue-500'}`} />
          <span>Kiểm tra – Thi ({categoryCounts.exam})</span>
        </button>

        {/* Hoạt động */}
        <button
          type="button"
          onClick={() => setSelectedCategory('activity')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            selectedCategory === 'activity'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <Flag className={`w-3.5 h-3.5 ${selectedCategory === 'activity' ? 'text-white' : 'text-teal-500'}`} />
          <span>Hoạt động ({categoryCounts.activity})</span>
        </button>

        {/* Đoàn - Đội */}
        <button
          type="button"
          onClick={() => setSelectedCategory('union')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            selectedCategory === 'union'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <Users className={`w-3.5 h-3.5 ${selectedCategory === 'union' ? 'text-white' : 'text-indigo-500'}`} />
          <span>Đoàn – Đội ({categoryCounts.union})</span>
        </button>

        {/* Khác */}
        <button
          type="button"
          onClick={() => setSelectedCategory('other')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            selectedCategory === 'other'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
          <span>Khác ({categoryCounts.other})</span>
        </button>
      </div>

      {/* 3. Main Content Area: Transitions between Full-Width and Split-Screen */}
      <div className={`transition-all duration-300 ${selectedItem ? 'grid grid-cols-1 lg:grid-cols-12 gap-5 items-start' : 'space-y-4'}`}>
        
        {/* Left Column: Announcements List (Width: full if no selected item, ~5 of 12 cols when selected) */}
        <div className={`${selectedItem ? 'lg:col-span-5' : 'w-full'} space-y-4`}>
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5">
            {/* Search and Filter Row */}
            <div className="flex items-center gap-2.5 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm thông báo..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium placeholder-slate-400 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all"
                />
              </div>

              {/* Filter Button & Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    filterMode !== 'all'
                      ? 'bg-blue-50 text-blue-600 border-blue-200'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Bộ lọc</span>
                </button>

                {showFilterDropdown && (
                  <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl shadow-lg border border-slate-200/90 p-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                    <button
                      type="button"
                      onClick={() => { setFilterMode('all'); setShowFilterDropdown(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-left ${filterMode === 'all' ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                      <span>Tất cả trạng thái</span>
                      {filterMode === 'all' && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setFilterMode('unread'); setShowFilterDropdown(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-left ${filterMode === 'unread' ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                      <span>Chưa đọc (Chấm đỏ)</span>
                      {filterMode === 'unread' && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setFilterMode('read'); setShowFilterDropdown(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-left ${filterMode === 'read' ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                      <span>Đã đọc</span>
                      {filterMode === 'read' && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setFilterMode('bookmarked'); setShowFilterDropdown(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-left ${filterMode === 'bookmarked' ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                      <span>Đã đánh dấu sao</span>
                      {filterMode === 'bookmarked' && <Check className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Unread Notice Bar */}
            {unreadTotalCount > 0 && (
              <div className="mb-3 px-3.5 py-2 rounded-xl bg-rose-50/80 border border-rose-100 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-rose-700 font-bold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                  </span>
                  <span>Bạn có {unreadTotalCount} thông báo mới chưa đọc</span>
                </div>
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-800 underline cursor-pointer"
                >
                  Đánh dấu tất cả đã đọc
                </button>
              </div>
            )}

            {/* List of Announcements */}
            <div className="space-y-2.5">
              {currentPaginatedList.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-slate-50 border border-slate-100">
                  <Megaphone className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">Không tìm thấy thông báo phù hợp</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Thử đổi từ khóa tìm kiếm hoặc chọn danh mục khác</p>
                </div>
              ) : (
                currentPaginatedList.map((ann) => {
                  const isSelected = selectedItem?.id === ann.id;
                  const isUnread = !ann.isRead;
                  const cfg = CATEGORY_STYLES[ann.category] || CATEGORY_STYLES.all;
                  const CatIcon = cfg.icon;

                  return (
                    <div
                      key={ann.id}
                      onClick={() => handleSelectItem(ann)}
                      className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer relative group flex items-start gap-3.5 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/75 shadow-sm ring-2 ring-blue-500/25'
                          : isUnread
                          ? 'border-l-[5px] border-l-rose-500 border-t-rose-200/90 border-r-rose-200/90 border-b-rose-200/90 bg-gradient-to-r from-rose-50/70 via-rose-50/20 to-white shadow-xs ring-1 ring-rose-200/50 hover:shadow-md hover:border-rose-400'
                          : 'border-slate-200/60 bg-slate-50/70 hover:bg-white hover:border-slate-300 opacity-75 hover:opacity-100 text-slate-600'
                      }`}
                    >
                      {/* Icon */}
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border relative ${
                          isUnread
                            ? 'bg-rose-50 border-rose-200 text-rose-600 ring-2 ring-rose-100 shadow-xs'
                            : cfg.bgClass + ' ' + cfg.borderClass + ' opacity-90'
                        }`}
                      >
                        <CatIcon className="w-5 h-5" />
                        {isUnread && (
                          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600 border border-white"></span>
                          </span>
                        )}
                      </div>

                      {/* Info & Header */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <h3
                              className={`text-xs sm:text-sm line-clamp-1 transition-colors ${
                                isUnread
                                  ? 'font-black text-slate-950 group-hover:text-rose-600'
                                  : isSelected
                                  ? 'font-black text-blue-900'
                                  : 'font-semibold text-slate-600 group-hover:text-blue-600'
                              }`}
                            >
                              {ann.title}
                            </h3>
                            {isUnread && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white uppercase tracking-wider shrink-0 flex items-center gap-1 shadow-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                                Chưa đọc
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`text-[11px] whitespace-nowrap ${
                                isUnread ? 'font-black text-rose-600' : 'font-medium text-slate-400'
                              }`}
                            >
                              {ann.publishedDateFormatted || '08/11/2026'}
                            </span>
                            {isUnread && (
                              <div className="relative flex items-center justify-center shrink-0 w-3.5 h-3.5" title="Thông báo mới chưa đọc">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600 ring-2 ring-white shadow-xs"></span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Author & details */}
                        <div className="flex items-center gap-2 mt-1 text-[11px]">
                          <span className={`${isUnread ? 'font-black text-slate-900' : 'font-medium text-slate-500'}`}>
                            {ann.authorName}
                          </span>
                          {!selectedItem && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className={`line-clamp-1 max-w-md ${isUnread ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
                                {ann.body}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Controls matching mockup: < 1 2 3 4 5 > */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 pt-4 mt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCurrentPage(num)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentPage === num
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {num}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Detailed View (Appears on click matching mockup media_1794152658168_f4cfc07c.jpg) */}
        {selectedItem && (
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-7 space-y-5 animate-in fade-in duration-200">
            {/* Header: Icon, Title, Metadata & Action Buttons */}
            <div className="pb-4 border-b border-slate-100">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-snug">
                      {selectedItem.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{selectedItem.authorName}</span>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {selectedItem.publishedDateFormatted || '08/11/2026'}
                          {selectedItem.publishedTimeFormatted ? ` • ${selectedItem.publishedTimeFormatted}` : ' • 14:26'}
                        </span>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span>{selectedItem.viewsCount || 112} lượt xem</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Action Icons: Star, Share, Close/Expand */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleToggleBookmark(selectedItem.id, e)}
                    className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                      selectedItem.isBookmarked
                        ? 'bg-amber-50 text-amber-500 border-amber-200'
                        : 'text-slate-400 hover:text-slate-700 border-slate-200/80 hover:bg-slate-50'
                    }`}
                    title={selectedItem.isBookmarked ? 'Bỏ lưu' : 'Lưu thông báo'}
                  >
                    <Star className={`w-4 h-4 ${selectedItem.isBookmarked ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.href);
                      alert('Đã sao chép liên kết thông báo vào bộ nhớ đệm!');
                    }}
                    className="p-2 rounded-xl border border-slate-200/80 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    title="Chia sẻ thông báo"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="p-2 rounded-xl border border-slate-200/80 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Đóng chi tiết & mở rộng danh sách"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Salutation & Opening Paragraph */}
            <div className="space-y-1.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <p className="font-bold text-slate-900">
                {selectedItem.salutation || 'Kính gửi: Toàn thể học sinh khối 11,'}
              </p>
              <p className="text-slate-600">
                {selectedItem.intro || 'Nhà trường thông báo lịch kiểm tra giữa kỳ I năm học 2025 – 2026 như sau:'}
              </p>
            </div>

            {/* Table of Content matching mockup media_1794152658168_f4cfc07c.jpg */}
            {selectedItem.tableRows && selectedItem.tableRows.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-slate-200/80">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-blue-50/70 border-b border-slate-200/80 text-slate-800 font-bold">
                      <th className="py-2.5 px-3.5">Môn kiểm tra</th>
                      <th className="py-2.5 px-3.5">Ngày kiểm tra</th>
                      <th className="py-2.5 px-3.5">Thời gian</th>
                      <th className="py-2.5 px-3.5">Hình thức</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {selectedItem.tableRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 px-3.5 font-bold text-slate-900">{row.col1}</td>
                        <td className="py-2.5 px-3.5 text-slate-600">{row.col2}</td>
                        <td className="py-2.5 px-3.5 text-slate-600">{row.col3}</td>
                        <td className="py-2.5 px-3.5 text-slate-700">{row.col4}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Important Notes Callout Box */}
            {selectedItem.notes && selectedItem.notes.length > 0 && (
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100/90 text-xs text-slate-700 space-y-2">
                <div className="flex items-center gap-2 font-bold text-blue-900">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Lưu ý:</span>
                </div>
                <ul className="space-y-1.5 pl-6 list-disc text-slate-600 marker:text-blue-500 font-medium">
                  {selectedItem.notes.map((note, nIdx) => (
                    <li key={nIdx}>{note}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Attachments Section matching mockup */}
            {selectedItem.attachments && selectedItem.attachments.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Paperclip className="w-4 h-4 text-blue-600" />
                  <span>Tài liệu đính kèm ({selectedItem.attachments.length})</span>
                </div>

                <div className="space-y-2">
                  {selectedItem.attachments.map((file, fIdx) => (
                    <div
                      key={fIdx}
                      className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/60 transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Red PDF icon badge */}
                        <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 font-black text-[10px] flex items-center justify-center shrink-0 border border-rose-200/60 uppercase">
                          PDF
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                            {file.fileName}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{file.fileSize}</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => alert(`Đang tải tập tin: ${file.fileName}`)}
                        className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-white border border-transparent hover:border-slate-200 transition-all cursor-pointer shrink-0"
                        title="Tải xuống tệp tin"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
