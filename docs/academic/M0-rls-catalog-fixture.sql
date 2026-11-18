-- Chỉ dùng trên một cluster PostgreSQL thử mới, riêng biệt. Không phải migration.
-- 9 bảng lấy từ catalog ngày 18/11/2026. auth.users/auth.uid là stub để chạy fixture.
-- Trigger công bố lịch và các phụ thuộc ngoài 9 bảng thuộc baseline đầy đủ.
\set ON_ERROR_STOP on
DO $$
BEGIN
  IF current_database() <> 'academic_m0_test' THEN
    RAISE EXCEPTION 'M0 catalog fixture requires database academic_m0_test';
  END IF;
END $$;
CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth; CREATE SCHEMA soms_private; CREATE TABLE auth.users(id uuid PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
GRANT USAGE ON SCHEMA auth,soms_private TO authenticated;
CREATE TABLE public.schools (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "level" text DEFAULT 'combined'::text NOT NULL,
  "email" text,
  "phone" text,
  "address" text,
  "timezone" text DEFAULT 'Asia/Ho_Chi_Minh'::text NOT NULL,
  "status" text DEFAULT 'active'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.schools ADD CONSTRAINT schools_code_key UNIQUE (code);
ALTER TABLE public.schools ADD CONSTRAINT schools_level_check CHECK ((level = ANY (ARRAY['middle'::text, 'high'::text, 'combined'::text])));
ALTER TABLE public.schools ADD CONSTRAINT schools_pkey PRIMARY KEY (id);
ALTER TABLE public.schools ADD CONSTRAINT schools_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text])));
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.profiles (
  "id" uuid NOT NULL,
  "full_name" text DEFAULT ''::text NOT NULL,
  "phone" text,
  "avatar_path" text,
  "status" text DEFAULT 'active'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'suspended'::text])));
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.roles (
  "code" text NOT NULL,
  "name_vi" text NOT NULL,
  "description" text
);
ALTER TABLE public.roles ADD CONSTRAINT roles_pkey PRIMARY KEY (code);
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.permissions (
  "code" text NOT NULL,
  "description" text NOT NULL
);
ALTER TABLE public.permissions ADD CONSTRAINT permissions_pkey PRIMARY KEY (code);
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.role_permissions (
  "role_code" text NOT NULL,
  "permission_code" text NOT NULL
);
ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_permission_code_fkey FOREIGN KEY (permission_code) REFERENCES permissions(code) ON DELETE CASCADE;
ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_code, permission_code);
ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_role_code_fkey FOREIGN KEY (role_code) REFERENCES roles(code) ON DELETE CASCADE;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.school_memberships (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "school_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "role_code" text NOT NULL,
  "status" text DEFAULT 'active'::text NOT NULL,
  "granted_by" uuid,
  "valid_from" date,
  "valid_to" date,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.school_memberships ADD CONSTRAINT school_memberships_check CHECK (((valid_to IS NULL) OR (valid_from IS NULL) OR (valid_to >= valid_from)));
ALTER TABLE public.school_memberships ADD CONSTRAINT school_memberships_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES profiles(id);
ALTER TABLE public.school_memberships ADD CONSTRAINT school_memberships_pkey PRIMARY KEY (id);
ALTER TABLE public.school_memberships ADD CONSTRAINT school_memberships_role_code_fkey FOREIGN KEY (role_code) REFERENCES roles(code);
ALTER TABLE public.school_memberships ADD CONSTRAINT school_memberships_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id);
ALTER TABLE public.school_memberships ADD CONSTRAINT school_memberships_school_id_user_id_role_code_key UNIQUE (school_id, user_id, role_code);
ALTER TABLE public.school_memberships ADD CONSTRAINT school_memberships_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text])));
ALTER TABLE public.school_memberships ADD CONSTRAINT school_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id);
CREATE INDEX ix_school_memberships_user ON public.school_memberships USING btree (user_id, school_id, role_code) WHERE (status = 'active'::text);
ALTER TABLE public.school_memberships ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.academic_years (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "school_id" uuid NOT NULL,
  "name" text NOT NULL,
  "start_date" date NOT NULL,
  "end_date" date NOT NULL,
  "status" text DEFAULT 'planned'::text NOT NULL
);
ALTER TABLE public.academic_years ADD CONSTRAINT academic_years_check CHECK ((end_date > start_date));
ALTER TABLE public.academic_years ADD CONSTRAINT academic_years_pkey PRIMARY KEY (id);
ALTER TABLE public.academic_years ADD CONSTRAINT academic_years_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id);
ALTER TABLE public.academic_years ADD CONSTRAINT academic_years_school_id_name_key UNIQUE (school_id, name);
ALTER TABLE public.academic_years ADD CONSTRAINT academic_years_status_check CHECK ((status = ANY (ARRAY['planned'::text, 'active'::text, 'closed'::text])));
CREATE UNIQUE INDEX ux_active_academic_year_per_school ON public.academic_years USING btree (school_id) WHERE (status = 'active'::text);
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.semesters (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "academic_year_id" uuid NOT NULL,
  "name" text NOT NULL,
  "ordinal" smallint NOT NULL,
  "start_date" date NOT NULL,
  "end_date" date NOT NULL,
  "status" text DEFAULT 'planned'::text NOT NULL
);
ALTER TABLE public.semesters ADD CONSTRAINT semesters_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES academic_years(id);
ALTER TABLE public.semesters ADD CONSTRAINT semesters_academic_year_id_ordinal_key UNIQUE (academic_year_id, ordinal);
ALTER TABLE public.semesters ADD CONSTRAINT semesters_check CHECK ((end_date >= start_date));
ALTER TABLE public.semesters ADD CONSTRAINT semesters_ordinal_check CHECK (((ordinal >= 1) AND (ordinal <= 3)));
ALTER TABLE public.semesters ADD CONSTRAINT semesters_pkey PRIMARY KEY (id);
ALTER TABLE public.semesters ADD CONSTRAINT semesters_status_check CHECK ((status = ANY (ARRAY['planned'::text, 'active'::text, 'closed'::text])));
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.timetable_versions (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "semester_id" uuid NOT NULL,
  "version_no" integer NOT NULL,
  "status" text DEFAULT 'draft'::text NOT NULL,
  "created_by" uuid,
  "published_at" timestamp with time zone
);
ALTER TABLE public.timetable_versions ADD CONSTRAINT timetable_versions_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id);
ALTER TABLE public.timetable_versions ADD CONSTRAINT timetable_versions_pkey PRIMARY KEY (id);
ALTER TABLE public.timetable_versions ADD CONSTRAINT timetable_versions_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES semesters(id);
ALTER TABLE public.timetable_versions ADD CONSTRAINT timetable_versions_semester_id_version_no_key UNIQUE (semester_id, version_no);
ALTER TABLE public.timetable_versions ADD CONSTRAINT timetable_versions_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'pending_approval'::text, 'published'::text, 'archived'::text])));
ALTER TABLE public.timetable_versions ADD CONSTRAINT timetable_versions_version_no_check CHECK ((version_no > 0));
CREATE UNIQUE INDEX ux_one_published_timetable ON public.timetable_versions USING btree (semester_id) WHERE (status = 'published'::text);
ALTER TABLE public.timetable_versions ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.soms_touch_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin new.updated_at = now(); return new; end $function$
;
CREATE OR REPLACE FUNCTION soms_private.has_role(p_school uuid, p_roles text[])
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select exists (select 1 from public.school_memberships m
 where m.school_id=p_school and m.user_id=(select auth.uid()) and m.status='active'
 and m.role_code=any(p_roles)
 and (m.valid_from is null or m.valid_from<=current_date)
 and (m.valid_to is null or m.valid_to>=current_date))
$function$
;
REVOKE EXECUTE ON FUNCTION soms_private.has_role(uuid,text[]) FROM PUBLIC; GRANT EXECUTE ON FUNCTION soms_private.has_role(uuid,text[]) TO authenticated;
GRANT SELECT ON TABLE public.schools TO authenticated;
GRANT DELETE ON TABLE public.schools TO service_role;
GRANT INSERT ON TABLE public.schools TO service_role;
GRANT REFERENCES ON TABLE public.schools TO service_role;
GRANT SELECT ON TABLE public.schools TO service_role;
GRANT TRIGGER ON TABLE public.schools TO service_role;
GRANT TRUNCATE ON TABLE public.schools TO service_role;
GRANT UPDATE ON TABLE public.schools TO service_role;
CREATE POLICY school_member_read ON public.schools AS PERMISSIVE FOR SELECT TO authenticated USING (soms_private.has_role(id, ARRAY['system_admin'::text, 'school_management'::text, 'academic_affairs'::text, 'head_of_department'::text, 'teacher'::text, 'accountant'::text, 'facility_staff'::text, 'student'::text, 'parent'::text])) ;
CREATE TRIGGER tr_schools_touch BEFORE UPDATE ON public.schools FOR EACH ROW EXECUTE FUNCTION soms_touch_updated_at();
GRANT SELECT ON TABLE public.profiles TO authenticated;
GRANT DELETE ON TABLE public.profiles TO service_role;
GRANT INSERT ON TABLE public.profiles TO service_role;
GRANT REFERENCES ON TABLE public.profiles TO service_role;
GRANT SELECT ON TABLE public.profiles TO service_role;
GRANT TRIGGER ON TABLE public.profiles TO service_role;
GRANT TRUNCATE ON TABLE public.profiles TO service_role;
GRANT UPDATE ON TABLE public.profiles TO service_role;
CREATE POLICY profile_self_read ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING ((id = ( SELECT auth.uid() AS uid))) ;
CREATE TRIGGER tr_profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION soms_touch_updated_at();
GRANT SELECT ON TABLE public.roles TO authenticated;
GRANT DELETE ON TABLE public.roles TO service_role;
GRANT INSERT ON TABLE public.roles TO service_role;
GRANT REFERENCES ON TABLE public.roles TO service_role;
GRANT SELECT ON TABLE public.roles TO service_role;
GRANT TRIGGER ON TABLE public.roles TO service_role;
GRANT TRUNCATE ON TABLE public.roles TO service_role;
GRANT UPDATE ON TABLE public.roles TO service_role;
CREATE POLICY roles_signed_in_read ON public.roles AS PERMISSIVE FOR SELECT TO authenticated USING (true) ;
GRANT DELETE ON TABLE public.permissions TO service_role;
GRANT INSERT ON TABLE public.permissions TO service_role;
GRANT REFERENCES ON TABLE public.permissions TO service_role;
GRANT SELECT ON TABLE public.permissions TO service_role;
GRANT TRIGGER ON TABLE public.permissions TO service_role;
GRANT TRUNCATE ON TABLE public.permissions TO service_role;
GRANT UPDATE ON TABLE public.permissions TO service_role;
GRANT DELETE ON TABLE public.role_permissions TO service_role;
GRANT INSERT ON TABLE public.role_permissions TO service_role;
GRANT REFERENCES ON TABLE public.role_permissions TO service_role;
GRANT SELECT ON TABLE public.role_permissions TO service_role;
GRANT TRIGGER ON TABLE public.role_permissions TO service_role;
GRANT TRUNCATE ON TABLE public.role_permissions TO service_role;
GRANT UPDATE ON TABLE public.role_permissions TO service_role;
GRANT DELETE ON TABLE public.school_memberships TO service_role;
GRANT INSERT ON TABLE public.school_memberships TO service_role;
GRANT REFERENCES ON TABLE public.school_memberships TO service_role;
GRANT SELECT ON TABLE public.school_memberships TO service_role;
GRANT TRIGGER ON TABLE public.school_memberships TO service_role;
GRANT TRUNCATE ON TABLE public.school_memberships TO service_role;
GRANT UPDATE ON TABLE public.school_memberships TO service_role;
GRANT SELECT ON TABLE public.academic_years TO authenticated;
GRANT DELETE ON TABLE public.academic_years TO service_role;
GRANT INSERT ON TABLE public.academic_years TO service_role;
GRANT REFERENCES ON TABLE public.academic_years TO service_role;
GRANT SELECT ON TABLE public.academic_years TO service_role;
GRANT TRIGGER ON TABLE public.academic_years TO service_role;
GRANT TRUNCATE ON TABLE public.academic_years TO service_role;
GRANT UPDATE ON TABLE public.academic_years TO service_role;
CREATE POLICY academic_year_school_read ON public.academic_years AS PERMISSIVE FOR SELECT TO authenticated USING (soms_private.has_role(school_id, ARRAY['system_admin'::text, 'school_management'::text, 'academic_affairs'::text, 'head_of_department'::text, 'teacher'::text, 'accountant'::text, 'facility_staff'::text, 'student'::text, 'parent'::text])) ;
GRANT SELECT ON TABLE public.semesters TO authenticated;
GRANT DELETE ON TABLE public.semesters TO service_role;
GRANT INSERT ON TABLE public.semesters TO service_role;
GRANT REFERENCES ON TABLE public.semesters TO service_role;
GRANT SELECT ON TABLE public.semesters TO service_role;
GRANT TRIGGER ON TABLE public.semesters TO service_role;
GRANT TRUNCATE ON TABLE public.semesters TO service_role;
GRANT UPDATE ON TABLE public.semesters TO service_role;
CREATE POLICY semester_school_read ON public.semesters AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM academic_years ay
  WHERE (ay.id = semesters.academic_year_id)))) ;
GRANT SELECT ON TABLE public.timetable_versions TO authenticated;
GRANT DELETE ON TABLE public.timetable_versions TO service_role;
GRANT INSERT ON TABLE public.timetable_versions TO service_role;
GRANT REFERENCES ON TABLE public.timetable_versions TO service_role;
GRANT SELECT ON TABLE public.timetable_versions TO service_role;
GRANT TRIGGER ON TABLE public.timetable_versions TO service_role;
GRANT TRUNCATE ON TABLE public.timetable_versions TO service_role;
GRANT UPDATE ON TABLE public.timetable_versions TO service_role;
CREATE POLICY timetable_version_read ON public.timetable_versions AS PERMISSIVE FOR SELECT TO authenticated USING (((status = 'published'::text) AND (EXISTS ( SELECT 1
   FROM (semesters se
     JOIN academic_years ay ON ((ay.id = se.academic_year_id)))
  WHERE ((se.id = timetable_versions.semester_id) AND soms_private.has_role(ay.school_id, ARRAY['school_management'::text, 'academic_affairs'::text, 'head_of_department'::text, 'teacher'::text, 'student'::text, 'parent'::text])))))) ;
