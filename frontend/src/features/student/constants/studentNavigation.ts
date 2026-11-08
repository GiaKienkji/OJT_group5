import {
  Home,
  UserCheck,
  Calendar,
  Clock,
  BarChart2,
  CalendarCheck,
  Megaphone,
  Wallet,
  HelpCircle,
  LucideIcon
} from 'lucide-react';

export interface StudentNavItem {
  id: string;
  title: string;
  route: string;
  icon: LucideIcon;
  badge?: string;
  hasNotificationDot?: boolean;
  description: string;
}

export const STUDENT_NAV_ITEMS: StudentNavItem[] = [
  {
    id: 'dashboard',
    title: 'Tổng quan',
    route: '/student/dashboard',
    icon: Home,
    description: 'Bảng thông tin học tập tổng hợp'
  },
  {
    id: 'profile',
    title: 'Hồ sơ học sinh',
    route: '/student/profile',
    icon: UserCheck,
    description: 'Thông tin cá nhân, lớp học và GVCN'
  },
  {
    id: 'timetable',
    title: 'Thời khóa biểu',
    route: '/student/timetable',
    icon: Calendar,
    description: 'Lịch học các môn trong tuần'
  },
  {
    id: 'attendance',
    title: 'Chuyên cần',
    route: '/student/attendance',
    icon: Clock,
    description: 'Tỷ lệ điểm danh và số buổi học'
  },
  {
    id: 'grades',
    title: 'Kết quả học tập',
    route: '/student/grades',
    icon: BarChart2,
    description: 'Điểm số kiểm tra và học lực'
  },
  {
    id: 'exams',
    title: 'Lịch kiểm tra',
    route: '/student/exams',
    icon: CalendarCheck,
    description: 'Lịch thi định kỳ và cuối kỳ'
  },
  {
    id: 'announcements',
    title: 'Thông báo',
    route: '/student/announcements',
    icon: Megaphone,
    badge: '3',
    description: 'Thông báo từ trường và giáo viên'
  },
  {
    id: 'fees',
    title: 'Khoản thu',
    route: '/student/fees',
    icon: Wallet,
    description: 'Học phí và các khoản đóng góp'
  },
  {
    id: 'support',
    title: 'Hỗ trợ',
    route: '/student/support',
    icon: HelpCircle,
    description: 'Gửi thắc mắc điểm số và yêu cầu trợ giúp'
  }
];

export const getNavItemByRoute = (route: string): StudentNavItem => {
  const normalized = route.toLowerCase().split('?')[0];
  const found = STUDENT_NAV_ITEMS.find(item => item.route.toLowerCase() === normalized);
  return found || STUDENT_NAV_ITEMS[0];
};
