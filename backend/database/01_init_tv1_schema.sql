-- ==============================================================================
-- SOMS (School Operations Management System)
-- SCRIPT KHỞI TẠO CƠ SỞ DỮ LIỆU TẦNG LÕI (TV1 - DATA LAYER)
-- ==============================================================================

-- 1. BẢNG DANH MỤC VAI TRÒ (ROLES) & QUYỀN HẠN (PERMISSIONS)
CREATE TABLE IF NOT EXISTS public.roles (
    code VARCHAR(50) PRIMARY KEY,
    name_vi VARCHAR(100) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS public.permissions (
    code VARCHAR(100) PRIMARY KEY,
    description TEXT
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_code VARCHAR(50) NOT NULL REFERENCES public.roles(code) ON DELETE CASCADE,
    permission_code VARCHAR(100) NOT NULL REFERENCES public.permissions(code) ON DELETE CASCADE,
    PRIMARY KEY (role_code, permission_code)
);

-- 2. HỒ SƠ NGƯỜI DÙNG & TRƯỜNG HỌC
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_path TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    level VARCHAR(50) NOT NULL DEFAULT 'THPT',
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS public.school_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_code VARCHAR(50) NOT NULL REFERENCES public.roles(code) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    granted_by UUID,
    valid_from DATE,
    valid_to DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);

-- 3. CẤU HÌNH NIÊN KHÓA & HỌC KỲ (ACADEMIC YEARS & SEMESTERS - ADM-14)
CREATE TABLE IF NOT EXISTS public.academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL, -- e.g. '2025-2026'
    name VARCHAR(100) NOT NULL, -- e.g. 'Năm học 2025 - 2026'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.semesters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL, -- e.g. 'HK1', 'HK2'
    name VARCHAR(50) NOT NULL, -- e.g. 'Học kỳ 1'
    term_number INT NOT NULL DEFAULT 1,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ĐỘNG CƠ PHÊ DUYỆT ĐA HÌNH DÙNG CHUNG (APPROVAL ENGINE - BF04)
CREATE TABLE IF NOT EXISTS public.approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    request_code VARCHAR(50) UNIQUE NOT NULL,
    request_type VARCHAR(50) NOT NULL, -- 'leave_teacher', 'leave_student', 'timetable_change', 'substitute_teaching', 'facility_purchase', 'facility_repair', 'grade_change'
    requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    payload_json TEXT, -- Chi tiết dữ liệu dạng JSON cho từng loại đơn
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled'
    priority VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    current_approver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    final_decision_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.approval_histories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.approval_requests(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'created', 'approved', 'rejected', 'forwarded', 'cancelled'
    performed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. QUẢN LÝ CÔNG VIỆC & NHIỆM VỤ NHÀ TRƯỜNG (TASK MANAGEMENT - BF08)
CREATE TABLE IF NOT EXISTS public.school_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'general', -- 'academic', 'facility', 'administrative', 'event', 'general'
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    status VARCHAR(20) NOT NULL DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed', 'cancelled', 'overdue'
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.task_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.school_tasks(id) ON DELETE CASCADE,
    assignee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_in_task VARCHAR(50) NOT NULL DEFAULT 'owner',
    progress_percent INT NOT NULL DEFAULT 0,
    note TEXT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. NHẬT KÝ KIỂM TOÁN HỆ THỐNG (AUDIT LOGS - ADM-22, MGT-35)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100),
    entity_id VARCHAR(100),
    details TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. CHỈ MỤC (INDEXES) TỐI ƯU HIỆU NĂNG TRUY VẤN
CREATE INDEX IF NOT EXISTS idx_school_memberships_school_user ON public.school_memberships(school_id, user_id);
CREATE INDEX IF NOT EXISTS idx_school_memberships_role ON public.school_memberships(role_code);
CREATE INDEX IF NOT EXISTS idx_academic_years_school ON public.academic_years(school_id, is_active);
CREATE INDEX IF NOT EXISTS idx_semesters_academic_year ON public.semesters(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_school_status ON public.approval_requests(school_id, status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_type ON public.approval_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_approval_requests_requester ON public.approval_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_school_tasks_school_status ON public.school_tasks(school_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

