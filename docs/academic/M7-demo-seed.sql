\set ON_ERROR_STOP on
\getenv demo_password SOMS_ACADEMIC_DEMO_PASSWORD
\if :{?demo_password}
\else
\echo 'Set SOMS_ACADEMIC_DEMO_PASSWORD to a disposable fixture password'
\quit 3
\endif

BEGIN;
DO $$
BEGIN
    IF current_database() <> 'academic_m0_test' OR inet_server_addr() IS DISTINCT FROM '127.0.0.1'::inet THEN
        RAISE EXCEPTION 'Demo seed requires an isolated academic_m0_test database on loopback';
    END IF;
END $$;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS encrypted_password text;
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id uuid PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id),
    refresh_token text NOT NULL,
    ip_address text,
    user_agent text,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL,
    revoked_at timestamptz
);

INSERT INTO public.schools (id, code, name)
VALUES ('60760000-0000-0000-0000-000000000001', 'TV2-DEMO', 'Trường Giáo vụ Demo'),
       ('60760000-0000-0000-0000-000000000002', 'TV2-OTHER', 'Trường Đối chiếu')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.roles (code, name_vi)
VALUES ('academic_affairs', 'Giáo vụ'), ('school_management', 'Ban giám hiệu'),
       ('teacher', 'Giáo viên'), ('student', 'Học sinh'), ('parent', 'Phụ huynh')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.permissions (code, description)
SELECT code, code FROM unnest(ARRAY['academic.manage', 'classes.manage', 'students.manage', 'subjects.manage',
    'teaching_assignments.manage', 'homeroom.assign', 'timetables.draft', 'timetables.approve', 'timetables.publish',
    'scheduling.manage', 'exams.manage', 'teaching_schedule.view', 'student_timetable.view', 'parent_academics.view']) AS p(code)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.role_permissions (role_code, permission_code)
SELECT 'academic_affairs', code FROM unnest(ARRAY['academic.manage', 'classes.manage', 'students.manage', 'subjects.manage',
    'teaching_assignments.manage', 'homeroom.assign', 'timetables.draft', 'timetables.publish', 'scheduling.manage',
    'exams.manage']) AS p(code)
UNION ALL SELECT 'school_management', 'timetables.approve'
UNION ALL SELECT 'school_management', 'academic.manage'
UNION ALL SELECT 'teacher', 'teaching_schedule.view'
UNION ALL SELECT 'student', 'student_timetable.view'
UNION ALL SELECT 'parent', 'parent_academics.view'
ON CONFLICT DO NOTHING;

CREATE TEMP TABLE academic_demo_accounts (
    id uuid, email text, full_name text, role_code text, school_id uuid
) ON COMMIT DROP;
INSERT INTO academic_demo_accounts VALUES
    ('60760000-0000-0000-0000-000000000011', 'giaovu@tv2-demo.invalid', 'Giáo vụ Demo', 'academic_affairs', '60760000-0000-0000-0000-000000000001'),
    ('60760000-0000-0000-0000-000000000012', 'bgh@tv2-demo.invalid', 'Ban Giám hiệu Demo', 'school_management', '60760000-0000-0000-0000-000000000001'),
    ('60760000-0000-0000-0000-000000000013', 'giaovien@tv2-demo.invalid', 'Giáo viên Demo', 'teacher', '60760000-0000-0000-0000-000000000001'),
    ('60760000-0000-0000-0000-000000000014', 'hocsinh@tv2-demo.invalid', 'Học sinh Demo', 'student', '60760000-0000-0000-0000-000000000001'),
    ('60760000-0000-0000-0000-000000000015', 'phuhuynh@tv2-demo.invalid', 'Phụ huynh Demo', 'parent', '60760000-0000-0000-0000-000000000001'),
    ('60760000-0000-0000-0000-000000000016', 'doichieu@tv2-demo.invalid', 'Học sinh trường khác', 'student', '60760000-0000-0000-0000-000000000002');

INSERT INTO auth.users (id, email, encrypted_password)
SELECT id, email, crypt(:'demo_password', gen_salt('bf')) FROM academic_demo_accounts
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password
WHERE users.email = EXCLUDED.email;
INSERT INTO public.profiles (id, full_name)
SELECT id, full_name FROM academic_demo_accounts
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.school_memberships (school_id, user_id, role_code)
SELECT school_id, id, role_code FROM academic_demo_accounts
ON CONFLICT (school_id, user_id, role_code) DO NOTHING;

INSERT INTO public.academic_years (id, school_id, name, start_date, end_date, status)
VALUES ('60760000-0000-0000-0000-000000000020', '60760000-0000-0000-0000-000000000001',
        'Năm học Demo', CURRENT_DATE - 20, CURRENT_DATE + 320, 'active')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.semesters (id, academic_year_id, name, ordinal, start_date, end_date, status)
VALUES ('60760000-0000-0000-0000-000000000021', '60760000-0000-0000-0000-000000000020',
        'Học kỳ I Demo', 1, CURRENT_DATE - 20, CURRENT_DATE + 140, 'active'),
       ('60760000-0000-0000-0000-000000000022', '60760000-0000-0000-0000-000000000020',
        'Học kỳ II Demo', 2, CURRENT_DATE + 151, CURRENT_DATE + 320, 'planned')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.grade_levels (id, school_id, grade_number)
VALUES ('60760000-0000-0000-0000-000000000030', '60760000-0000-0000-0000-000000000001', 6)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.staff (id, school_id, user_id, employee_code, full_name, kind)
VALUES ('60760000-0000-0000-0000-000000000031', '60760000-0000-0000-0000-000000000001',
        '60760000-0000-0000-0000-000000000013', 'GVDEMO1', 'Giáo viên Demo', 'teacher'),
       ('60760000-0000-0000-0000-000000000032', '60760000-0000-0000-0000-000000000001',
        NULL, 'GVDEMO2', 'Giáo viên Dạy thay', 'teacher')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.rooms (id, school_id, code, capacity)
VALUES ('60760000-0000-0000-0000-000000000041', '60760000-0000-0000-0000-000000000001', 'P101', 25)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.period_definitions (id, school_id, period_no, starts_at, ends_at)
VALUES ('60760000-0000-0000-0000-000000000051', '60760000-0000-0000-0000-000000000001', 1, '07:00', '08:00'),
       ('60760000-0000-0000-0000-000000000052', '60760000-0000-0000-0000-000000000001', 2, '07:30', '08:30')
ON CONFLICT (id) DO NOTHING;
COMMIT;
