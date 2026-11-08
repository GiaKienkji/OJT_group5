import React, { useState } from 'react';
import { useStudentProfile } from '../hooks/useStudentProfile';
import { studentApi } from '../services/studentApi';
import {
  IdCard,
  Users,
  Calendar,
  Edit3,
  Download,
  User,
  GraduationCap,
  History,
  Award,
  FileText,
  ShieldCheck,
  FileEdit,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  X,
  Plus,
  Lock,
  Printer,
  HeartPulse,
  Eye,
  KeyRound
} from 'lucide-react';
import { CreateProfileUpdateRequestPayload } from '../types/student.types';

export const StudentProfilePage: React.FC = () => {
  const { profile, isLoading, refetch } = useStudentProfile();

  // Active section tab
  const [activeTab, setActiveTab] = useState<string>('personal');

  // Modals state
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Form states for update request
  const [requestCategory, setRequestCategory] = useState('phone');
  const [requestContent, setRequestContent] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestSuccessMsg, setRequestSuccessMsg] = useState<string | null>(null);

  // Form states for password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Quick edit contact inline
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [contactPhone, setContactPhone] = useState(profile?.phone || '0987 654 321');
  const [contactAddress, setContactAddress] = useState(profile?.contactAddress || 'Số 36, ngõ 105 đường Nguyễn Trãi, P. Thanh Xuân, TP. Hà Nội');
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [contactSaveSuccess, setContactSaveSuccess] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 bg-white rounded-3xl border border-slate-100" />
        <div className="h-14 bg-white rounded-2xl border border-slate-100" />
        <div className="h-96 bg-white rounded-3xl border border-slate-100" />
      </div>
    );
  }

  // Handle submit update request
  const handleCreateUpdateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestContent.trim()) {
      alert('Vui lòng nhập nội dung đề xuất cập nhật.');
      return;
    }

    setIsSubmittingRequest(true);
    try {
      const payload: CreateProfileUpdateRequestPayload = {
        requestCategory,
        requestContent,
        reason: requestReason
      };
      await studentApi.submitProfileUpdateRequest(payload);
      setRequestSuccessMsg('Yêu cầu cập nhật hồ sơ đã được gửi thành công đến Phòng Giáo vụ!');
      setRequestContent('');
      setRequestReason('');
      await refetch();
      setTimeout(() => {
        setIsUpdateModalOpen(false);
        setRequestSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Không thể gửi yêu cầu cập nhật.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // Handle password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Xác nhận mật khẩu mới không khớp.');
      return;
    }

    try {
      await studentApi.changePassword({ currentPassword, newPassword });
      setPasswordSuccess('Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordSuccess(null);
      }, 1500);
    } catch (err: any) {
      setPasswordError(err.message || 'Không thể đổi mật khẩu.');
    }
  };

  // Handle save contact inline
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingContact(true);
    try {
      await studentApi.updateContact({
        phone: contactPhone,
        contactAddress: contactAddress
      });
      setContactSaveSuccess(true);
      setIsEditingContact(false);
      await refetch();
      setTimeout(() => setContactSaveSuccess(false), 3000);
    } catch (err) {
      alert('Không thể lưu thông tin liên hệ.');
    } finally {
      setIsSavingContact(false);
    }
  };

  // Navigation tabs configuration
  const tabs = [
    { id: 'personal', label: 'Thông tin cá nhân & Y tế', icon: User },
    { id: 'academic', label: 'Học tập hiện tại', icon: GraduationCap },
    { id: 'guardians', label: 'Phụ huynh & Giám hộ', icon: Users },
    { id: 'history', label: 'Lịch sử học tập', icon: History },
    { id: 'awards', label: 'Khen thưởng & Kỷ luật', icon: Award },
    { id: 'documents', label: 'Hồ sơ & Tài liệu', icon: FileText },
    { id: 'security', label: 'Tài khoản & Bảo mật', icon: ShieldCheck },
    { id: 'requests', label: 'Yêu cầu cập nhật', icon: FileEdit, badge: profile?.updateRequests?.length }
  ];

  const fullName = profile?.fullName || 'Nguyễn Minh Anh';
  const studentCode = profile?.studentCode || 'HS230145';
  const className = profile?.className || '11A1';
  const academicYear = profile?.academicYear || '2025 – 2026';
  const schoolName = profile?.schoolName || 'Trường THPT Nguyễn Trãi';
  const avatarUrl = profile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face';

  return (
    <div className="space-y-6">
      {/* 1. Header Page Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <User className="w-6 h-6 text-blue-600" />
            <span>Hồ sơ học sinh</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Thông tin cá nhân, quá trình học tập và hồ sơ giáo dục chính thức của học sinh
          </p>
        </div>
      </div>

      {/* 2. Hero Identity Card (bám sát bố cục ảnh) */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
        {/* School campus photo background with gradient blend */}
        <div className="absolute inset-y-0 right-0 w-full sm:w-3/5 lg:w-1/2 pointer-events-none select-none overflow-hidden">
          <div
            className="w-full h-full bg-cover bg-right bg-no-repeat transition-transform duration-700 hover:scale-105"
            style={{
              backgroundImage: "url('/assets/clean-school-bg.jpg')",
              backgroundPosition: "right 20% center"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 via-30% to-transparent" />
        </div>

        {/* Content of Hero Card */}
        <div className="relative z-10 p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
            {/* Avatar Circle */}
            <div className="relative group shrink-0">
              <img
                src={avatarUrl}
                alt={fullName}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-4 ring-white shadow-md"
              />
            </div>

            {/* Name, Status, Badges */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {fullName}
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>{profile?.status || 'Đang học'}</span>
                </span>
              </div>

              {/* 3 Inline Badges matching screenshot */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/90 text-xs font-semibold text-slate-700 border border-slate-200/60">
                  <IdCard className="w-3.5 h-3.5 text-slate-500" />
                  <span>Mã HS: <strong className="font-mono text-slate-900">{studentCode}</strong></span>
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/90 text-xs font-semibold text-slate-700 border border-slate-200/60">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>Lớp: <strong className="text-blue-700">{className}</strong></span>
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/90 text-xs font-semibold text-slate-700 border border-slate-200/60">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Niên khóa: <strong className="text-slate-900">{academicYear}</strong></span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons on Hero Banner matching screenshot */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            <button
              onClick={() => setIsUpdateModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Yêu cầu cập nhật thông tin</span>
            </button>

            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Tải hồ sơ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contact Save Success Alert */}
      {contactSaveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2.5 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Thông tin liên hệ của học sinh đã được cập nhật thành công vào hệ thống.</span>
        </div>
      )}

      {/* 3. Segmented Tab Navigation Bar (Chia thành từng phần, không dồn thành 1 trang) */}
      <div className="bg-white rounded-2xl p-2 border border-slate-100 shadow-xs flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. Tab Content Views */}
      <div className="transition-all">
        {/* ================= TAB 1: THÔNG TIN CÁ NHÂN & ĐỊNH DANH ================= */}
        {activeTab === 'personal' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Box 1: Thông tin định danh cơ bản */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    <span>Thông tin nhân thân &amp; Định danh</span>
                  </h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                    Chính thức
                  </span>
                </div>

                <div className="divide-y divide-slate-100 text-xs sm:text-sm">
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Họ và tên</span>
                    <span className="font-bold text-slate-900">{fullName}</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Ngày sinh</span>
                    <span className="font-bold text-slate-900">
                      {profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('vi-VN') : '15/08/2008'}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Giới tính</span>
                    <span className="font-bold text-slate-900">{profile?.gender || 'Nữ'}</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Nơi sinh</span>
                    <span className="font-bold text-slate-900">{profile?.birthPlace || 'Hà Nội'}</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">CCCD / Mã định danh</span>
                    <span className="font-mono font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
                      {profile?.nationalId || '001308012345'}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Dân tộc</span>
                    <span className="font-bold text-slate-900">{profile?.ethnicity || 'Kinh'}</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Tôn giáo</span>
                    <span className="font-bold text-slate-900">{profile?.religion || 'Không'}</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Quốc tịch</span>
                    <span className="font-bold text-slate-900">{profile?.nationality || 'Việt Nam'}</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Đoàn thể</span>
                    <span className="font-semibold text-blue-700">{profile?.unionMember || 'Đoàn viên TNCS Hồ Chí Minh'}</span>
                  </div>
                </div>
              </div>

              {/* Box 2: Địa chỉ & Liên lạc */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      <span>Địa chỉ cư trú &amp; Liên lạc</span>
                    </h3>
                    <button
                      onClick={() => setIsEditingContact(!isEditingContact)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                    >
                      {isEditingContact ? 'Hủy' : 'Chỉnh sửa nhanh'}
                    </button>
                  </div>

                  {isEditingContact ? (
                    <form onSubmit={handleSaveContact} className="space-y-4 pt-2">
                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">Số điện thoại liên lạc</label>
                        <input
                          type="text"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">Địa chỉ liên hệ hiện tại</label>
                        <textarea
                          rows={2}
                          value={contactAddress}
                          onChange={(e) => setContactAddress(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingContact(false)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingContact}
                          className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
                        >
                          {isSavingContact ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="divide-y divide-slate-100 text-xs sm:text-sm">
                      <div className="py-2.5">
                        <span className="text-slate-500 font-medium block">Địa chỉ thường trú (theo CCCD)</span>
                        <span className="font-semibold text-slate-900 mt-0.5 block">
                          {profile?.permanentAddress || 'Số 36, ngõ 105 đường Nguyễn Trãi, P. Thanh Xuân, TP. Hà Nội'}
                        </span>
                      </div>
                      <div className="py-2.5">
                        <span className="text-slate-500 font-medium block">Địa chỉ liên hệ hiện tại</span>
                        <span className="font-semibold text-slate-900 mt-0.5 block">
                          {contactAddress}
                        </span>
                      </div>
                      <div className="py-2.5 flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Email học sinh</span>
                        <span className="font-mono font-bold text-blue-700">
                          {profile?.studentEmail || profile?.email || 'minhanh.hs230145@nguyentrai.edu.vn'}
                        </span>
                      </div>
                      <div className="py-2.5 flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Số điện thoại cá nhân</span>
                        <span className="font-mono font-bold text-slate-900">
                          {contactPhone}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Y tế & Bảo hiểm */}
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100/70 space-y-2.5 mt-4">
                  <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <HeartPulse className="w-4 h-4 text-rose-500" />
                    <span>Bảo hiểm Y tế &amp; Tình trạng Sức khỏe</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500">Mã thẻ BHYT:</span>
                      <strong className="block text-slate-900 font-mono mt-0.5">{profile?.healthInsuranceNo || 'HS4010234567890'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Nhóm máu:</span>
                      <strong className="block text-slate-900 mt-0.5">{profile?.bloodType || 'O+'}</strong>
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 font-medium pt-1 border-t border-blue-100">
                    Sức khỏe: <strong className="text-slate-800">{profile?.healthStatus || 'Tốt, không có bệnh lý nền'}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: HỌC TẬP HIỆN TẠI ================= */}
        {activeTab === 'academic' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Box: Trường & Khối Lớp */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-blue-600" />
                    <span>Thông tin Lớp học &amp; Đào tạo</span>
                  </h3>
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                    Chính khóa
                  </span>
                </div>

                <div className="divide-y divide-slate-100 text-xs sm:text-sm">
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Trường đào tạo</span>
                    <span className="font-bold text-slate-900">{schoolName}</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Khối học</span>
                    <span className="font-bold text-slate-900">{profile?.gradeLevel || 'Khối 11'}</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Lớp biên chế</span>
                    <span className="font-bold text-blue-600 text-base">{className}</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Phòng học sinh hoạt</span>
                    <span className="font-bold text-slate-900">{profile?.classRoom || 'Phòng A203 - Tầng 2 Dãy A'}</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Ban / Tổ hợp môn học</span>
                    <span className="font-bold text-slate-800">{profile?.combination || 'Khoa học Tự nhiên'}</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Niên khóa đào tạo</span>
                    <span className="font-bold text-slate-900">{academicYear}</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Ngày nhập học</span>
                    <span className="font-bold text-slate-900">05/09/2023</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Chức vụ trong lớp</span>
                    <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      {profile?.studentRole || 'Lớp phó Học tập'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Box: Giáo viên chủ nhiệm & Ban Cán sự */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      <span>Giáo viên chủ nhiệm &amp; Quản lý lớp</span>
                    </h3>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 mt-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-lg">
                        GV
                      </div>
                      <div>
                        <div className="text-sm sm:text-base font-bold text-slate-900">
                          {profile?.homeroomTeacher || 'Cô Phạm Minh Thư'}
                        </div>
                        <div className="text-xs text-blue-600 font-semibold">Giáo viên Chủ nhiệm lớp 11A1</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono">0987 654 321</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">gvcn.11a1@nguyentrai.edu.vn</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ghi chú học vụ từ nhà trường</h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-blue-50/40 p-3.5 rounded-xl border border-blue-100/60">
                      Học sinh chấp hành nghiêm túc nội quy nhà trường, có thành tích học tập tốt và tích cực tham gia các phong trào thi đua của Đoàn trường.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: PHỤ HUYNH & NGƯỜI GIÁM HỘ ================= */}
        {activeTab === 'guardians' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card Cha */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">Cha (Bố)</h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    Liên hệ chính
                  </span>
                </div>

                <div className="divide-y divide-slate-100 text-xs sm:text-sm">
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Họ và tên</span>
                    <span className="font-bold text-slate-900">Nguyễn Văn Hùng</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Quan hệ</span>
                    <span className="font-bold text-slate-900">Cha</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Số điện thoại</span>
                    <a href="tel:0912345678" className="font-mono font-bold text-blue-600 hover:underline">
                      0912 345 678
                    </a>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Email</span>
                    <span className="font-mono font-bold text-slate-700">hungnv@gmail.com</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Nghề nghiệp</span>
                    <span className="font-semibold text-slate-800">Kỹ sư công nghệ thông tin</span>
                  </div>
                  <div className="py-2.5">
                    <span className="text-slate-500 font-medium block">Địa chỉ liên hệ</span>
                    <span className="font-semibold text-slate-800 mt-0.5 block">
                      Số 36, ngõ 105 đường Nguyễn Trãi, P. Thanh Xuân, TP. Hà Nội
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Mẹ */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">Mẹ</h3>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 text-xs sm:text-sm">
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Họ và tên</span>
                    <span className="font-bold text-slate-900">Trần Thị Lan</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Quan hệ</span>
                    <span className="font-bold text-slate-900">Mẹ</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Số điện thoại</span>
                    <a href="tel:0904567890" className="font-mono font-bold text-blue-600 hover:underline">
                      0904 567 890
                    </a>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Email</span>
                    <span className="font-mono font-bold text-slate-700">lantran@gmail.com</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Nghề nghiệp</span>
                    <span className="font-semibold text-slate-800">Dược sĩ</span>
                  </div>
                  <div className="py-2.5">
                    <span className="text-slate-500 font-medium block">Địa chỉ liên hệ</span>
                    <span className="font-semibold text-slate-800 mt-0.5 block">
                      Số 36, ngõ 105 đường Nguyễn Trãi, P. Thanh Xuân, TP. Hà Nội
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: LỊCH SỬ HỌC TẬP ================= */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <span>Quá trình học tập qua các năm</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider">
                    <th className="py-3 px-3">Niên khóa</th>
                    <th className="py-3 px-3">Lớp</th>
                    <th className="py-3 px-3">Trường</th>
                    <th className="py-3 px-3 text-center">ĐTB / Xếp loại</th>
                    <th className="py-3 px-3 text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {profile?.academicHistory?.map((hist, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-3 font-bold text-slate-900 font-mono">
                        {hist.academicYear}
                      </td>
                      <td className="py-3.5 px-3 font-extrabold text-blue-700">
                        {hist.className}
                      </td>
                      <td className="py-3.5 px-3 text-slate-800 font-medium">
                        {hist.schoolName}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="font-bold text-slate-900 font-mono">{hist.gpa?.toFixed(1) || '8.6'}</span>
                        <span className="text-xs text-slate-500 ml-1.5">({hist.academicRank || 'Tốt'})</span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          hist.status === 'Đang học'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{hist.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 5: KHEN THƯỞNG & KỶ LUẬT ================= */}
        {activeTab === 'awards' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Khen thưởng */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    <span>Thành tích &amp; Khen thưởng</span>
                  </h3>
                </div>

                <div className="space-y-3">
                  {profile?.awards?.map((award, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-amber-50/30 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                        <Award className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">{award.title}</h4>
                        <div className="text-xs text-slate-500 mt-1">Cấp bởi: {award.issuer}</div>
                        <div className="text-[11px] text-amber-700 font-semibold mt-0.5">Ngày khen thưởng: {award.dateAchieved}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Kỷ luật */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span>Kỷ luật &amp; Rèn luyện</span>
                  </h3>
                </div>

                <div className="p-8 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Học sinh không có vi phạm kỷ luật</h4>
                  <p className="text-xs text-slate-500">
                    Học sinh luôn chấp hành tốt nội quy trường lớp, xếp loại Rèn luyện đạt mức Tốt suốt các năm học.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 6: HỒ SƠ & TÀI LIỆU SỐ HÓA ================= */}
        {activeTab === 'documents' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>Hồ sơ &amp; Văn bằng số hóa</span>
              </h3>
              <span className="text-xs text-slate-500">Lưu trữ điện tử có chứng thực</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile?.documents?.map((doc, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-100/60 transition-colors flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate" title={doc.documentName}>
                        {doc.documentName}
                      </h4>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{doc.documentType}</span>
                        <span>•</span>
                        <span>{doc.fileSize}</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-bold">Đã xác thực</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => alert(`Đang mở tài liệu số: ${doc.documentName}`)}
                    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-600 transition-colors shrink-0"
                    title="Xem chi tiết tài liệu"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 7: TÀI KHOẢN & BẢO MẬT ================= */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <span>Tài khoản &amp; Bảo mật</span>
              </h3>
            </div>

            <div className="divide-y divide-slate-100 text-xs sm:text-sm">
              <div className="py-3 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Tên đăng nhập</span>
                <span className="font-mono font-bold text-slate-900">{profile?.accountSecurity?.username || 'hs230145'}</span>
              </div>
              <div className="py-3 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Email đăng nhập hệ thống</span>
                <span className="font-mono font-bold text-blue-700">{profile?.accountSecurity?.loginEmail || 'minhanh.hs230145@nguyentrai.edu.vn'}</span>
              </div>
              <div className="py-3 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Tài khoản Google liên kết</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Đã liên kết (Google Workspace Education)</span>
                </span>
              </div>
              <div className="py-3 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Trạng thái xác thực</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Đã xác thực</span>
                </span>
              </div>
              <div className="py-3 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Lần đăng nhập gần nhất</span>
                <span className="text-slate-700 font-semibold">{profile?.accountSecurity?.lastLogin || 'Hôm nay – 07:42 (trên trình duyệt Chrome, Windows)'}</span>
              </div>
            </div>

            {/* Security Action Buttons matching screenshot */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Đổi mật khẩu</span>
              </button>

              <button
                onClick={() => alert('Phiên đăng nhập hiện tại trên thiết bị này là an toàn.')}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                <KeyRound className="w-4 h-4 text-slate-500" />
                <span>Quản lý thiết bị</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= TAB 8: YÊU CẦU CẬP NHẬT HỒ SƠ ================= */}
        {activeTab === 'requests' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileEdit className="w-5 h-5 text-blue-600" />
                  <span>Yêu cầu cập nhật hồ sơ đã gửi</span>
                </h3>
                <p className="text-xs text-slate-500">Các yêu cầu điều chỉnh thông tin gửi lên Phòng Giáo vụ</p>
              </div>

              <button
                onClick={() => setIsUpdateModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo yêu cầu mới</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider">
                    <th className="py-3 px-3 w-12 text-center">#</th>
                    <th className="py-3 px-3">Nội dung yêu cầu</th>
                    <th className="py-3 px-3 w-40">Ngày gửi</th>
                    <th className="py-3 px-3 w-32 text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {profile?.updateRequests?.map((req, idx) => {
                    const statusStyle =
                      req.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : req.status === 'pending'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-red-50 text-red-700 border-red-200';

                    return (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-3 text-center font-bold text-slate-600 font-mono">
                          {req.orderNo}
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-slate-900">{req.requestContent}</div>
                          {req.note && <div className="text-xs text-slate-500 mt-0.5">{req.note}</div>}
                        </td>
                        <td className="py-3.5 px-3 text-slate-600 font-mono text-xs whitespace-nowrap">
                          {req.submittedAt}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${statusStyle}`}>
                            {req.statusTextVi}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL 1: YÊU CẦU CẬP NHẬT THÔNG TIN ================= */}
      {isUpdateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <span>Gửi yêu cầu cập nhật thông tin hồ sơ</span>
              </h3>
              <button
                onClick={() => setIsUpdateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {requestSuccessMsg ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <p className="text-sm font-bold text-slate-900">{requestSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleCreateUpdateRequest} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Danh mục cần cập nhật</label>
                  <select
                    value={requestCategory}
                    onChange={(e) => setRequestCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="phone">Cập nhật số điện thoại liên hệ</option>
                    <option value="address">Chỉnh sửa địa chỉ thường trú / liên hệ</option>
                    <option value="nationalId">Bổ sung / đính chính CCCD hoặc Mã định danh</option>
                    <option value="parent">Cập nhật thông tin Phụ huynh / Người giám hộ</option>
                    <option value="health">Cập nhật thông tin thẻ BHYT &amp; Sức khỏe</option>
                    <option value="other">Yêu cầu điều chỉnh thông tin khác</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nội dung đề xuất thay đổi (*)</label>
                  <input
                    type="text"
                    required
                    value={requestContent}
                    onChange={(e) => setRequestContent(e.target.value)}
                    placeholder="Ví dụ: Thay đổi số điện thoại từ 090... sang 098..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Lý do / Giấy tờ minh chứng đính kèm</label>
                  <textarea
                    rows={3}
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    placeholder="Ghi rõ lý do đính chính (kèm số công văn, bản sao CCCD nếu có)..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsUpdateModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingRequest}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-sm disabled:opacity-50"
                  >
                    {isSubmittingRequest ? 'Đang gửi...' : 'Gửi yêu cầu'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL 2: ĐỔI MẬT KHẨU ================= */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                <span>Đổi mật khẩu tài khoản</span>
              </h3>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordSuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <p className="text-sm font-bold text-slate-900">{passwordSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                {passwordError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                    {passwordError}
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Mật khẩu mới (tối thiểu 6 ký tự)</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                  >
                    Cập nhật mật khẩu
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL 3: IN / TẢI HỒ SƠ HỌC SINH (SƠ YẾU LÝ LỊCH CHUẨN BỘ GD&ĐT) ================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            {/* Action Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-600" />
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Phiếu Sơ yếu lý lịch học sinh (Bản chính thức)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>In phiếu</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Format */}
            <div className="space-y-6 text-xs sm:text-sm font-serif p-4 border border-slate-200 rounded-xl bg-white">
              {/* Header */}
              <div className="text-center space-y-1 pb-4 border-b border-slate-300">
                <div className="font-bold uppercase tracking-wider text-[11px] text-slate-600">
                  SỞ GIÁO DỤC VÀ ĐÀO TẠO HÀ NỘI
                </div>
                <div className="font-extrabold uppercase text-sm sm:text-base text-slate-900">
                  {schoolName}
                </div>
                <div className="text-slate-500 italic text-[11px]">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM — Độc lập • Tự do • Hạnh phúc
                </div>
                <h2 className="text-base sm:text-lg font-black uppercase text-slate-900 pt-3">
                  PHIẾU THÔNG TIN HỌC SINH THPT
                </h2>
                <div className="text-xs text-slate-600">Niên khóa: {academicYear}</div>
              </div>

              {/* General Info */}
              <div className="space-y-2.5 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>Họ và tên: <strong className="uppercase font-bold text-slate-900">{fullName}</strong></div>
                  <div>Mã số học sinh: <strong className="font-mono text-slate-900">{studentCode}</strong></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>Ngày sinh: <strong>{profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('vi-VN') : '15/08/2008'}</strong></div>
                  <div>Giới tính: <strong>{profile?.gender || 'Nữ'}</strong></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>Nơi sinh: <strong>{profile?.birthPlace || 'Hà Nội'}</strong></div>
                  <div>Số CCCD: <strong className="font-mono">{profile?.nationalId || '001308012345'}</strong></div>
                </div>
                <div>Lớp học: <strong>{className}</strong> — Ban/Tổ hợp: <strong>{profile?.combination || 'Khoa học Tự nhiên'}</strong></div>
                <div>Giáo viên chủ nhiệm: <strong>{profile?.homeroomTeacher || 'Cô Phạm Minh Thư'}</strong></div>
                <div>Địa chỉ thường trú: <strong>{profile?.permanentAddress || 'Số 36, ngõ 105 đường Nguyễn Trãi, P. Thanh Xuân, TP. Hà Nội'}</strong></div>
                <div>Cha: <strong>Nguyễn Văn Hùng</strong> (SĐT: 0912 345 678)</div>
                <div>Mẹ: <strong>Trần Thị Lan</strong> (SĐT: 0904 567 890)</div>
              </div>

              {/* Signatures */}
              <div className="pt-6 grid grid-cols-2 gap-4 text-center text-xs">
                <div>
                  <div className="font-bold text-slate-700">HỌC SINH KÝ TÊN</div>
                  <div className="text-[10px] text-slate-400 italic">(Ký và ghi rõ họ tên)</div>
                  <div className="h-16 flex items-end justify-center font-bold text-slate-900">{fullName}</div>
                </div>
                <div>
                  <div className="font-bold text-slate-700">XÁC NHẬN BAN GIÁM HIỆU</div>
                  <div className="text-[10px] text-slate-400 italic">(Ký tên và đóng dấu)</div>
                  <div className="h-16 flex items-end justify-center font-bold text-slate-900">HIỆU TRƯỞNG</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
