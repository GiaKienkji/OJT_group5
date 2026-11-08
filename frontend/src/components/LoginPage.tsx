import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Globe, 
  ChevronDown, 
  ShieldCheck, 
  Users, 
  Calendar, 
  GraduationCap, 
  Layers,
  School,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_CLIENT_ID = '386497321392-cr00dan10l9teavnakijadd2j9dr2b1g.apps.googleusercontent.com';

export const LoginPage: React.FC = () => {
  const { login, loginWithGoogle } = useAuth();
  const [emailOrCode, setEmailOrCode] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Initialize Google Identity Services
  useEffect(() => {
    const initGoogle = () => {
      if (window.google?.accounts?.id && googleBtnRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: async (response: any) => {
              if (response?.credential) {
                setIsLoading(true);
                setErrorMessage(null);
                const res = await loginWithGoogle(response.credential);
                setIsLoading(false);
                if (!res.success) {
                  setErrorMessage(res.message || 'Đăng nhập Google thất bại.');
                }
              }
            }
          });

          // Render Google's native secure button
          googleBtnRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            width: 380,
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            locale: 'vi'
          });
        } catch (err) {
          console.error('Google init error', err);
        }
      }
    };

    const timer = setTimeout(initGoogle, 400);
    return () => clearTimeout(timer);
  }, [loginWithGoogle]);

  // Check if returning from Google OAuth redirect (hash token)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('id_token=')) {
      const params = new URLSearchParams(hash.substring(1));
      const idToken = params.get('id_token');
      if (idToken) {
        window.history.replaceState(null, '', window.location.pathname);
        setIsLoading(true);
        loginWithGoogle(idToken).then(res => {
          setIsLoading(false);
          if (!res.success) {
            setErrorMessage(res.message || 'Xác thực Google không thành công.');
          }
        });
      }
    }
  }, [loginWithGoogle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrCode.trim() || !password) {
      setErrorMessage('Vui lòng nhập email hoặc mã tài khoản và mật khẩu.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const result = await login(emailOrCode, password, rememberMe);
    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(result.message || 'Đăng nhập không thành công.');
    }
  };

  const handleCustomGoogleClick = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          const redirectUri = window.location.origin;
          const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token%20id_token&scope=openid%20profile%20email&nonce=soms_${Date.now()}`;
          window.location.href = oauthUrl;
        }
      });
    } else {
      const redirectUri = window.location.origin;
      const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token%20id_token&scope=openid%20profile%20email&nonce=soms_${Date.now()}`;
      window.location.href = oauthUrl;
    }
  };

  const handleQuickFill = (email: string) => {
    setEmailOrCode(email);
    setPassword('Soms@2026');
    setErrorMessage(null);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Background with Clean School Image & Deep Blue Wave Gradient Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: "url('/assets/clean-school-bg.jpg')" }}
      >
        {/* Deep blue ocean gradient at bottom and left */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950/60 via-blue-900/20 to-blue-950/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05294a] via-[#05294a]/70 via-35% to-transparent" />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 pt-8 pb-12 flex-1 flex flex-col lg:flex-row items-center lg:items-center justify-between gap-12">
        
        {/* Left Side: Brand, Headline, Feature Cards */}
        <div className="flex-1 max-w-2xl text-white flex flex-col justify-center">
          
          {/* Logo SOMS */}
          <div className="flex items-center gap-3.5 mb-12">
            <div className="w-14 h-14 rounded-full border-2 border-white/80 flex items-center justify-center p-2.5 bg-white/10 backdrop-blur-md shadow-lg shadow-black/20">
              <svg viewBox="0 0 48 48" fill="none" className="w-full h-full text-white" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {/* Laurel wreath branches */}
                <path d="M10 32C7 26 7 18 13 12" />
                <path d="M38 32C41 26 41 18 35 12" />
                <path d="M8 22C6 19 8 16 11 15" />
                <path d="M40 22C42 19 40 16 37 15" />
                {/* Graduation cap */}
                <path d="M24 14L37 20L24 26L11 20L24 14Z" fill="currentColor" fillOpacity="0.2" />
                <path d="M16 23V30C16 33 20 35 24 35C28 35 32 33 32 30V23" />
                <path d="M37 20V28" />
              </svg>
            </div>
            <div>
              <div className="text-3xl font-extrabold tracking-tight font-serif">SOMS</div>
              <div className="text-[11px] tracking-[0.2em] uppercase text-white/85 font-medium -mt-1">
                SCHOOL OPERATIONS MANAGEMENT SYSTEM
              </div>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold leading-[1.15] tracking-tight mb-6 drop-shadow-md">
            Hệ thống quản lý<br />
            vận hành trường học
          </h1>

          {/* Description */}
          <p className="text-lg sm:text-xl text-white/90 leading-relaxed max-w-xl font-normal mb-10 drop-shadow">
            Kết nối và số hóa toàn bộ hoạt động nhà trường, hỗ trợ hiệu quả cho quản trị, giảng dạy, học tập và phối hợp giữa nhà trường – học sinh – phụ huynh.
          </p>

          {/* 4 Feature Badges in Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 max-w-2xl">
            {/* Card 1 */}
            <div className="bg-white/10 hover:bg-white/15 transition-all duration-300 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center group">
              <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-white/95 leading-snug">
                Quản trị<br />nhân sự
              </span>
            </div>

            {/* Card 2 */}
            <div className="bg-white/10 hover:bg-white/15 transition-all duration-300 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center group">
              <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-white/95 leading-snug">
                Lịch dạy &amp;<br />thời khóa biểu
              </span>
            </div>

            {/* Card 3 */}
            <div className="bg-white/10 hover:bg-white/15 transition-all duration-300 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center group">
              <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-white/95 leading-snug">
                Học tập &amp;<br />đánh giá
              </span>
            </div>

            {/* Card 4 */}
            <div className="bg-white/10 hover:bg-white/15 transition-all duration-300 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center group">
              <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-white/95 leading-snug">
                Tài sản &amp;<br />cơ sở vật chất
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Floating Login Card */}
        <div className="w-full lg:w-[480px] shrink-0">
          <div className="bg-white rounded-[2rem] p-8 sm:p-10 shadow-2xl shadow-blue-950/40 relative border border-slate-100/80">
            
            {/* Top Row: Language Selector */}
            <div className="flex justify-end mb-3">
              <button 
                type="button" 
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-lg px-2.5 py-1.5 transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span>Tiếng Việt</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            </div>

            {/* School Building Icon Badge */}
            <div className="w-14 h-14 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-center justify-center text-[#0B4F8A] mb-4 shadow-sm">
              <School className="w-7 h-7" />
            </div>

            {/* Title & Subtitle */}
            <h2 className="text-2xl sm:text-[26px] font-extrabold text-slate-900 tracking-tight">
              Đăng nhập hệ thống SOMS
            </h2>
            <p className="text-sm text-slate-500 mt-1 mb-6">
              Truy cập vào nền tảng quản lý vận hành trường học.
            </p>

            {/* Error Alert */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Field 1: Email or Account Code */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Email hoặc mã tài khoản
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={emailOrCode}
                    onChange={(e) => setEmailOrCode(e.target.value)}
                    placeholder="Nhập email hoặc mã tài khoản"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-[#0B4F8A] focus:ring-3 focus:ring-blue-100 transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Field 2: Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    required
                    className="w-full pl-11 pr-11 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-[#0B4F8A] focus:ring-3 focus:ring-blue-100 transition-all shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot password */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0B4F8A] border-slate-300 focus:ring-[#0B4F8A] cursor-pointer"
                  />
                  <span className="text-sm text-slate-700 font-medium">Duy trì phiên đăng nhập</span>
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Vui lòng liên hệ Quản trị viên hệ thống của trường để được cấp lại mật khẩu.');
                  }}
                  className="text-sm font-semibold text-[#0B4F8A] hover:text-[#073B68] hover:underline transition-colors"
                >
                  Quên mật khẩu?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-[#0B4F8A] hover:bg-[#073b68] active:bg-[#05294a] text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg shadow-blue-900/25 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed group"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="text-base">Đăng nhập</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              {/* Divider: "hoặc" */}
              <div className="relative my-4 flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-xs uppercase tracking-wider text-slate-400 font-medium absolute">
                  hoặc
                </span>
              </div>

              {/* Official Google GIS Button Container */}
              <div className="w-full flex justify-center">
                <div ref={googleBtnRef} className="w-full flex justify-center min-h-[44px]" />
              </div>

              {/* Fallback Custom Google Button (shown if GIS is loading) */}
              <div className="w-full">
                <button
                  type="button"
                  onClick={handleCustomGoogleClick}
                  disabled={isLoading}
                  className="w-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold py-3 px-5 rounded-xl transition-all flex items-center justify-center gap-3 shadow-sm cursor-pointer disabled:opacity-60"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span className="text-sm">Tiếp tục với Google</span>
                </button>
              </div>
            </form>

            {/* Quick-test 9 Roles Helper Pill */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="text-[11px] font-bold text-slate-500 mb-2.5 flex items-center justify-between">
                <span>Chọn nhanh tài khoản test (nhấn để tự điền form):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Admin', email: 'admin@soms.edu.vn', role: 'Quản trị hệ thống' },
                  { label: 'BGH', email: 'bgh@soms.edu.vn', role: 'Ban Giám hiệu' },
                  { label: 'Giáo vụ', email: 'giaovu@soms.edu.vn', role: 'Giáo vụ' },
                  { label: 'Tổ trưởng', email: 'totruong@soms.edu.vn', role: 'Tổ trưởng chuyên môn' },
                  { label: 'Giáo viên', email: 'giaovien@soms.edu.vn', role: 'Giáo viên bộ môn' },
                  { label: 'Kế toán', email: 'ketoan@soms.edu.vn', role: 'Kế toán tài chính' },
                  { label: 'CSVC', email: 'csvc@soms.edu.vn', role: 'Nhân viên CSVC' },
                  { label: 'Học sinh', email: 'hocsinh@soms.edu.vn', role: 'Học sinh' },
                  { label: 'Phụ huynh', email: 'phuhuynh@soms.edu.vn', role: 'Phụ huynh' },
                ].map((acc) => {
                  const isSelected = emailOrCode === acc.email;
                  return (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => handleQuickFill(acc.email)}
                      title={`Điền thông tin ${acc.role} (${acc.email})`}
                      className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-400/30'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {acc.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Security Badge Footer Notice */}
            <div className="mt-5 pt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500 text-center font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Hệ thống xác thực an toàn và phân quyền theo vai trò</span>
            </div>

          </div>
        </div>

      </div>

      {/* Bottom Footer Bar */}
      <footer className="relative z-10 w-full max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 py-5 flex flex-col sm:flex-row items-center justify-between text-xs text-white/70 border-t border-white/10 gap-3">
        <div>
          &copy; 2026 SOMS – School Operations Management System
        </div>
        <div className="flex items-center gap-6">
          <a href="#guide" className="hover:text-white transition-colors">Hướng dẫn sử dụng</a>
          <span className="text-white/30">|</span>
          <a href="#privacy" className="hover:text-white transition-colors">Chính sách bảo mật</a>
          <span className="text-white/30">|</span>
          <a href="#support" className="hover:text-white transition-colors">Liên hệ hỗ trợ</a>
        </div>
      </footer>
    </div>
  );
};
