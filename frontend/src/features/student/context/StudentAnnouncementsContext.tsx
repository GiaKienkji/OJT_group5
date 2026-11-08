import React, { createContext, useContext, useState, useEffect } from 'react';
import { AnnouncementItem } from '../types/student.types';
import { studentApi } from '../services/studentApi';

interface StudentAnnouncementsContextType {
  announcements: AnnouncementItem[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  toggleBookmark: (id: string) => void;
  isLoading: boolean;
}

const StudentAnnouncementsContext = createContext<StudentAnnouncementsContextType | undefined>(undefined);

export const INITIAL_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: 'ann-01',
    title: 'Lịch kiểm tra giữa kỳ I đã được cập nhật',
    body: 'Nhà trường thông báo lịch kiểm tra giữa kỳ I năm học 2025 – 2026 cho toàn thể học sinh khối 11. Các em theo dõi ca thi và phòng thi chi tiết.',
    audience: 'grade_11',
    publishedAt: '2026-11-08T14:26:00',
    publishedDateFormatted: '08/11/2026',
    publishedTimeFormatted: '14:26',
    authorName: 'Phòng Giáo vụ',
    category: 'exam',
    categoryNameVi: 'Kiểm tra – Thi',
    isImportant: true,
    isRead: false,
    isBookmarked: false,
    viewsCount: 112,
    salutation: 'Kính gửi: Toàn thể học sinh khối 11,',
    intro: 'Nhà trường thông báo lịch kiểm tra giữa kỳ I năm học 2025 – 2026 như sau:',
    tableRows: [
      { col1: 'Ngữ văn', col2: 'Thứ Hai, 17/11/2025', col3: '90 phút', col4: 'Tự luận' },
      { col1: 'Toán', col2: 'Thứ Ba, 18/11/2025', col3: '90 phút', col4: 'Tự luận' },
      { col1: 'Tiếng Anh', col2: 'Thứ Tư, 19/11/2025', col3: '60 phút', col4: 'Trắc nghiệm + Tự luận' },
      { col1: 'Vật lý', col2: 'Thứ Năm, 20/11/2025', col3: '60 phút', col4: 'Trắc nghiệm' },
      { col1: 'Hóa học', col2: 'Thứ Sáu, 21/11/2025', col3: '60 phút', col4: 'Trắc nghiệm + Tự luận' }
    ],
    notes: [
      'Học sinh có mặt tại phòng kiểm tra trước 15 phút.',
      'Mang theo đầy đủ dụng cụ học tập theo quy định.',
      'Tuân thủ nghiêm túc nội quy và quy chế kiểm tra của nhà trường.'
    ],
    attachments: [
      { fileName: 'Lich_kiem_tra_Giua_ky_I_2025-2026.pdf', fileSize: '1.2 MB', fileType: 'pdf' }
    ]
  },
  {
    id: 'ann-02',
    title: 'Kế hoạch hoạt động ngoại khóa tháng 11',
    body: 'Đoàn trường tổ chức chuỗi hoạt động văn nghệ, thể thao và thi đua hoa điểm 10 chào mừng Ngày Nhà giáo Việt Nam 20/11.',
    audience: 'school',
    publishedAt: '2026-11-07T09:15:00',
    publishedDateFormatted: '07/11/2026',
    publishedTimeFormatted: '09:15',
    authorName: 'Đoàn trường',
    category: 'activity',
    categoryNameVi: 'Hoạt động',
    isImportant: true,
    isRead: false,
    isBookmarked: false,
    viewsCount: 245,
    salutation: 'Kính gửi: Toàn thể đoàn viên, thanh niên và học sinh các chi đoàn,',
    intro: 'Đoàn trường THPT Nguyễn Trãi ban hành kế hoạch tổ chức chuỗi hoạt động ngoại khóa tháng 11:',
    tableRows: [
      { col1: 'Thi đua Hoa điểm 10', col2: '01/11 – 18/11/2026', col3: 'Toàn trường', col4: 'Cá nhân & Lớp' },
      { col1: 'Hội diễn Văn nghệ Tri ân', col2: 'Thứ Sáu, 14/11/2026', col3: '14:00 – 17:00', col4: 'Hội trường A' },
      { col1: 'Giải Bóng đá mini nam nữ', col2: 'Thứ Bảy, 15/11/2026', col3: '07:30 – 11:30', col4: 'Sân trường' },
      { col1: 'Thi Tập san & Báo tường', col2: 'Hạn nộp 17/11/2026', col3: 'Văn phòng Đoàn', col4: 'Tập thể lớp' }
    ],
    notes: [
      'Bí thư chi đoàn hoàn thiện danh sách đăng ký văn nghệ trước 17h00 ngày 10/11.',
      'Trang phục thi đấu thể thao đúng điều lệ ban tổ chức giải.',
      'Cổ vũ nhiệt tình, văn minh, đảm bảo vệ sinh môi trường sau mỗi sự kiện.'
    ],
    attachments: [
      { fileName: 'Ke_hoach_ngoai_khoa_Thang_11_2026.pdf', fileSize: '2.4 MB', fileType: 'pdf' }
    ]
  },
  {
    id: 'ann-03',
    title: 'Hướng dẫn nộp học phí học kỳ II',
    body: 'Phòng Kế toán thông báo hướng dẫn phụ huynh và học sinh hoàn tất nghĩa vụ học phí và các khoản thu học kỳ II qua ứng dụng số.',
    audience: 'school',
    publishedAt: '2026-11-06T08:30:00',
    publishedDateFormatted: '06/11/2026',
    publishedTimeFormatted: '08:30',
    authorName: 'Phòng Kế toán',
    category: 'important',
    categoryNameVi: 'Quan trọng',
    isImportant: true,
    isRead: false,
    isBookmarked: false,
    viewsCount: 420,
    salutation: 'Kính gửi: Quý Phụ huynh và các em Học sinh toàn trường,',
    intro: 'Phòng Kế toán nhà trường thông báo kế hoạch và danh mục thu nộp học phí học kỳ II năm học 2025 – 2026:',
    tableRows: [
      { col1: 'Học phí chính khóa', col2: 'Học kỳ II', col3: '1.800.000 đ', col4: 'Đến hết 25/11/2026' },
      { col1: 'Bảo hiểm Y tế học sinh', col2: 'Bắt buộc 12 tháng', col3: '680.000 đ', col4: 'Đến hết 20/11/2026' },
      { col1: 'Tiền học phẩm chuyên đề', col2: 'Cả năm', col3: '350.000 đ', col4: 'Đến hết 25/11/2026' },
      { col1: 'Quỹ phụ huynh học sinh', col2: 'Tự nguyện', col3: '200.000 đ', col4: 'Đến hết 30/11/2026' }
    ],
    notes: [
      'Phụ huynh thanh toán trực tiếp qua chuyển khoản hoặc ứng dụng SOMS Pay.',
      'Nội dung chuyển khoản: [Mã HS] [Họ và tên] [Lớp] (VD: HS230145 Nguyen Minh Anh 11A1).',
      'Hệ thống sẽ tự động gạch nợ và cấp biên lai điện tử trong vòng 24 giờ sau khi nhận thanh toán.'
    ],
    attachments: [
      { fileName: 'Huong_dan_nop_hoc_phi_HK2_2025-2026.pdf', fileSize: '950 KB', fileType: 'pdf' }
    ]
  },
  {
    id: 'ann-04',
    title: 'Thông báo đăng ký câu lạc bộ học thuật',
    body: 'Nhà trường mở cổng đăng ký tham gia các Câu lạc bộ chuyên môn học thuật: STEM, Tin học trẻ, Tiếng Anh tranh biện và Thiên văn.',
    audience: 'school',
    publishedAt: '2026-11-04T15:45:00',
    publishedDateFormatted: '04/11/2026',
    publishedTimeFormatted: '15:45',
    authorName: 'Phòng Giáo vụ',
    category: 'study',
    categoryNameVi: 'Học tập',
    isImportant: false,
    isRead: true,
    isBookmarked: false,
    viewsCount: 180,
    salutation: 'Kính gửi: Các em học sinh yêu thích nghiên cứu khoa học và học thuật,',
    intro: 'Nhà trường mở đơn đăng ký tuyển thành viên các câu lạc bộ học thuật năm học 2025 – 2026:',
    tableRows: [
      { col1: 'CLB STEM & Robotics', col2: 'Thứ Ba & Thứ Năm', col3: '16:30 – 18:00', col4: 'Phòng Lab Tin học B201' },
      { col1: 'CLB Tiếng Anh (NEC)', col2: 'Thứ Tư & Thứ Bảy', col3: '15:30 – 17:00', col4: 'Phòng Ngoại ngữ A105' },
      { col1: 'CLB Thiên văn & Vật lý', col2: 'Thứ Sáu', col3: '17:00 – 18:30', col4: 'Sân thượng Dãy B' },
      { col1: 'CLB Báo chí & Văn học', col2: 'Sáng Thứ Bảy', col3: '08:30 – 10:30', col4: 'Thư viện Trường' }
    ],
    notes: [
      'Mỗi học sinh được đăng ký tối đa 2 câu lạc bộ để đảm bảo lịch học chính khóa.',
      'Thời hạn đóng cổng đăng ký trực tuyến: 23h59 ngày 10/11/2026.',
      'Lịch phỏng vấn thành viên mới sẽ được gửi về email học sinh vào ngày 12/11/2026.'
    ],
    attachments: [
      { fileName: 'Don_dang_ky_thanh_vien_CLB_2026.docx', fileSize: '340 KB', fileType: 'docx' }
    ]
  },
  {
    id: 'ann-05',
    title: 'Kết quả cuộc thi Khoa học kỹ thuật',
    body: 'Hội đồng Ban Giám khảo Cuộc thi Sáng tạo KHKT cấp trường công bố danh sách các dự án xuất sắc đạt giải cao.',
    audience: 'school',
    publishedAt: '2026-11-02T10:00:00',
    publishedDateFormatted: '02/11/2026',
    publishedTimeFormatted: '10:00',
    authorName: 'Ban Thi đua – Khen thưởng',
    category: 'study',
    categoryNameVi: 'Học tập',
    isImportant: false,
    isRead: true,
    isBookmarked: false,
    viewsCount: 310,
    salutation: 'Nhiệt liệt biểu dương tinh thần nghiên cứu sáng tạo của các em học sinh!',
    intro: 'Hội đồng Ban Giám khảo Cuộc thi Sáng tạo Khoa học Kỹ thuật trường THPT Nguyễn Trãi thông báo kết quả chính thức:',
    tableRows: [
      { col1: 'Giải Nhất', col2: 'Thiết bị lọc nước thông minh IoT', col3: 'Nhóm 11A1 (Minh Anh, Tuấn Kiệt)', col4: 'Cô Lê Thị Mai HD' },
      { col1: 'Giải Nhì', col2: 'Ứng dụng AI phân loại rác thải', col3: 'Nhóm 11A3 (Quốc Bảo, Hà My)', col4: 'Thầy Bùi Hoàng Long HD' },
      { col1: 'Giải Ba', col2: 'Mô hình thủy canh tuần hoàn', col3: 'Nhóm 10A2 (Đức Minh, Bảo Châu)', col4: 'Cô Nguyễn Mai Trang HD' },
      { col1: 'Khuyến khích', col2: 'Hệ thống cảnh báo cháy sớm', col3: 'Nhóm 12A1 (Gia Huy, Thùy Linh)', col4: 'Thầy Lê Viết Nam HD' }
    ],
    notes: [
      'Lễ trao giải sẽ được tổ chức trọng thể tại buổi Lễ Chào cờ đầu tuần ngày 10/11/2026.',
      'Dự án đạt Giải Nhất và Giải Nhì sẽ được nhà trường cấp kinh phí hoàn thiện để tham gia Hội thi cấp Thành phố.'
    ],
    attachments: [
      { fileName: 'Quyet_dinh_khen_thuong_KHKT_2026.pdf', fileSize: '1.5 MB', fileType: 'pdf' }
    ]
  },
  // Items 6 - 24: Tất cả đều có isRead: true để đồng nhất chính xác 3 thông báo chưa đọc!
  ...Array.from({ length: 19 }, (_, idx) => {
    const i = idx + 6;
    const cat = i === 6 || i === 7 ? 'important' : i <= 10 ? 'exam' : i <= 14 ? 'study' : i <= 18 ? 'activity' : 'union';
    const catName = cat === 'important' ? 'Quan trọng' : cat === 'exam' ? 'Kiểm tra – Thi' : cat === 'study' ? 'Học tập' : cat === 'activity' ? 'Hoạt động' : 'Đoàn – Đội';
    const titles = [
      'Lịch thi thử Tốt nghiệp THPT đợt 1 dành cho khối 12',
      'Đăng ký tham gia Kỳ thi Học sinh giỏi các môn văn hóa cấp cụm',
      'Phát động phong trào Nuôi heo đất giúp bạn vượt khó',
      'Kế hoạch kiểm tra sức khỏe và khám thị lực định kỳ học kỳ I',
      'Tập huấn kỹ năng PCCC và kỹ năng thoát hiểm học đường',
      'Lễ trao học bổng Khuyến học Nguyễn Trãi dành cho học sinh nghèo vượt khó',
      'Quy định sử dụng điện thoại và thiết bị công nghệ trong lớp học',
      'Lịch mở cửa phòng tự học buổi tối và phòng đọc sách thư viện',
      'Thông báo kết quả vòng sơ khảo Cuộc thi Hùng biện Tiếng Anh',
      'Kế hoạch giao lưu thể thao chào mừng ngày 26/03 với trường bạn',
      'Lịch sinh hoạt chuyên đề Kỹ năng quản lý thời gian và phương pháp tự học',
      'Đăng ký mượn tài liệu ôn tập và đề thi minh họa THPT Quốc gia',
      'Thông báo lịch thi chứng chỉ Nghề phổ thông khóa 2024 – 2026',
      'Kế hoạch tổng dọn vệ sinh khuôn viên trường lớp và trồng cây xanh',
      'Thông báo bình xét Đoàn viên ưu tú và Cán bộ Đoàn xuất sắc quý IV',
      'Phổ biến quy chế tuyển sinh Đại học và thi đánh giá năng lực ĐHQG',
      'Khai mạc Triển lãm tranh Sắc màu tri ân thầy cô giáo',
      'Lịch thi bù học kỳ I dành cho học sinh có lý do chính đáng',
      'Thông báo bình xét thi đua khen thưởng đợt 1 năm học 2025 – 2026'
    ];

    return {
      id: `ann-${i < 10 ? '0' + i : i}`,
      title: titles[idx] || `Thông báo số ${i} về hoạt động giáo dục nhà trường`,
      body: `Ban Giám hiệu nhà trường thông báo kế hoạch triển khai: ${titles[idx] || `hoạt động số ${i}`}. Yêu cầu các lớp và học sinh chú ý theo dõi.`,
      audience: 'school',
      publishedAt: `2026-10-${Math.max(1, 30 - idx)}T08:00:00`,
      publishedDateFormatted: `${Math.max(1, 30 - idx) < 10 ? '0' + Math.max(1, 30 - idx) : Math.max(1, 30 - idx)}/10/2026`,
      publishedTimeFormatted: '08:00',
      authorName: cat === 'union' ? 'Đoàn trường' : cat === 'exam' ? 'Phòng Giáo vụ' : cat === 'important' ? 'Ban Giám hiệu' : 'Ban Thi đua – Khen thưởng',
      category: cat,
      categoryNameVi: catName,
      isImportant: cat === 'important' || i === 6,
      isRead: true, // Đã đọc để đảm bảo đúng 3 thông báo chưa đọc!
      isBookmarked: false,
      viewsCount: 65 + i * 15,
      salutation: 'Kính gửi: Toàn thể giáo viên, cán bộ và học sinh trường THPT Nguyễn Trãi,',
      intro: `Ban Giám hiệu nhà trường thông báo chi tiết về ${titles[idx] || 'nội dung trên'} như sau:`,
      tableRows: [
        { col1: 'Hạng mục 1', col2: 'Theo tiến độ', col3: 'Đúng quy định', col4: 'Nghiêm túc' },
        { col1: 'Hạng mục 2', col2: 'Tại trường', col3: 'Đầy đủ', col4: 'Hiệu quả' }
      ],
      notes: [
        'Đề nghị cán sự các lớp và học sinh chú ý triển khai đúng thời gian quy định.',
        'Mọi vướng mắc xin liên hệ văn phòng nhà trường để được giải đáp kịp thời.'
      ],
      attachments: [
        { fileName: `Ke_hoach_chi_tiet_so_${i}.pdf`, fileSize: '1.1 MB', fileType: 'pdf' }
      ]
    };
  })
];

export const StudentAnnouncementsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(() => {
    try {
      const saved = localStorage.getItem('soms_student_announcements');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return INITIAL_ANNOUNCEMENTS;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('soms_student_announcements', JSON.stringify(announcements));
    } catch {
      // Ignore storage errors
    }
  }, [announcements]);

  // Load from API in background and merge
  useEffect(() => {
    let isMounted = true;
    const fetchApi = async () => {
      try {
        setIsLoading(true);
        const data = await studentApi.getAnnouncements();
        if (isMounted && data && data.length > 0) {
          setAnnouncements((prev) => {
            const merged = [...prev];
            data.forEach((apiItem: AnnouncementItem) => {
              const idx = merged.findIndex((m) => m.id === apiItem.id || m.title === apiItem.title);
              if (idx !== -1) {
                merged[idx] = { ...merged[idx], ...apiItem, isRead: merged[idx].isRead };
              } else {
                merged.unshift(apiItem);
              }
            });
            return merged;
          });
        }
      } catch {
        // Local dataset already works
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchApi();
    return () => {
      isMounted = false;
    };
  }, []);

  const unreadCount = announcements.filter((a) => !a.isRead).length;

  const markAsRead = async (id: string) => {
    setAnnouncements((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    );
    try {
      await studentApi.markAnnouncementAsRead(id);
    } catch {
      // Ignore background error
    }
  };

  const markAllAsRead = async () => {
    setAnnouncements((prev) => prev.map((item) => ({ ...item, isRead: true })));
  };

  const toggleBookmark = (id: string) => {
    setAnnouncements((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isBookmarked: !item.isBookmarked } : item))
    );
  };

  return (
    <StudentAnnouncementsContext.Provider
      value={{
        announcements,
        unreadCount,
        markAsRead,
        markAllAsRead,
        toggleBookmark,
        isLoading
      }}
    >
      {children}
    </StudentAnnouncementsContext.Provider>
  );
};

export const useStudentAnnouncements = () => {
  const context = useContext(StudentAnnouncementsContext);
  if (!context) {
    throw new Error('useStudentAnnouncements must be used within a StudentAnnouncementsProvider');
  }
  return context;
};
