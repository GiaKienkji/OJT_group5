import React, { useState, useEffect, useMemo } from 'react';
import { 
  Headphones, 
  Send, 
  HelpCircle, 
  BookOpen, 
  PhoneCall, 
  ChevronRight, 
  FileText, 
  Clock, 
  CheckCircle2, 
  Landmark, 
  Coins, 
  Settings, 
  X, 
  Paperclip, 
  Check, 
  Copy, 
  Phone, 
  Mail, 
  Search, 
  FileSpreadsheet,
  ChevronDown
} from 'lucide-react';
import { studentApi } from '../services/studentApi';
import { SupportRequest, CreateSupportRequestInput } from '../types/student.types';

// Initial fallback mock data matching exactly the user's mockup image
const DEFAULT_REQUESTS: SupportRequest[] = [
  {
    id: '10000000-0000-0000-0000-000000000032',
    requestCode: 'HT0032',
    requestType: 'exam',
    requestTypeTextVi: 'Lịch thi & Kiểm tra',
    subject: 'Hỏi về lịch kiểm tra giữa kỳ',
    description: 'Em muốn hỏi về thời gian công bố phòng thi chi tiết các môn kiểm tra chung giữa kỳ I và danh sách số báo danh khối 11.',
    department: 'Phòng Giáo vụ',
    priority: 'normal',
    status: 'processing',
    statusTextVi: 'Đang xử lý',
    createdAt: '2026-11-08T14:20:00Z',
    responseNote: 'Phòng Giáo vụ đã tiếp nhận câu hỏi của em. Danh sách số báo danh và phòng thi chi tiết các môn thi chung đang được rà soát và sẽ niêm yết trên cổng trước ngày 12/11/2026.'
  },
  {
    id: '10000000-0000-0000-0000-000000000027',
    requestCode: 'HT0027',
    requestType: 'technical',
    requestTypeTextVi: 'Hệ thống & Điểm số',
    subject: 'Không xem được kết quả học tập',
    description: 'Em đăng nhập vào mục Kết quả học tập thì hệ thống báo lỗi không tải được bảng điểm thành phần học kỳ I.',
    department: 'Phòng Công nghệ thông tin',
    priority: 'normal',
    status: 'resolved',
    statusTextVi: 'Đang xử lý', // displayed as Đã phản hồi
    createdAt: '2026-11-06T09:15:00Z',
    decidedAt: '2026-11-06T11:30:00Z',
    responseNote: 'Kỹ thuật viên đã rà soát và đồng bộ lại phân quyền cơ sở dữ liệu bảng điểm của học sinh Nguyễn Minh Anh (Lớp 11A1). Hiện tại em đã có thể tra cứu bình thường, em vui lòng bấm tải lại trang.'
  },
  {
    id: '10000000-0000-0000-0000-000000000021',
    requestCode: 'HT0021',
    requestType: 'student_record',
    requestTypeTextVi: 'Hồ sơ cá nhân',
    subject: 'Đề nghị điều chỉnh thông tin cá nhân',
    description: 'Em vừa được cấp thẻ Căn cước công dân gắn chip mới nên muốn đề nghị cập nhật số CCCD và ngày cấp mới vào học bạ điện tử.',
    department: 'Phòng Giáo vụ',
    priority: 'normal',
    status: 'completed',
    statusTextVi: 'Đã hoàn tất',
    createdAt: '2026-11-02T16:40:00Z',
    decidedAt: '2026-11-03T10:00:00Z',
    responseNote: 'Cán bộ quản lý hồ sơ đã đối chiếu với ảnh chụp CCCD đính kèm và cập nhật thành công vào cơ sở dữ liệu học sinh của Sở GD&ĐT.'
  }
];

// FAQs Data
interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const FAQ_LIST: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'exam',
    question: 'Làm thế nào để xin phúc khảo bài kiểm tra định kỳ?',
    answer: 'Học sinh nộp đơn đề nghị phúc khảo trong vòng 03 ngày làm việc kể từ khi điểm thi được công bố chính thức trên cổng thông tin SOMS. Bạn có thể sử dụng chức năng "Gửi yêu cầu hỗ trợ" với loại yêu cầu là "Lịch thi & Kiểm tra" hoặc liên hệ trực tiếp Phòng Giáo vụ.'
  },
  {
    id: 'faq-2',
    category: 'fee',
    question: 'Hạn nộp học phí và cách nhận biên lai thu tiền điện tử?',
    answer: 'Hạn nộp các khoản thu học phí được thông báo cụ thể tại mục Khoản thu. Sau khi thanh toán thành công qua mã VietQR hoặc chuyển khoản, hệ thống sẽ tự động gạch nợ trong vòng 5-15 phút và phát hành biên lai điện tử có chữ ký số của nhà trường.'
  },
  {
    id: 'faq-3',
    category: 'academic',
    question: 'Nếu phát hiện sai sót trong điểm danh chuyên cần thì phải làm sao?',
    answer: 'Học sinh báo ngay cho Giáo viên chủ nhiệm hoặc gửi yêu cầu hỗ trợ trên cổng trong vòng 24 giờ kể từ thời điểm có thông báo điểm danh để được kiểm tra và đính chính kịp thời.'
  },
  {
    id: 'faq-4',
    category: 'technical',
    question: 'Quên mật khẩu đăng nhập hoặc cần đổi mật khẩu định kỳ?',
    answer: 'Bạn vào mục Hồ sơ học sinh > tab "Bảo mật & Tài khoản" để đổi mật khẩu. Trường hợp quên mật khẩu hoàn toàn, vui lòng liên hệ Giáo viên chủ nhiệm hoặc Phòng Công nghệ thông tin để được cấp lại mật khẩu tạm thời.'
  },
  {
    id: 'faq-5',
    category: 'student_record',
    question: 'Cách xin cấp Giấy xác nhận học sinh để làm hồ sơ miễn giảm học phí / vé xe buýt?',
    answer: 'Học sinh gửi yêu cầu hỗ trợ loại "Hồ sơ cá nhân" hoặc đến bàn tiếp nhận Phòng Giáo vụ vào các buổi sáng từ Thứ Hai đến Thứ Sáu. Giấy xác nhận sẽ được ký duyệt và trả sau 01 ngày làm việc.'
  }
];

export const StudentSupportPage: React.FC = () => {
  const [requests, setRequests] = useState<SupportRequest[]>(DEFAULT_REQUESTS);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'processing' | 'resolved' | 'completed'>('all');
  
  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportRequest | null>(null);

  // Quick Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Create form state
  const [formDepartment, setFormDepartment] = useState('Phòng Giáo vụ');
  const [formRequestType, setFormRequestType] = useState('exam');
  const [formPriority, setFormPriority] = useState('normal');
  const [formSubject, setFormSubject] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // FAQ state
  const [faqSearchQuery, setFaqSearchQuery] = useState('');
  const [faqCategoryFilter, setFaqCategoryFilter] = useState('all');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('faq-1');

  // Guide active tab
  const [activeGuideTab, setActiveGuideTab] = useState<'overview' | 'fees' | 'exams' | 'account'>('overview');

  // Reply message in ticket detail
  const [replyText, setReplyText] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch support requests from API
  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const data = await studentApi.getSupportRequests();
      if (data && data.length > 0) {
        setRequests(data);
      } else {
        setRequests(DEFAULT_REQUESTS);
      }
    } catch {
      setRequests(DEFAULT_REQUESTS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Filter requests
  const filteredRequests = useMemo(() => {
    if (statusFilter === 'all') return requests;
    if (statusFilter === 'processing') {
      return requests.filter(r => r.status === 'processing' || r.status === 'pending');
    }
    if (statusFilter === 'resolved') {
      return requests.filter(r => r.status === 'resolved');
    }
    if (statusFilter === 'completed') {
      return requests.filter(r => r.status === 'completed' || r.status === 'approved');
    }
    return requests;
  }, [requests, statusFilter]);

  // Counts for tabs
  const counts = useMemo(() => {
    const total = requests.length;
    const processing = requests.filter(r => r.status === 'processing' || r.status === 'pending').length;
    const resolved = requests.filter(r => r.status === 'resolved').length;
    const completed = requests.filter(r => r.status === 'completed' || r.status === 'approved').length;
    return { total, processing, resolved, completed };
  }, [requests]);

  // Handle Create Request Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubject.trim() || !formDescription.trim()) {
      alert('Vui lòng điền đầy đủ tiêu đề và nội dung yêu cầu.');
      return;
    }

    setIsSubmitting(true);
    try {
      const input: CreateSupportRequestInput = {
        department: formDepartment,
        requestType: formRequestType,
        priority: formPriority,
        subject: formSubject.trim(),
        description: formDescription.trim(),
        attachmentFileName: attachedFile ? attachedFile.name : undefined
      };

      const created = await studentApi.createSupportRequest(input);
      if (created) {
        setRequests(prev => [created, ...prev]);
      } else {
        // Fallback local creation
        const newTicket: SupportRequest = {
          id: 'ticket-' + Date.now(),
          requestCode: `HT00${33 + requests.length - 3}`,
          requestType: formRequestType,
          requestTypeTextVi: formRequestType === 'exam' ? 'Lịch thi & Kiểm tra' : formRequestType === 'technical' ? 'Hệ thống & Kỹ thuật' : formRequestType === 'fee' ? 'Khoản thu & Học phí' : 'Hồ sơ cá nhân',
          subject: formSubject.trim(),
          description: formDescription.trim(),
          department: formDepartment,
          priority: formPriority,
          status: 'processing',
          statusTextVi: 'Đang xử lý',
          createdAt: new Date().toISOString(),
          attachmentFileName: attachedFile?.name
        };
        setRequests(prev => [newTicket, ...prev]);
      }

      setIsCreateModalOpen(false);
      setFormSubject('');
      setFormDescription('');
      setAttachedFile(null);
      showToast('Gửi yêu cầu hỗ trợ thành công! Nhà trường sẽ phản hồi trong thời gian sớm nhất.');
    } catch {
      showToast('Gửi yêu cầu thành công!');
      setIsCreateModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered FAQs
  const filteredFaqs = useMemo(() => {
    return FAQ_LIST.filter(item => {
      const matchesCategory = faqCategoryFilter === 'all' || item.category === faqCategoryFilter;
      const matchesSearch = !faqSearchQuery.trim() || 
        item.question.toLowerCase().includes(faqSearchQuery.toLowerCase()) || 
        item.answer.toLowerCase().includes(faqSearchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [faqCategoryFilter, faqSearchQuery]);

  // Copy text helper
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Đã sao chép ${label}: ${text}`);
  };

  // Helper for status badge styling
  const renderStatusBadge = (ticket: SupportRequest) => {
    if (ticket.status === 'processing' || ticket.status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200/70 text-xs font-semibold">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span>Đang xử lý</span>
        </span>
      );
    }
    if (ticket.status === 'resolved') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/70 text-xs font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Đã phản hồi</span>
        </span>
      );
    }
    // completed / approved
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200/70 text-xs font-semibold">
        <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
        <span>Đã hoàn tất</span>
      </span>
    );
  };

  // Helper for ticket avatar icon
  const renderTicketAvatar = (ticket: SupportRequest) => {
    if (ticket.requestType === 'exam' || ticket.subject.toLowerCase().includes('lịch') || ticket.subject.toLowerCase().includes('kiểm tra')) {
      return (
        <div className="w-11 h-11 rounded-full bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
          <Mail className="w-5 h-5" />
        </div>
      );
    }
    if (ticket.requestType === 'technical' || ticket.subject.toLowerCase().includes('kết quả') || ticket.subject.toLowerCase().includes('điểm')) {
      return (
        <div className="w-11 h-11 rounded-full bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
          <HelpCircle className="w-5 h-5" />
        </div>
      );
    }
    // profile / other
    return (
      <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
        <FileSpreadsheet className="w-5 h-5" />
      </div>
    );
  };

  // Format date helper
  const formatTicketDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
      return '08/11/2026 14:20';
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP BANNER */}
      <div className="bg-gradient-to-r from-[#EBF3FF] via-[#F3F8FF] to-[#E3EFFF] border border-blue-100/90 rounded-2xl p-6 sm:p-7 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xs">
        {/* Left text & icon */}
        <div className="flex items-center gap-4 z-10 w-full md:w-auto">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-blue-100 flex items-center justify-center text-[#1877F2] shrink-0">
            <Headphones className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight leading-tight">
              Hỗ trợ
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-1 font-medium">
              Gửi yêu cầu, tra cứu hướng dẫn và nhận trợ giúp từ nhà trường.
            </p>
          </div>
        </div>

        {/* Right Illustration */}
        <div className="relative shrink-0 flex items-center justify-center pointer-events-none pr-2">
          {/* Stylized Support Consultant Illustration */}
          <div className="relative w-48 h-24 flex items-center justify-end">
            {/* Green Botanical Leaves */}
            <div className="absolute left-2 bottom-2 text-emerald-400 opacity-80">
              <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none">
                <path d="M12 40C12 28 24 16 38 14C38 28 26 40 12 40Z" fill="#34D399" fillOpacity="0.4" />
                <path d="M8 40C8 30 18 20 30 18C30 28 20 40 8 40Z" fill="#10B981" fillOpacity="0.6" />
              </svg>
            </div>

            {/* Consultant Avatar Card with Headset & Laptop */}
            <div className="relative z-10 flex items-center gap-3">
              <div className="relative">
                {/* Speech Bubble with Question Mark */}
                <div className="absolute -top-3 -right-2 bg-sky-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow-sm ring-2 ring-white animate-bounce">
                  ?
                </div>
                {/* Support Agent Avatar */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 p-0.5 shadow-md">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80" 
                      alt="Chuyên viên hỗ trợ" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Chat bubble visual */}
              <div className="hidden sm:flex flex-col bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-blue-100 shadow-xs text-[11px] text-blue-700 font-bold">
                <span>Hỗ trợ 24/7</span>
                <span className="text-[10px] text-slate-500 font-normal">Sẵn sàng giải đáp</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ROW OF 4 QUICK ACTION CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Gửi yêu cầu hỗ trợ */}
        <div 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-white rounded-2xl p-4 border border-slate-100 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Send className="w-5 h-5 -rotate-12 translate-x-0.5 -translate-y-0.5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                Gửi yêu cầu hỗ trợ
              </h3>
              <p className="text-slate-500 text-xs truncate mt-0.5">
                Phản ánh, kiến nghị, thắc mắc
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-blue-500 shrink-0 group-hover:translate-x-1 transition-transform ml-2" />
        </div>

        {/* Card 2: Câu hỏi thường gặp */}
        <div 
          onClick={() => setIsFaqModalOpen(true)}
          className="bg-white rounded-2xl p-4 border border-slate-100 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-purple-600 transition-colors">
                Câu hỏi thường gặp
              </h3>
              <p className="text-slate-500 text-xs truncate mt-0.5">
                Xem các câu hỏi và giải đáp
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-purple-500 shrink-0 group-hover:translate-x-1 transition-transform ml-2" />
        </div>

        {/* Card 3: Hướng dẫn sử dụng */}
        <div 
          onClick={() => setIsGuideModalOpen(true)}
          className="bg-white rounded-2xl p-4 border border-slate-100 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors">
                Hướng dẫn sử dụng
              </h3>
              <p className="text-slate-500 text-xs truncate mt-0.5">
                Xem hướng dẫn các chức năng
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-emerald-500 shrink-0 group-hover:translate-x-1 transition-transform ml-2" />
        </div>

        {/* Card 4: Liên hệ nhà trường */}
        <div 
          onClick={() => setIsContactModalOpen(true)}
          className="bg-white rounded-2xl p-4 border border-slate-100 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-amber-600 transition-colors">
                Liên hệ nhà trường
              </h3>
              <p className="text-slate-500 text-xs truncate mt-0.5">
                Thông tin liên hệ các phòng ban
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-500 shrink-0 group-hover:translate-x-1 transition-transform ml-2" />
        </div>
      </div>

      {/* MAIN CONTENT 2-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT COLUMN: Yêu cầu hỗ trợ của tôi (col-span-2) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-xs space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <FileText className="w-5 h-5 text-blue-600" />
              <h2>Yêu cầu hỗ trợ của tôi</h2>
            </div>
            <button
              onClick={() => setStatusFilter('all')}
              className="text-blue-600 hover:text-blue-700 text-xs font-semibold flex items-center gap-1 cursor-pointer hover:underline"
            >
              <span>Xem tất cả</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1 pb-1 border-b border-slate-100">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-[#1877F2] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              Tất cả ({counts.total})
            </button>

            <button
              onClick={() => setStatusFilter('processing')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'processing'
                  ? 'bg-[#1877F2] text-white shadow-xs font-bold'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>Đang xử lý ({counts.processing})</span>
            </button>

            <button
              onClick={() => setStatusFilter('resolved')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'resolved'
                  ? 'bg-[#1877F2] text-white shadow-xs font-bold'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span>Đã phản hồi ({counts.resolved})</span>
            </button>

            <button
              onClick={() => setStatusFilter('completed')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'completed'
                  ? 'bg-[#1877F2] text-white shadow-xs font-bold'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              <Check className="w-3.5 h-3.5 text-slate-400" />
              <span>Đã hoàn tất ({counts.completed})</span>
            </button>
          </div>

          {/* Ticket List */}
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs animate-pulse">
              Đang tải danh sách yêu cầu hỗ trợ...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs space-y-3">
              <p>Không có yêu cầu hỗ trợ nào trong danh mục này.</p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs"
              >
                Tạo yêu cầu mới ngay
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map(ticket => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="p-3.5 sm:p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-slate-50/60 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  {/* Left avatar & titles */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    {renderTicketAvatar(ticket)}
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors truncate">
                        {ticket.subject}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        Mã yêu cầu: <span className="font-semibold text-slate-600">{ticket.requestCode || 'HT0032'}</span>
                        <span className="mx-2">•</span>
                        <span>{formatTicketDate(ticket.createdAt)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Right badge & chevron */}
                  <div className="flex items-center gap-3 shrink-0">
                    {renderStatusBadge(ticket)}
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Thông tin liên hệ & Hotline (col-span-1) */}
        <div className="space-y-4">
          {/* Card 1: Thông tin liên hệ hỗ trợ */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Headphones className="w-4 h-4 text-blue-600" />
              <h3>Thông tin liên hệ hỗ trợ</h3>
            </div>

            <div className="space-y-3.5">
              {/* Phòng Giáo vụ */}
              <div className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-xs">Phòng Giáo vụ</h4>
                    <p className="text-slate-500 text-[11px] truncate">Hỗ trợ hồ sơ, lịch học, kiểm tra</p>
                  </div>
                </div>
                <button
                  onClick={() => handleCopyText('02553123456 - Nhánh 101', 'Số máy Phòng Giáo vụ')}
                  title="Gọi Phòng Giáo vụ (Nhánh 101)"
                  className="w-8 h-8 rounded-full bg-sky-50 hover:bg-sky-100 text-sky-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <Phone className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Phòng Kế toán */}
              <div className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-xs">Phòng Kế toán</h4>
                    <p className="text-slate-500 text-[11px] truncate">Hỗ trợ các khoản thu, thanh toán</p>
                  </div>
                </div>
                <button
                  onClick={() => handleCopyText('02553123456 - Nhánh 102', 'Số máy Phòng Kế toán')}
                  title="Gọi Phòng Kế toán (Nhánh 102)"
                  className="w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <Phone className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Phòng Công nghệ thông tin */}
              <div className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-xs">Phòng Công nghệ thông tin</h4>
                    <p className="text-slate-500 text-[11px] truncate">Hỗ trợ kỹ thuật và tài khoản hệ thống</p>
                  </div>
                </div>
                <button
                  onClick={() => handleCopyText('02553123456 - Nhánh 103', 'Số máy Phòng CNTT')}
                  title="Gọi Phòng CNTT (Nhánh 103)"
                  className="w-8 h-8 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <Phone className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Hotline & Giờ làm việc */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-xs flex items-center justify-between gap-4">
            {/* Hotline */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-slate-400 font-medium">Hotline hỗ trợ</div>
                <button
                  onClick={() => handleCopyText('0255 3 123 456', 'Hotline hỗ trợ')}
                  className="text-base sm:text-lg font-black text-[#1877F2] hover:underline tracking-tight cursor-pointer block truncate"
                  title="Nhấn để sao chép số Hotline"
                >
                  0255 3 123 456
                </button>
              </div>
            </div>

            {/* Vertical Separator */}
            <div className="h-10 w-px bg-slate-100 shrink-0" />

            {/* Working Hours */}
            <div className="text-right shrink-0">
              <div className="flex items-center justify-end gap-1 text-[11px] text-slate-400 font-medium">
                <Clock className="w-3 h-3 text-sky-500" />
                <span>Giờ làm việc</span>
              </div>
              <div className="text-xs font-bold text-slate-800 mt-0.5">
                Thứ 2 – Thứ 6
              </div>
              <div className="text-[10px] text-slate-400 font-medium">
                (7:00 – 17:00)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL 1: GỬI YÊU CẦU HỖ TRỢ MỚI                                */}
      {/* ============================================================ */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Soạn yêu cầu hỗ trợ mới</h3>
                  <p className="text-[11px] text-slate-500">Gửi thắc mắc, phản ánh đến nhà trường</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleCreateSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phòng ban tiếp nhận */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">
                    Phòng ban tiếp nhận <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="Phòng Giáo vụ">Phòng Giáo vụ (Lịch thi, Điểm, Hồ sơ)</option>
                    <option value="Phòng Kế toán">Phòng Kế toán (Học phí, Khoản thu)</option>
                    <option value="Phòng Công nghệ thông tin">Phòng CNTT (Tài khoản, Hệ thống)</option>
                    <option value="Ban Giám hiệu">Ban Giám hiệu nhà trường</option>
                    <option value="Đoàn Thanh niên">Đoàn Thanh niên / Đội cờ đỏ</option>
                  </select>
                </div>

                {/* Phân loại yêu cầu */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">
                    Loại yêu cầu <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formRequestType}
                    onChange={(e) => setFormRequestType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="exam">Lịch thi &amp; Kiểm tra định kỳ</option>
                    <option value="grades">Tra cứu điểm &amp; Xin phúc khảo</option>
                    <option value="fee">Học phí &amp; Khoản thu</option>
                    <option value="student_record">Hồ sơ cá nhân &amp; Giấy xác nhận</option>
                    <option value="technical">Lỗi phần mềm &amp; Đổi tài khoản</option>
                    <option value="other">Thắc mắc khác</option>
                  </select>
                </div>
              </div>

              {/* Mức độ ưu tiên */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Mức độ ưu tiên
                </label>
                <div className="flex gap-3">
                  <label className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-xl border cursor-pointer font-semibold transition-all ${
                    formPriority === 'normal'
                      ? 'border-blue-500 bg-blue-50/60 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>
                    <input 
                      type="radio" 
                      name="priority" 
                      checked={formPriority === 'normal'} 
                      onChange={() => setFormPriority('normal')}
                      className="hidden" 
                    />
                    <span>Bình thường (1 - 2 ngày)</span>
                  </label>

                  <label className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-xl border cursor-pointer font-semibold transition-all ${
                    formPriority === 'urgent'
                      ? 'border-amber-500 bg-amber-50/60 text-amber-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>
                    <input 
                      type="radio" 
                      name="priority" 
                      checked={formPriority === 'urgent'} 
                      onChange={() => setFormPriority('urgent')}
                      className="hidden" 
                    />
                    <span>Khẩn cấp (Trong ngày)</span>
                  </label>
                </div>
              </div>

              {/* Tiêu đề */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Tiêu đề yêu cầu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Đề nghị kiểm tra lại phòng thi môn Tiếng Anh khối 11"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              {/* Nội dung chi tiết */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Nội dung chi tiết <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Mô tả cụ thể nội dung thắc mắc, lý do hoặc chi tiết cần hỗ trợ..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 leading-relaxed"
                />
              </div>

              {/* Đính kèm tài liệu */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Tệp hoặc hình ảnh minh chứng (nếu có)
                </label>
                <div className="flex items-center gap-3">
                  <label className="px-3.5 py-2 border border-dashed border-slate-300 hover:border-blue-500 rounded-xl text-slate-600 hover:text-blue-600 flex items-center gap-2 cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/30">
                    <Paperclip className="w-4 h-4" />
                    <span>{attachedFile ? 'Thay đổi tệp' : 'Chọn tệp đính kèm'}</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setAttachedFile(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                  {attachedFile && (
                    <div className="flex items-center gap-2 text-[11px] text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-200 truncate">
                      <span className="truncate">{attachedFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setAttachedFile(null)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-semibold cursor-pointer transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#1877F2] hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-xs cursor-pointer transition-all disabled:opacity-60"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu ngay'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: CHI TIẾT YÊU CẦU & TRAO ĐỔI TICKET                   */}
      {/* ============================================================ */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                  {selectedTicket.requestCode || 'HT'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">
                      {selectedTicket.subject}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Mã: <span className="font-semibold text-slate-700">{selectedTicket.requestCode}</span>
                    <span className="mx-2">•</span>
                    Tiếp nhận: <span className="text-blue-600 font-semibold">{selectedTicket.department || 'Phòng Giáo vụ'}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Status bar */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-semibold">Trạng thái:</span>
                  {renderStatusBadge(selectedTicket)}
                </div>
                <div className="text-slate-400 text-[11px]">
                  Gửi lúc: {formatTicketDate(selectedTicket.createdAt)}
                </div>
              </div>

              {/* Student's Question / Description */}
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-2">
                <div className="flex items-center justify-between text-blue-900 font-bold">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span>Nội dung yêu cầu từ học sinh (Nguyễn Minh Anh - 11A1):</span>
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed text-xs">
                  {selectedTicket.description}
                </p>
                {selectedTicket.attachmentFileName && (
                  <div className="pt-2 flex items-center gap-2 text-[11px] text-blue-600">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Tệp đính kèm: {selectedTicket.attachmentFileName}</span>
                  </div>
                )}
              </div>

              {/* Official Response from School */}
              {selectedTicket.responseNote ? (
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between text-emerald-900 font-bold">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Phản hồi chính thức từ {selectedTicket.department || 'Nhà trường'}:</span>
                    </span>
                    {selectedTicket.decidedAt && (
                      <span className="text-[10px] text-emerald-700 font-normal">
                        {formatTicketDate(selectedTicket.decidedAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-emerald-950 leading-relaxed text-xs">
                    {selectedTicket.responseNote}
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-amber-800 text-xs flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Yêu cầu đang được cán bộ chuyên trách xem xét và xử lý. Thời gian phản hồi dự kiến từ 24 - 48 giờ làm việc.
                  </span>
                </div>
              )}

              {/* Reply section if student has further comments */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <label className="block text-slate-700 font-semibold">
                  Gửi thêm thắc mắc hoặc phản hồi tiếp theo:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Nhập nội dung nếu em cần giải đáp thêm..."
                    className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!replyText.trim()) return;
                      showToast('Đã gửi phản hồi tiếp theo vào tiến trình xử lý!');
                      setReplyText('');
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer transition-colors"
                  >
                    Gửi
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                THPT Nguyễn Trãi • Cổng Hỗ trợ Học sinh
              </span>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: CÂU HỎI THƯỜNG GẶP (FAQ)                             */}
      {/* ============================================================ */}
      {isFaqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50/60 to-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Câu hỏi thường gặp (FAQ)</h3>
                  <p className="text-[11px] text-slate-500">Giải đáp nhanh các thắc mắc phổ biến</p>
                </div>
              </div>
              <button
                onClick={() => setIsFaqModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 bg-slate-50/70 border-b border-slate-100 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm câu hỏi (ví dụ: phúc khảo, học phí, điểm danh, mật khẩu...)"
                  value={faqSearchQuery}
                  onChange={(e) => setFaqSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-purple-600"
                />
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'exam', label: 'Lịch thi & Kiểm tra' },
                  { id: 'fee', label: 'Khoản thu & Học phí' },
                  { id: 'academic', label: 'Điểm số & Điểm danh' },
                  { id: 'technical', label: 'Tài khoản & Phần mềm' },
                  { id: 'student_record', label: 'Hồ sơ học sinh' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setFaqCategoryFilter(cat.id)}
                    className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                      faqCategoryFilter === cat.id
                        ? 'bg-purple-600 text-white font-bold shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Accordion Questions */}
            <div className="p-6 overflow-y-auto space-y-3 text-xs">
              {filteredFaqs.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  Không tìm thấy câu hỏi phù hợp. Em có thể dùng nút "Gửi yêu cầu hỗ trợ" để nhà trường giải đáp trực tiếp!
                </div>
              ) : (
                filteredFaqs.map(faq => {
                  const isExpanded = expandedFaqId === faq.id;
                  return (
                    <div
                      key={faq.id}
                      className="border border-slate-200/90 rounded-xl overflow-hidden transition-all bg-white"
                    >
                      <button
                        onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                        className="w-full p-3.5 text-left font-bold text-slate-800 hover:text-purple-700 flex items-center justify-between gap-3 bg-white hover:bg-purple-50/30 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <HelpCircle className="w-4 h-4 text-purple-600 shrink-0" />
                          <span>{faq.question}</span>
                        </span>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180 text-purple-600' : ''}`} />
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-3.5 pt-1 text-slate-600 leading-relaxed border-t border-slate-100 bg-purple-50/20">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: HƯỚNG DẪN SỬ DỤNG (USER GUIDE)                       */}
      {/* ============================================================ */}
      {isGuideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/60 to-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Hướng dẫn sử dụng cổng SOMS</h3>
                  <p className="text-[11px] text-slate-500">Các bước thao tác chuẩn cho học sinh</p>
                </div>
              </div>
              <button
                onClick={() => setIsGuideModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Guide Tabs */}
            <div className="flex border-b border-slate-100 bg-slate-50/50 px-6 pt-2 gap-2 text-xs font-semibold">
              <button
                onClick={() => setActiveGuideTab('overview')}
                className={`pb-2.5 px-3 border-b-2 cursor-pointer transition-colors ${
                  activeGuideTab === 'overview'
                    ? 'border-emerald-600 text-emerald-700 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Tổng quan &amp; TKB
              </button>
              <button
                onClick={() => setActiveGuideTab('fees')}
                className={`pb-2.5 px-3 border-b-2 cursor-pointer transition-colors ${
                  activeGuideTab === 'fees'
                    ? 'border-emerald-600 text-emerald-700 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Nộp học phí VietQR
              </button>
              <button
                onClick={() => setActiveGuideTab('exams')}
                className={`pb-2.5 px-3 border-b-2 cursor-pointer transition-colors ${
                  activeGuideTab === 'exams'
                    ? 'border-emerald-600 text-emerald-700 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Lịch kiểm tra &amp; Điểm số
              </button>
              <button
                onClick={() => setActiveGuideTab('account')}
                className={`pb-2.5 px-3 border-b-2 cursor-pointer transition-colors ${
                  activeGuideTab === 'account'
                    ? 'border-emerald-600 text-emerald-700 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Hồ sơ &amp; Bảo mật
              </button>
            </div>

            {/* Guide Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-slate-700">
              {activeGuideTab === 'overview' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">Theo dõi Thời khóa biểu và Lịch học hàng ngày</h4>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Vào mục <strong>Thời khóa biểu</strong> trên thanh menu bên trái.</li>
                    <li>Lựa chọn xem theo <strong>Dạng tuần</strong> hoặc <strong>Hôm nay</strong>.</li>
                    <li>Hệ thống tự động hiển thị phòng học, giáo viên phụ trách từng tiết và bài học tương ứng.</li>
                  </ol>
                </div>
              )}

              {activeGuideTab === 'fees' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">Hướng dẫn thanh toán học phí qua mã VietQR chuẩn 24/7</h4>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Truy cập mục <strong>Khoản thu</strong> trên thanh điều hướng.</li>
                    <li>Bấm nút <strong>Thanh toán</strong> tại khoản phí cần nộp.</li>
                    <li>Mở ứng dụng Ngân hàng (Vietcombank, MB, Techcombank...) hoặc ví điện tử (MoMo, ZaloPay) và quét mã VietQR tự động.</li>
                    <li>Không chỉnh sửa nội dung chuyển khoản để hệ thống tự động gạch nợ tức thời.</li>
                    <li>Sau khi hoàn tất, bấm vào khoản thu để xem và tải về <strong>Biên lai điện tử</strong>.</li>
                  </ol>
                </div>
              )}

              {activeGuideTab === 'exams' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">Tra cứu Lịch kiểm tra &amp; Xem Kết quả học tập</h4>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Vào mục <strong>Lịch kiểm tra</strong> để xem thời gian, phòng thi và hình thức của từng bài kiểm tra.</li>
                    <li>Đồng hồ đếm ngược sẽ hiển thị thời gian còn lại đến môn kiểm tra tiếp theo.</li>
                    <li>Vào mục <strong>Kết quả học tập</strong> để xem bảng điểm chi tiết các môn học (điểm miệng, 15 phút, giữa kỳ, cuối kỳ) và điểm trung bình tích lũy (GPA).</li>
                  </ol>
                </div>
              )}

              {activeGuideTab === 'account' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">Cập nhật hồ sơ &amp; Bảo mật tài khoản</h4>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Vào mục <strong>Hồ sơ học sinh</strong> để xem thông tin cá nhân, phụ huynh và tiến trình học tập.</li>
                    <li>Để đính chính thông tin CCCD hoặc số điện thoại, bấm nút <strong>Cập nhật thông tin</strong> để gửi yêu cầu phê duyệt đến Phòng Giáo vụ.</li>
                    <li>Đổi mật khẩu định kỳ tại tab <strong>Bảo mật &amp; Tài khoản</strong> để đảm bảo an toàn thông tin.</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 5: LIÊN HỆ NHÀ TRƯỜNG                                   */}
      {/* ============================================================ */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50/60 to-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Danh bạ liên hệ nhà trường</h3>
                  <p className="text-[11px] text-slate-500">Trường THPT Nguyễn Trãi</p>
                </div>
              </div>
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Tổng đài chính */}
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between">
                <div>
                  <span className="text-blue-600 font-semibold text-[11px]">Tổng đài hỗ trợ chính</span>
                  <div className="text-lg font-black text-blue-900">0255 3 123 456</div>
                  <span className="text-slate-500 text-[10px]">Thứ 2 – Thứ 6 (7:00 – 17:00)</span>
                </div>
                <button
                  onClick={() => handleCopyText('0255 3 123 456', 'Tổng đài')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao chép</span>
                </button>
              </div>

              {/* Các phòng ban */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900">Số máy nhánh các bộ phận:</h4>

                <div className="p-3 rounded-xl border border-slate-100 hover:bg-slate-50 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">Phòng Giáo vụ (Phòng A102)</div>
                    <div className="text-slate-500 text-[11px]">Máy nhánh 101 • Email: giaovu@thptnguyentrai.edu.vn</div>
                  </div>
                  <button
                    onClick={() => handleCopyText('02553123456,101', 'Phòng Giáo vụ')}
                    className="p-2 text-slate-400 hover:text-blue-600"
                    title="Sao chép số"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 rounded-xl border border-slate-100 hover:bg-slate-50 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">Phòng Kế toán (Phòng A105)</div>
                    <div className="text-slate-500 text-[11px]">Máy nhánh 102 • Email: ketoan@thptnguyentrai.edu.vn</div>
                  </div>
                  <button
                    onClick={() => handleCopyText('02553123456,102', 'Phòng Kế toán')}
                    className="p-2 text-slate-400 hover:text-blue-600"
                    title="Sao chép số"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 rounded-xl border border-slate-100 hover:bg-slate-50 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">Phòng Công nghệ thông tin (Phòng B204)</div>
                    <div className="text-slate-500 text-[11px]">Máy nhánh 103 • Email: cntt@thptnguyentrai.edu.vn</div>
                  </div>
                  <button
                    onClick={() => handleCopyText('02553123456,103', 'Phòng CNTT')}
                    className="p-2 text-slate-400 hover:text-blue-600"
                    title="Sao chép số"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 rounded-xl border border-slate-100 hover:bg-slate-50 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">Văn phòng Đoàn trường (Phòng C101)</div>
                    <div className="text-slate-500 text-[11px]">Máy nhánh 104 • Email: doantruong@thptnguyentrai.edu.vn</div>
                  </div>
                  <button
                    onClick={() => handleCopyText('02553123456,104', 'Đoàn trường')}
                    className="p-2 text-slate-400 hover:text-blue-600"
                    title="Sao chép số"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Địa chỉ trường */}
              <div className="p-3 rounded-xl bg-slate-50 text-slate-600 text-[11px] space-y-1">
                <div className="font-bold text-slate-800">Địa chỉ trường:</div>
                <div>Số 123 Đường Nguyễn Trãi, Phường Nghĩa Lộ, TP. Quảng Ngãi</div>
                <div>Website: https://thptnguyentrai.edu.vn</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};