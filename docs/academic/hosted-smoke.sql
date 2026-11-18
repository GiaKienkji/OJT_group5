\set ON_ERROR_STOP on

BEGIN TRANSACTION READ ONLY;
SELECT version, name FROM supabase_migrations.schema_migrations
WHERE version IN ('20261118173407', '20261118174407') ORDER BY version;

DO $$
BEGIN
    IF (SELECT count(*) FROM supabase_migrations.schema_migrations
        WHERE version IN ('20261118173407', '20261118174407')) <> 2 THEN
        RAISE EXCEPTION 'Expected both TV2 migration versions';
    END IF;
    IF (SELECT count(*) FROM pg_class
        WHERE relnamespace = 'public'::regnamespace AND relrowsecurity
          AND relname IN ('academic_class_subjects', 'academic_homeroom_assignments')) <> 2 THEN
        RAISE EXCEPTION 'Expected both TV2 tables with RLS enabled';
    END IF;
    IF EXISTS (
        SELECT FROM (VALUES ('anon'), ('authenticated')) AS r(role_name)
        CROSS JOIN (VALUES ('public.academic_class_subjects'), ('public.academic_homeroom_assignments')) AS t(table_name)
        WHERE has_table_privilege(r.role_name, t.table_name, 'SELECT, INSERT, UPDATE, DELETE')
    ) THEN
        RAISE EXCEPTION 'Unexpected Data API table privilege';
    END IF;
    IF EXISTS (
        SELECT FROM public.classes c
        WHERE c.homeroom_staff_id IS NOT NULL AND NOT EXISTS (
            SELECT FROM public.academic_homeroom_assignments h
            WHERE h.class_id = c.id AND h.staff_id = c.homeroom_staff_id AND h.ends_before IS NULL
        )
    ) OR EXISTS (SELECT FROM public.timetable_versions WHERE status = 'published' AND effective_from IS NULL) THEN
        RAISE EXCEPTION 'Existing rows did not receive the expected backfill';
    END IF;
END $$;

SELECT (SELECT count(*) FROM public.academic_class_subjects) AS curriculum,
       (SELECT count(*) FROM public.academic_homeroom_assignments) AS homerooms,
       (SELECT count(*) FROM public.timetable_versions WHERE status = 'published') AS published_versions;
COMMIT;

-- All synthetic records belong to this test's private school and are rolled back.
SELECT gen_random_uuid() AS smoke_school \gset
BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '20s';
SELECT set_config('soms.smoke_school', :'smoke_school', true) AS stopgap \gset

DO $$
DECLARE
    school uuid := current_setting('soms.smoke_school')::uuid;
    school_year uuid := gen_random_uuid();
    term uuid := gen_random_uuid();
    grade uuid := gen_random_uuid();
    classroom uuid := gen_random_uuid();
    subject uuid := gen_random_uuid();
    teacher uuid := gen_random_uuid();
    room uuid := gen_random_uuid();
    period uuid := gen_random_uuid();
    assignment uuid := gen_random_uuid();
    version uuid := gen_random_uuid();
BEGIN
    INSERT INTO public.schools (id, code, name) VALUES (school, 'TV2-SMOKE-' || school, 'TV2 rollback smoke');
    INSERT INTO public.academic_years (id, school_id, name, start_date, end_date)
    VALUES (school_year, school, 'Smoke year', current_date, current_date + 90);
    INSERT INTO public.semesters (id, academic_year_id, name, ordinal, start_date, end_date)
    VALUES (term, school_year, 'Smoke semester', 1, current_date, current_date + 90);
    INSERT INTO public.grade_levels (id, school_id, grade_number) VALUES (grade, school, 6);
    INSERT INTO public.staff (id, school_id, employee_code, full_name, kind)
    VALUES (teacher, school, 'SMOKE', 'Smoke teacher', 'teacher');
    INSERT INTO public.classes (id, school_id, academic_year_id, grade_level_id, code, name, homeroom_staff_id)
    VALUES (classroom, school, school_year, grade, 'SMOKE', 'Smoke class', teacher);
    INSERT INTO public.subjects (id, school_id, code, name) VALUES (subject, school, 'SMOKE', 'Smoke subject');
    INSERT INTO public.academic_class_subjects (class_id, semester_id, subject_id, weekly_periods)
    VALUES (classroom, term, subject, 1);
    INSERT INTO public.academic_homeroom_assignments (class_id, staff_id, starts_on)
    VALUES (classroom, teacher, current_date);
    INSERT INTO public.rooms (id, school_id, code) VALUES (room, school, 'SMOKE');
    INSERT INTO public.period_definitions (id, school_id, period_no, starts_at, ends_at)
    VALUES (period, school, 1, '07:00', '08:00');
    INSERT INTO public.teaching_assignments (id, class_id, subject_id, staff_id, semester_id, weekly_periods, status)
    VALUES (assignment, classroom, subject, teacher, term, 1, 'active');
    INSERT INTO public.timetable_versions (id, semester_id, version_no) VALUES (version, term, 1);
    INSERT INTO public.timetable_slots (version_id, teaching_assignment_id, room_id, weekday, period_id)
    VALUES (version, assignment, room, 1, period);
    UPDATE public.timetable_versions SET content_revision = 2 WHERE id = version;
    UPDATE public.timetable_versions SET status = 'published', effective_from = current_date WHERE id = version;

    IF NOT EXISTS (SELECT FROM public.timetable_versions
        WHERE id = version AND content_revision = 2 AND status = 'published'
          AND effective_from = current_date AND published_at IS NOT NULL) THEN
        RAISE EXCEPTION 'Timetable write or publish trigger did not produce expected values';
    END IF;
    IF NOT EXISTS (SELECT FROM public.academic_homeroom_assignments WHERE class_id = classroom AND staff_id = teacher)
        OR NOT EXISTS (SELECT FROM public.academic_class_subjects WHERE class_id = classroom AND subject_id = subject) THEN
        RAISE EXCEPTION 'New table writes did not round trip';
    END IF;
END $$;
ROLLBACK;

SELECT NOT EXISTS (SELECT FROM public.schools WHERE id = :'smoke_school'::uuid) AS test_school_rolled_back \gset
\if :test_school_rolled_back
\echo 'Hosted database smoke passed. No test rows persisted.'
\else
\echo 'Hosted database smoke failed. Test school was found after rollback.'
\quit 1
\endif
