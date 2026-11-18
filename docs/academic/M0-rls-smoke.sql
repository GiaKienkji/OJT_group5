-- Chỉ chạy bằng psql trên database thử dành riêng cho M0.
-- Yêu cầu database tên academic_m0_test và role quản trị có thể SET ROLE.
\set ON_ERROR_STOP on
BEGIN;
DO $$
BEGIN
  IF current_database() <> 'academic_m0_test' THEN
    RAISE EXCEPTION 'M0 smoke test requires database academic_m0_test';
  END IF;
END $$;

INSERT INTO auth.users (id) VALUES
  ('a0000000-0000-4000-8000-000000000001'),
  ('a0000000-0000-4000-8000-000000000002');
INSERT INTO public.profiles (id, full_name) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'M0 Active'),
  ('a0000000-0000-4000-8000-000000000002', 'M0 Expired')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.roles (code, name_vi) VALUES ('academic_affairs', 'Giáo vụ')
ON CONFLICT (code) DO NOTHING;
INSERT INTO public.schools (id, code, name) VALUES
  ('b0000000-0000-4000-8000-000000000001', 'M0A', 'M0 School A'),
  ('b0000000-0000-4000-8000-000000000002', 'M0B', 'M0 School B');
INSERT INTO public.school_memberships (school_id, user_id, role_code, valid_to) VALUES
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'academic_affairs', CURRENT_DATE),
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', 'academic_affairs', CURRENT_DATE - 1);

INSERT INTO public.academic_years (id, school_id, name, start_date, end_date)
SELECT ('c0000000-0000-4000-8000-00000000000' || n)::uuid, id, 'M0 Year', DATE '2026-09-01', DATE '2027-06-01'
FROM (VALUES (1), (2)) AS k(n)
JOIN public.schools ON code = 'M0' || chr(64 + n);
INSERT INTO public.semesters (id, academic_year_id, name, ordinal, start_date, end_date)
SELECT ('d0000000-0000-4000-8000-00000000000' || n)::uuid,
       ('c0000000-0000-4000-8000-00000000000' || n)::uuid, 'M0 Semester', 1, DATE '2026-09-01', DATE '2026-12-31'
FROM (VALUES (1), (2)) AS k(n);
INSERT INTO public.timetable_versions (semester_id, version_no, status, created_by, published_at)
SELECT ('d0000000-0000-4000-8000-00000000000' || n)::uuid, v,
       CASE WHEN v = 1 THEN 'published' ELSE 'draft' END,
       'a0000000-0000-4000-8000-000000000001', CASE WHEN v = 1 THEN now() END
FROM (VALUES (1), (2)) AS k(n) CROSS JOIN (VALUES (1), (2)) AS versions(v);

SET LOCAL ROLE anon;
DO $$
BEGIN
  IF has_table_privilege('public.timetable_versions', 'SELECT') THEN
    RAISE EXCEPTION 'anon can read timetable_versions';
  END IF;
END $$;
RESET ROLE;

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000001';
SELECT set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
DO $$
BEGIN
  IF NOT row_security_active('public.timetable_versions'::regclass)
     OR has_table_privilege('public.timetable_versions', 'UPDATE')
     OR has_table_privilege('public.school_memberships', 'SELECT') THEN
    RAISE EXCEPTION 'Unexpected authenticated grants or RLS';
  END IF;
  IF (SELECT count(*) FROM public.timetable_versions
      WHERE semester_id IN ('d0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000002')) <> 1
     OR NOT EXISTS (SELECT 1 FROM public.timetable_versions
                     WHERE semester_id = 'd0000000-0000-4000-8000-000000000001' AND status = 'published') THEN
    RAISE EXCEPTION 'Current member must see only the published version from school A';
  END IF;
END $$;
SET LOCAL request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000002';
SELECT set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.timetable_versions
             WHERE semester_id IN ('d0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000002')) THEN
    RAISE EXCEPTION 'Expired member can see a version';
  END IF;
END $$;
RESET ROLE;

SET LOCAL ROLE service_role;
DO $$
BEGIN
  IF row_security_active('public.timetable_versions'::regclass)
     OR (SELECT count(*) FROM public.timetable_versions
         WHERE semester_id IN ('d0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000002')) <> 4 THEN
    RAISE EXCEPTION 'Unexpected service_role RLS or visibility';
  END IF;
END $$;
RESET ROLE;

ROLLBACK;
\echo 'M0 smoke passed: anon grants, authenticated school/status, expired membership, BYPASSRLS.'
