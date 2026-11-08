import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldPlus,
  GraduationCap,
  BookOpen,
  ChevronRight,
  Bell,
  CreditCard,
  FileCheck2,
  Headphones,
  FileText,
  ChevronDown,
  X,
  Copy,
  Check,
  Printer,
  Phone,
  Mail,
  Building,
  QrCode
} from 'lucide-react';
import { studentApi } from '../services/studentApi';

interface FeeItemView {
  id: string;
  title: string;
  dueDate: string;
  amount: number;
  amountFormatted: string;
  status: 'paid' | 'unpaid' | 'pending';
  statusText: string;
  category: 'insurance' | 'service' | 'activity' | 'tuition';
  receiptCode?: string;
  paidAt?: string;
  description?: string;
}

interface RelatedNotice {
  id: string;
  title: string;
  date: string;
  hasRedDot?: boolean;
  content: string;
}

export const StudentFeesPage: React.FC = () => {
  // Dropdown filter states
  const [academicYear, setAcademicYear] = useState<string>('2025 – 2026');
  const [semester, setSemester] = useState<string>('Học kỳ I');
  const [showYearDropdown, setShowYearDropdown] = useState<boolean>(false);
  const [showSemDropdown, setShowSemDropdown] = useState<boolean>(false);

  // Modals state
  const [selectedFeeForPayment, setSelectedFeeForPayment] = useState<FeeItemView | null>(null);
  const [selectedFeeForReceipt, setSelectedFeeForReceipt] = useState<FeeItemView | null>(null);
  const [selectedNotice, setSelectedNotice] = useState<RelatedNotice | null>(null);
  const [showPaymentGuideModal, setShowPaymentGuideModal] = useState<boolean>(false);
  const [showReceiptTemplateModal, setShowReceiptTemplateModal] = useState<boolean>(false);
  const [showContactAccountantModal, setShowContactAccountantModal] = useState<boolean>(false);

  // Copy feedback
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [paymentSuccessAlert, setPaymentSuccessAlert] = useState<string | null>(null);

  // Fee items dataset according to academic year & semester
  const [feeItems, setFeeItems] = useState<FeeItemView[]>([
    {
      id: 'fee-01',
      title: 'Bảo hiểm y tế',
      dueDate: '15/10/2025',
      amount: 850000,
      amountFormatted: '850.000đ',
      status: 'paid',
      statusText: 'Đã thanh toán',
      category: 'insurance',
      receiptCode: 'BL-2025-10-8542',
      paidAt: '14/10/2025 – 09:30',
      description: 'Bảo hiểm y tế học sinh bắt buộc 12 tháng năm học 2025 – 2026 theo quy định của BHXH Việt Nam.'
    },
    {
      id: 'fee-02',
      title: 'Khoản dịch vụ theo quy định',
      dueDate: '20/11/2025',
      amount: 350000,
      amountFormatted: '350.000đ',
      status: 'unpaid',
      statusText: 'Chưa thanh toán',
      category: 'service',
      description: 'Học phẩm kiểm tra định kỳ, ứng dụng sổ liên lạc điện tử SOMS và vệ sinh môi trường học đường HKI.'
    },
    {
      id: 'fee-03',
      title: 'Hoạt động trải nghiệm, hướng nghiệp',
      dueDate: '30/11/2025',
      amount: 200000,
      amountFormatted: '200.000đ',
      status: 'pending',
      statusText: 'Chưa đến hạn',
      category: 'activity',
      description: 'Kinh phí tổ chức chương trình trải nghiệm thực tế và tư vấn hướng nghiệp Khối 11 tại Trung tâm Khởi nghiệp.'
    }
  ]);

  // Related announcements list matching mockup (with red dot on item 1!)
  const [notices, setNotices] = useState<RelatedNotice[]>([
    {
      id: 'notice-01',
      title: 'Thông báo thu khoản dịch vụ HKI',
      date: '08/11/2025',
      hasRedDot: true,
      content: 'Nhà trường thông báo kế hoạch thu nộp khoản dịch vụ theo quy định học kỳ I năm học 2025 – 2026. Đề nghị phụ huynh và học sinh hoàn tất trước ngày 20/11/2025 qua hình thức chuyển khoản VietQR hoặc nộp tại phòng Kế toán.'
    },
    {
      id: 'notice-02',
      title: 'Hướng dẫn thanh toán không dùng tiền mặt',
      date: '05/11/2025',
      hasRedDot: false,
      content: 'Thực hiện chuyển đổi số học đường, nhà trường triển khai cổng thanh toán trực tuyến qua ứng dụng SOMS Pay và mã VietQR động. Phụ huynh quét mã để tự động điền đúng thông tin và nhận biên lai điện tử tức thì.'
    },
    {
      id: 'notice-03',
      title: 'Quy định các khoản thu năm học 2025 – 2026',
      date: '01/11/2025',
      hasRedDot: false,
      content: 'Nghị quyết Hội đồng trường và văn bản hướng dẫn thu chi năm học 2025 – 2026 của Sở GD&ĐT Hà Nội. Các khoản thu gồm Bảo hiểm y tế bắt buộc, học phẩm chuyên đề và hoạt động trải nghiệm theo chương trình GDPT 2018.'
    }
  ]);

  // Load backend data in background if available
  useEffect(() => {
    let isMounted = true;
    studentApi.getFees().then((res) => {
      if (isMounted && res && res.feeItems && res.feeItems.length > 0) {
        // Keep synced with backend
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, [academicYear, semester]);

  // Handle switching year & semester
  const handleYearChange = (year: string) => {
    setAcademicYear(year);
    setShowYearDropdown(false);
    updateDataset(year, semester);
  };

  const handleSemesterChange = (sem: string) => {
    setSemester(sem);
    setShowSemDropdown(false);
    updateDataset(academicYear, sem);
  };

  const updateDataset = (yr: string, sem: string) => {
    if (yr === '2025 – 2026' && sem === 'Học kỳ I') {
      setFeeItems([
        {
          id: 'fee-01',
          title: 'Bảo hiểm y tế',
          dueDate: '15/10/2025',
          amount: 850000,
          amountFormatted: '850.000đ',
          status: 'paid',
          statusText: 'Đã thanh toán',
          category: 'insurance',
          receiptCode: 'BL-2025-10-8542',
          paidAt: '14/10/2025 – 09:30',
          description: 'Bảo hiểm y tế học sinh bắt buộc 12 tháng năm học 2025 – 2026 theo quy định của BHXH Việt Nam.'
        },
        {
          id: 'fee-02',
          title: 'Khoản dịch vụ theo quy định',
          dueDate: '20/11/2025',
          amount: 350000,
          amountFormatted: '350.000đ',
          status: 'unpaid',
          statusText: 'Chưa thanh toán',
          category: 'service',
          description: 'Học phẩm kiểm tra định kỳ, ứng dụng sổ liên lạc điện tử SOMS và vệ sinh môi trường học đường HKI.'
        },
        {
          id: 'fee-03',
          title: 'Hoạt động trải nghiệm, hướng nghiệp',
          dueDate: '30/11/2025',
          amount: 200000,
          amountFormatted: '200.000đ',
          status: 'pending',
          statusText: 'Chưa đến hạn',
          category: 'activity',
          description: 'Kinh phí tổ chức chương trình trải nghiệm thực tế và tư vấn hướng nghiệp Khối 11 tại Trung tâm Khởi nghiệp.'
        }
      ]);
    } else if (yr === '2025 – 2026' && sem === 'Học kỳ II') {
      setFeeItems([
        {
          id: 'fee-04',
          title: 'Học phí chính khóa HKII',
          dueDate: '15/02/2026',
          amount: 1800000,
          amountFormatted: '1.800.000đ',
          status: 'unpaid',
          statusText: 'Chưa thanh toán',
          category: 'tuition',
          description: 'Học phí chính khóa học kỳ II năm học 2025 – 2026 khối THPT công lập.'
        },
        {
          id: 'fee-05',
          title: 'Học phẩm chuyên đề HKII',
          dueDate: '25/02/2026',
          amount: 250000,
          amountFormatted: '250.000đ',
          status: 'pending',
          statusText: 'Chưa đến hạn',
          category: 'service',
          description: 'Tài liệu học tập và học cụ chuyên đề nâng cao học kỳ II.'
        }
      ]);
    } else {
      // 2024 - 2025 (Completed)
      setFeeItems([
        {
          id: 'fee-10',
          title: 'Học phí toàn phần năm học 2024 – 2025',
          dueDate: '15/10/2024',
          amount: 2450000,
          amountFormatted: '2.450.000đ',
          status: 'paid',
          statusText: 'Đã thanh toán',
          category: 'tuition',
          receiptCode: 'BL-2024-09-1123',
          paidAt: '12/10/2024 – 14:15',
          description: 'Toàn bộ các khoản học phí và dịch vụ lớp 10 năm học 2024 – 2025.'
        }
      ]);
    }
  };

  // KPI Calculations
  const totalPayable = feeItems.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPaid = feeItems.filter(f => f.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);
  const remainingBalance = feeItems.filter(f => f.status === 'unpaid').reduce((acc, curr) => acc + curr.amount, 0);

  const formatVND = (num: number) => {
    return num.toLocaleString('vi-VN') + 'đ';
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Simulate payment confirmation
  const handleConfirmPayment = (feeId: string) => {
    setFeeItems(prev => prev.map(f => {
      if (f.id === feeId) {
        return {
          ...f,
          status: 'paid',
          statusText: 'Đã thanh toán',
          receiptCode: `BL-2025-11-${Math.floor(1000 + Math.random() * 9000)}`,
          paidAt: new Date().toLocaleString('vi-VN')
        };
      }
      return f;
    }));
    setSelectedFeeForPayment(null);
    setPaymentSuccessAlert('Đã ghi nhận thanh toán thành công! Biên lai điện tử đã được phát hành.');
    setTimeout(() => setPaymentSuccessAlert(null), 4000);
  };

  const handleOpenNotice = (notice: RelatedNotice) => {
    setSelectedNotice(notice);
    // Dismiss red dot when read!
    if (notice.hasRedDot) {
      setNotices(prev => prev.map(n => n.id === notice.id ? { ...n, hasRedDot: false } : n));
    }
  };

  return (
    <div className="space-y-5 pb-12 select-none">
      {/* Success toast notification */}
      {paymentSuccessAlert && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-xs font-bold">{paymentSuccessAlert}</span>
          <button onClick={() => setPaymentSuccessAlert(null)} className="p-1 hover:bg-emerald-700 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Top Header Banner matching exact mockup media_1794155163802_808b55b0.jpg */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 shadow-2xs p-6 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4 relative z-10 max-w-2xl">
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <Wallet className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Khoản thu
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              Theo dõi các khoản thu, tình trạng thanh toán và biên nhận của bạn.
            </p>
          </div>
        </div>

        {/* 3D Wallet & Coins Illustration matching mockup visual */}
        <div className="hidden md:flex items-center justify-end relative z-10 shrink-0 pr-4">
          <div className="relative w-44 h-24 flex items-center justify-center">
            {/* Soft background foliage glow */}
            <div className="absolute right-3 -bottom-1 w-24 h-16 bg-emerald-400/20 rounded-full blur-xl pointer-events-none" />
            <div className="absolute left-6 top-1 w-20 h-16 bg-blue-400/20 rounded-full blur-lg pointer-events-none" />

            {/* SVG 3D Wallet Illustration */}
            <svg viewBox="0 0 180 100" className="w-40 h-24 overflow-visible drop-shadow-sm">
              <defs>
                <linearGradient id="walletGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2563EB" />
                  <stop offset="100%" stopColor="#1D4ED8" />
                </linearGradient>
                <linearGradient id="walletTopGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#1E40AF" />
                </linearGradient>
                <linearGradient id="coinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FCD34D" />
                  <stop offset="100%" stopColor="#F59E0B" />
                </linearGradient>
                <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34D399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>

              {/* Green Leaves at background */}
              <path d="M120 70 C140 50, 165 60, 160 80 C145 85, 130 80, 120 70 Z" fill="url(#leafGrad)" opacity="0.85" />
              <path d="M15 75 C0 55, 10 40, 25 50 C25 65, 20 70, 15 75 Z" fill="url(#leafGrad)" opacity="0.75" />

              {/* Blue Wallet Base */}
              <rect x="75" y="24" width="76" height="54" rx="10" fill="url(#walletGrad)" />
              <rect x="80" y="16" width="66" height="14" rx="5" fill="url(#walletTopGrad)" />
              {/* Wallet clasp */}
              <rect x="135" y="42" width="18" height="18" rx="6" fill="#FBBF24" />
              <circle cx="144" cy="51" r="3" fill="#B45309" />

              {/* Golden Coins Stack at front */}
              {/* Coin 1 */}
              <ellipse cx="58" cy="74" rx="15" ry="6" fill="#D97706" />
              <rect x="43" y="70" width="30" height="4" fill="url(#coinGrad)" />
              <ellipse cx="58" cy="70" rx="15" ry="6" fill="url(#coinGrad)" />
              {/* Coin 2 */}
              <ellipse cx="58" cy="64" rx="15" ry="6" fill="#D97706" />
              <rect x="43" y="60" width="30" height="4" fill="url(#coinGrad)" />
              <ellipse cx="58" cy="60" rx="15" ry="6" fill="url(#coinGrad)" />
              {/* Coin 3 */}
              <ellipse cx="58" cy="54" rx="15" ry="6" fill="#D97706" />
              <rect x="43" y="50" width="30" height="4" fill="url(#coinGrad)" />
              <ellipse cx="58" cy="50" rx="15" ry="6" fill="url(#coinGrad)" />

              {/* Higher coin stack */}
              <ellipse cx="40" cy="78" rx="14" ry="5.5" fill="#D97706" />
              <rect x="26" y="74" width="28" height="4" fill="url(#coinGrad)" />
              <ellipse cx="40" cy="74" rx="14" ry="5.5" fill="url(#coinGrad)" />
              <ellipse cx="40" cy="69" rx="14" ry="5.5" fill="#D97706" />
              <rect x="26" y="65" width="28" height="4" fill="url(#coinGrad)" />
              <ellipse cx="40" cy="65" rx="14" ry="5.5" fill="url(#coinGrad)" />
            </svg>
          </div>
        </div>
      </div>

      {/* 2. Filter Pills: Năm học & Học kỳ matching mockup */}
      <div className="flex items-center gap-3">
        {/* Dropdown 1: Năm học */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setShowYearDropdown(!showYearDropdown); setShowSemDropdown(false); }}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200/90 text-xs font-bold text-slate-800 shadow-2xs hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Năm học {academicYear}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {showYearDropdown && (
            <div className="absolute left-0 top-full mt-1.5 w-60 bg-white rounded-xl shadow-lg border border-slate-200/90 p-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
              <button
                type="button"
                onClick={() => handleYearChange('2025 – 2026')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-left ${academicYear === '2025 – 2026' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                <span>Năm học 2025 – 2026 (Khối 11)</span>
                {academicYear === '2025 – 2026' && <Check className="w-3.5 h-3.5 text-blue-600" />}
              </button>
              <button
                type="button"
                onClick={() => handleYearChange('2024 – 2025')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-left ${academicYear === '2024 – 2025' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                <span>Năm học 2024 – 2025 (Khối 10)</span>
                {academicYear === '2024 – 2025' && <Check className="w-3.5 h-3.5 text-blue-600" />}
              </button>
              <button
                type="button"
                onClick={() => handleYearChange('2026 – 2027')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-left ${academicYear === '2026 – 2027' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                <span>Năm học 2026 – 2027 (Khối 12)</span>
                {academicYear === '2026 – 2027' && <Check className="w-3.5 h-3.5 text-blue-600" />}
              </button>
            </div>
          )}
        </div>

        {/* Dropdown 2: Học kỳ */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setShowSemDropdown(!showSemDropdown); setShowYearDropdown(false); }}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200/90 text-xs font-bold text-slate-800 shadow-2xs hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
          >
            <span>{semester}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {showSemDropdown && (
            <div className="absolute left-0 top-full mt-1.5 w-44 bg-white rounded-xl shadow-lg border border-slate-200/90 p-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
              <button
                type="button"
                onClick={() => handleSemesterChange('Học kỳ I')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-left ${semester === 'Học kỳ I' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                <span>Học kỳ I</span>
                {semester === 'Học kỳ I' && <Check className="w-3.5 h-3.5 text-blue-600" />}
              </button>
              <button
                type="button"
                onClick={() => handleSemesterChange('Học kỳ II')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-left ${semester === 'Học kỳ II' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                <span>Học kỳ II</span>
                {semester === 'Học kỳ II' && <Check className="w-3.5 h-3.5 text-blue-600" />}
              </button>
              <button
                type="button"
                onClick={() => handleSemesterChange('Cả năm')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-left ${semester === 'Cả năm' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                <span>Cả năm</span>
                {semester === 'Cả năm' && <Check className="w-3.5 h-3.5 text-blue-600" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN: KPI Cards + Danh sách khoản thu (Cols 1 - 8) */}
        <div className="lg:col-span-8 space-y-5">
          {/* 3 KPI Summary Cards matching exact colors & amounts in mockup */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Card 1: Tổng phải nộp (1.200.000đ) */}
            <div className="bg-[#F0F6FF] rounded-2xl border border-blue-100/90 p-4 sm:p-5 flex items-center gap-3.5 shadow-2xs">
              <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-600 leading-tight">Tổng phải nộp</div>
                <div className="text-lg sm:text-xl font-black text-[#1877F2] tracking-tight mt-0.5 truncate">
                  {formatVND(totalPayable)}
                </div>
              </div>
            </div>

            {/* Card 2: Đã thanh toán (850.000đ) */}
            <div className="bg-[#F0FDF4] rounded-2xl border border-emerald-100/90 p-4 sm:p-5 flex items-center gap-3.5 shadow-2xs">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-600 leading-tight">Đã thanh toán</div>
                <div className="text-lg sm:text-xl font-black text-emerald-600 tracking-tight mt-0.5 truncate">
                  {formatVND(totalPaid)}
                </div>
              </div>
            </div>

            {/* Card 3: Còn phải nộp (350.000đ) */}
            <div className="bg-[#FFFBEB] rounded-2xl border border-amber-100/90 p-4 sm:p-5 flex items-center gap-3.5 shadow-2xs">
              <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-600 leading-tight">Còn phải nộp</div>
                <div className="text-lg sm:text-xl font-black text-amber-600 tracking-tight mt-0.5 truncate">
                  {formatVND(remainingBalance)}
                </div>
              </div>
            </div>
          </div>

          {/* Block: Danh sách khoản thu (3) matching mockup card rows */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Danh sách khoản thu ({feeItems.length})</span>
            </h2>

            <div className="space-y-2.5">
              {feeItems.map((fee) => {
                const isPaid = fee.status === 'paid';
                const isUnpaid = fee.status === 'unpaid';

                return (
                  <div
                    key={fee.id}
                    onClick={() => {
                      if (isPaid) {
                        setSelectedFeeForReceipt(fee);
                      } else {
                        setSelectedFeeForPayment(fee);
                      }
                    }}
                    className="p-4 sm:p-4.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-sm hover:border-blue-300 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    {/* Left: Icon + Title + DueDate */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Icon */}
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                          fee.category === 'insurance'
                            ? 'bg-blue-50 text-blue-600 border-blue-100'
                            : fee.category === 'service'
                            ? 'bg-sky-50 text-sky-600 border-sky-100'
                            : 'bg-cyan-50 text-cyan-600 border-cyan-100'
                        }`}
                      >
                        {fee.category === 'insurance' && <ShieldPlus className="w-5 h-5" />}
                        {fee.category === 'service' && <GraduationCap className="w-5 h-5" />}
                        {fee.category === 'activity' && <BookOpen className="w-5 h-5" />}
                        {fee.category === 'tuition' && <Wallet className="w-5 h-5" />}
                      </div>

                      {/* Content */}
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                          {fee.title}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Hạn nộp: {fee.dueDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Amount + Status Badge + Chevron */}
                    <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                      <div className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                        {fee.amountFormatted}
                      </div>

                      {/* Status Badge */}
                      {isPaid ? (
                        <div className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Đã thanh toán</span>
                        </div>
                      ) : isUnpaid ? (
                        <div className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Chưa thanh toán</span>
                        </div>
                      ) : (
                        <div className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          <span>Chưa đến hạn</span>
                        </div>
                      )}

                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 2 Side Widgets (Cols 9 - 12) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Widget 1: Thông báo liên quan with RED DOT matching mockup */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600" />
                <span>Thông báo liên quan</span>
              </h3>
              <a
                href="/student/announcements"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 cursor-pointer"
              >
                <span>Xem tất cả</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="divide-y divide-slate-100">
              {notices.map((notice) => (
                <div
                  key={notice.id}
                  onClick={() => handleOpenNotice(notice)}
                  className="py-3 first:pt-1 last:pb-1 flex items-start gap-3 cursor-pointer group"
                >
                  <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {notice.title}
                      </div>
                      {/* DẤU CHẤM ĐỎ NỔI BẬT KHỚP MOCKUP ẢNH */}
                      {notice.hasRedDot && (
                        <div className="relative flex items-center justify-center shrink-0 w-3 h-3 mt-0.5" title="Thông báo mới chưa đọc">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600 ring-2 ring-white shadow-xs"></span>
                        </div>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {notice.date}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Widget 2: Hướng dẫn & Hỗ trợ matching mockup */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Hướng dẫn &amp; Hỗ trợ</span>
            </h3>

            <div className="space-y-2">
              {/* Item 1: Hướng dẫn thanh toán */}
              <button
                type="button"
                onClick={() => setShowPaymentGuideModal(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                    Hướng dẫn thanh toán
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
              </button>

              {/* Item 2: Xem mẫu biên nhận */}
              <button
                type="button"
                onClick={() => setShowReceiptTemplateModal(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                    Xem mẫu biên nhận
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
              </button>

              {/* Item 3: Liên hệ phòng Kế toán */}
              <button
                type="button"
                onClick={() => setShowContactAccountantModal(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Headphones className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                    Liên hệ phòng Kế toán
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: THANH TOÁN KHOẢN THU (VietQR & Chuyển khoản ngân hàng) */}
      {/* ========================================================================= */}
      {selectedFeeForPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setSelectedFeeForPayment(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Chi tiết &amp; Thanh toán</h3>
                <p className="text-xs text-slate-500">{selectedFeeForPayment.title}</p>
              </div>
            </div>

            {/* Amount Box */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 mb-5 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Số tiền cần thanh toán</div>
                <div className="text-2xl font-black text-[#1877F2] mt-0.5">{selectedFeeForPayment.amountFormatted}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-slate-500 font-medium">Hạn thanh toán</div>
                <div className="text-xs font-bold text-rose-600 mt-0.5">{selectedFeeForPayment.dueDate}</div>
              </div>
            </div>

            {/* QR Code + Bank Details */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 mb-5">
              <div className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-blue-600" />
                <span>Quét mã VietQR chuyển khoản 24/7 (Miễn phí)</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Simulated VietQR */}
                <div className="w-36 h-36 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs flex flex-col items-center justify-center text-center shrink-0">
                  <div className="w-full h-full bg-slate-900 rounded-lg p-2 flex flex-col items-center justify-between text-white">
                    <span className="text-[9px] font-black tracking-widest text-amber-300 uppercase">VietQR • Napas</span>
                    <div className="w-16 h-16 bg-white p-1 rounded flex items-center justify-center">
                      <QrCode className="w-14 h-14 text-slate-900" />
                    </div>
                    <span className="text-[8px] font-mono text-slate-300">THPT NGUYEN TRAI</span>
                  </div>
                </div>

                {/* Bank Account Details */}
                <div className="flex-1 w-full space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Ngân hàng:</span>
                    <span className="font-bold text-slate-800">Vietcombank – Chi nhánh Thanh Xuân</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Số tài khoản:</span>
                    <div className="flex items-center justify-between font-mono font-bold text-blue-700 bg-white px-2 py-1 rounded border border-slate-200">
                      <span>1029384756</span>
                      <button
                        onClick={() => handleCopy('1029384756', 'stk')}
                        className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedField === 'stk' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        {copiedField === 'stk' ? 'Đã chép' : 'Sao chép'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Chủ tài khoản:</span>
                    <span className="font-bold text-slate-800">TRUONG THPT NGUYEN TRAI - QUY THU HOC PHI</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Nội dung chuyển khoản (bắt buộc):</span>
                    <div className="flex items-center justify-between font-mono text-[11px] font-bold text-rose-700 bg-white px-2 py-1 rounded border border-rose-200">
                      <span className="truncate">HS230145 Nguyen Minh Anh 11A1 Khoan dich vu HKI</span>
                      <button
                        onClick={() => handleCopy('HS230145 Nguyen Minh Anh 11A1 Khoan dich vu HKI', 'content')}
                        className="text-[10px] text-rose-600 hover:text-rose-800 flex items-center gap-1 shrink-0 ml-2 cursor-pointer"
                      >
                        {copiedField === 'content' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        {copiedField === 'content' ? 'Đã chép' : 'Sao chép'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedFeeForPayment(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => handleConfirmPayment(selectedFeeForPayment.id)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Tôi đã chuyển khoản xong</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: XEM BIÊN LAI ĐIỆN TỬ (ĐÃ THANH TOÁN) */}
      {/* ========================================================================= */}
      {selectedFeeForReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setSelectedFeeForReceipt(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Receipt Header */}
            <div className="text-center border-b border-slate-100 pb-4 mb-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">SỞ GIÁO DỤC VÀ ĐÀO TẠO HÀ NỘI</div>
              <div className="text-sm font-black text-slate-900 uppercase">TRƯỜNG THPT NGUYỄN TRÃI</div>
              <div className="text-xs text-slate-500 mt-0.5">Mã định danh: 010048293 • Cổng SOMS Pay</div>
              <div className="inline-block mt-3 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-black text-xs border border-emerald-200">
                BIÊN LAI THU TIỀN ĐIỆN TỬ
              </div>
            </div>

            {/* Receipt Info */}
            <div className="space-y-2.5 text-xs text-slate-700 mb-5">
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Số biên nhận:</span>
                <span className="font-mono font-bold text-slate-900">{selectedFeeForReceipt.receiptCode || 'BL-2025-10-8542'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Họ và tên học sinh:</span>
                <span className="font-bold text-slate-900">Nguyễn Minh Anh</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Mã số học sinh / Lớp:</span>
                <span className="font-mono font-bold text-slate-900">HS230145 – Lớp 11A1</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Khoản thu:</span>
                <span className="font-bold text-slate-900">{selectedFeeForReceipt.title}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Thời gian thu tiền:</span>
                <span className="font-medium text-slate-800">{selectedFeeForReceipt.paidAt || '14/10/2025 – 09:30'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Hình thức thanh toán:</span>
                <span className="font-medium text-slate-800">Chuyển khoản QR Napas 24/7 (Vietcombank)</span>
              </div>
              <div className="flex items-center justify-between py-2 pt-3 bg-slate-50 px-3 rounded-xl">
                <span className="font-bold text-slate-900 text-sm">Tổng tiền đã nộp:</span>
                <span className="font-black text-emerald-600 text-lg">{selectedFeeForReceipt.amountFormatted}</span>
              </div>
            </div>

            {/* Stamp Stamp */}
            <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl flex items-center justify-between text-xs text-emerald-800 mb-5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <div className="font-bold">ĐÃ XÁC THỰC KÝ ĐIỆN TỬ</div>
                  <div className="text-[10px] text-emerald-600">Phòng Kế toán – Trường THPT Nguyễn Trãi</div>
                </div>
              </div>
              <div className="text-right text-[10px] text-slate-400">
                Giá trị pháp lý theo Nghị định 123/2020/NĐ-CP
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedFeeForReceipt(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In biên lai</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: XEM CHI TIẾT THÔNG BÁO LIÊN QUAN */}
      {/* ========================================================================= */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setSelectedNotice(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 text-xs text-blue-600 font-bold mb-2">
              <Bell className="w-4 h-4" />
              <span>Thông báo từ Phòng Kế toán</span>
            </div>

            <h3 className="text-base font-black text-slate-900 mb-1 leading-snug">
              {selectedNotice.title}
            </h3>
            <div className="text-[11px] text-slate-400 mb-4">Ngày ban hành: {selectedNotice.date}</div>

            <div className="p-4 rounded-2xl bg-slate-50 text-xs text-slate-700 leading-relaxed mb-5 border border-slate-100 font-medium">
              {selectedNotice.content}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedNotice(null)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: HƯỚNG DẪN THANH TOÁN */}
      {/* ========================================================================= */}
      {showPaymentGuideModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowPaymentGuideModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Hướng dẫn thanh toán khoản thu</h3>
                <p className="text-xs text-slate-500">Các phương thức thanh toán không dùng tiền mặt</p>
              </div>
            </div>

            <div className="space-y-3 text-xs mb-5">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">1</span>
                  <span>Chuyển khoản VietQR / Mobile Banking (Khuyên dùng)</span>
                </div>
                <p className="text-slate-600 pl-7 leading-relaxed">
                  Mở ứng dụng ngân hàng bất kỳ, quét mã VietQR trên cổng SOMS. Hệ thống tự động điền STK, số tiền và cú pháp mã học sinh. Gạch nợ tự động trong 5 phút.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">2</span>
                  <span>Ví điện tử &amp; Cổng SOMS Pay</span>
                </div>
                <p className="text-slate-600 pl-7 leading-relaxed">
                  Hỗ trợ liên kết tài khoản MoMo, ZaloPay, Viettel Money hoặc thẻ ATM nội địa Napas của phụ huynh.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">3</span>
                  <span>Nộp trực tiếp tại phòng Kế toán</span>
                </div>
                <p className="text-slate-600 pl-7 leading-relaxed">
                  Dành cho trường hợp phụ huynh cần thanh toán bằng tiền mặt hoặc quẹt thẻ POS trực tiếp tại Phòng Kế toán (Tầng 1 Nhà Hiệu bộ).
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowPaymentGuideModal(false)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Đã rõ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: XEM MẪU BIÊN NHẬN */}
      {/* ========================================================================= */}
      {showReceiptTemplateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowReceiptTemplateModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Mẫu biên nhận thu tiền điện tử</h3>
                <p className="text-xs text-slate-500">Mẫu chuẩn theo Thông tư 78 của Bộ Tài chính</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 text-xs space-y-2 mb-5">
              <div className="text-center font-bold text-slate-800 pb-2 border-b border-slate-200">
                PHIẾU THU TIỀN ĐIỆN TỬ (MẪU MINH HỌA)
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Đơn vị phát hành:</span>
                <span className="font-bold text-slate-900">THPT Nguyễn Trãi</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Ký hiệu mẫu:</span>
                <span className="font-mono font-bold text-slate-900">01GTTT0/001</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Xác thực:</span>
                <span className="font-bold text-emerald-600">Chữ ký số tập trung CKS VNPT</span>
              </div>
              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-200">
                Sau khi thanh toán thành công qua ngân hàng hoặc cổng SOMS Pay, hệ thống tự động sinh biên lai có mã tra cứu và gửi về email học sinh / phụ huynh trong 24 giờ.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowReceiptTemplateModal(false)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: LIÊN HỆ PHÒNG KẾ TOÁN */}
      {/* ========================================================================= */}
      {showContactAccountantModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowContactAccountantModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Liên hệ phòng Kế toán</h3>
                <p className="text-xs text-slate-500">Trường THPT Nguyễn Trãi</p>
              </div>
            </div>

            <div className="space-y-3 text-xs mb-5">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <Phone className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400">Đường dây nóng tài vụ:</div>
                  <div className="font-bold text-slate-800">024 3858 2931 (Máy lẻ 104)</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400">Hòm thư điện tử:</div>
                  <div className="font-bold text-slate-800">ketoan@nguyentrai.edu.vn</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <Building className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400">Địa điểm làm việc:</div>
                  <div className="font-bold text-slate-800">Phòng 102 – Tầng 1 Nhà Hiệu bộ (Dãy A)</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400">Thời gian tiếp nhận phụ huynh &amp; học sinh:</div>
                  <div className="font-bold text-slate-800">Sáng 07:30 – 11:30 • Chiều 13:30 – 17:00 (Thứ 2 – Thứ 6)</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowContactAccountantModal(false)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
