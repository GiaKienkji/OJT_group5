-- Run after M0-rls-catalog-fixture.sql on the isolated academic_m0_test database.
DO $$
BEGIN
    IF current_database() <> 'academic_m0_test' THEN
        RAISE EXCEPTION 'Academic API fixture requires academic_m0_test';
    END IF;
END $$;

CREATE TABLE public.grade_levels (
    id uuid PRIMARY KEY,
    school_id uuid NOT NULL REFERENCES public.schools(id),
    grade_number integer NOT NULL CHECK (grade_number BETWEEN 6 AND 12),
    UNIQUE (school_id, grade_number)
);
CREATE TABLE public.classes (
    id uuid PRIMARY KEY,
    school_id uuid NOT NULL REFERENCES public.schools(id),
    academic_year_id uuid NOT NULL REFERENCES public.academic_years(id),
    grade_level_id uuid NOT NULL REFERENCES public.grade_levels(id),
    code text NOT NULL,
    name text NOT NULL,
    capacity integer CHECK (capacity > 0),
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    UNIQUE (academic_year_id, code)
);
CREATE TABLE public.students (
    id uuid PRIMARY KEY,
    school_id uuid NOT NULL REFERENCES public.schools(id),
    user_id uuid UNIQUE REFERENCES public.profiles(id),
    student_code text NOT NULL,
    full_name text NOT NULL,
    date_of_birth date,
    admitted_on date,
    status text NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'transferred', 'graduated', 'withdrawn')),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (school_id, student_code)
);
CREATE TABLE public.class_enrollments (
    id uuid PRIMARY KEY,
    class_id uuid NOT NULL REFERENCES public.classes(id),
    student_id uuid NOT NULL REFERENCES public.students(id),
    enrolled_on date NOT NULL,
    left_on date CHECK (left_on >= enrolled_on),
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'moved', 'completed')),
    UNIQUE (class_id, student_id, enrolled_on)
);
CREATE UNIQUE INDEX ux_student_active_enrollment ON public.class_enrollments (student_id) WHERE status = 'active';
CREATE TABLE public.audit_logs (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    school_id uuid REFERENCES public.schools(id),
    actor_id uuid REFERENCES public.profiles(id),
    table_name text NOT NULL,
    row_id text,
    operation text NOT NULL,
    before_data jsonb,
    after_data jsonb,
    occurred_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.grade_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.subjects (
    id uuid PRIMARY KEY,
    school_id uuid NOT NULL REFERENCES public.schools(id),
    code text NOT NULL,
    name text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    UNIQUE (school_id, code)
);
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- M3 relies on existing production tables. This adds only their fixture shapes.
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS homeroom_staff_id uuid;
CREATE TABLE IF NOT EXISTS public.staff (
    id uuid PRIMARY KEY,
    school_id uuid NOT NULL REFERENCES public.schools(id),
    user_id uuid REFERENCES public.profiles(id),
    employee_code text NOT NULL,
    full_name text NOT NULL,
    kind text NOT NULL,
    employment_status text NOT NULL DEFAULT 'active',
    started_on date,
    ended_on date
);
CREATE TABLE public.teaching_assignments (
    id uuid PRIMARY KEY,
    class_id uuid NOT NULL REFERENCES public.classes(id),
    subject_id uuid NOT NULL REFERENCES public.subjects(id),
    staff_id uuid NOT NULL REFERENCES public.staff(id),
    semester_id uuid NOT NULL REFERENCES public.semesters(id),
    weekly_periods smallint NOT NULL CHECK (weekly_periods > 0),
    status text NOT NULL CHECK (status IN ('draft', 'active', 'inactive')),
    UNIQUE (class_id, subject_id, semester_id, staff_id)
);
CREATE TABLE public.rooms (
    id uuid PRIMARY KEY,
    school_id uuid NOT NULL REFERENCES public.schools(id),
    code text NOT NULL,
    name text,
    capacity integer CHECK (capacity > 0),
    status text NOT NULL DEFAULT 'available'
);
CREATE TABLE public.period_definitions (
    id uuid PRIMARY KEY,
    school_id uuid NOT NULL REFERENCES public.schools(id),
    period_no smallint NOT NULL,
    shift text NOT NULL DEFAULT 'morning',
    starts_at time NOT NULL,
    ends_at time NOT NULL CHECK (ends_at > starts_at)
);
CREATE TABLE public.timetable_slots (
    id uuid PRIMARY KEY,
    version_id uuid NOT NULL REFERENCES public.timetable_versions(id) ON DELETE CASCADE,
    teaching_assignment_id uuid NOT NULL REFERENCES public.teaching_assignments(id),
    room_id uuid NOT NULL REFERENCES public.rooms(id),
    weekday smallint NOT NULL CHECK (weekday BETWEEN 1 AND 7),
    period_id uuid NOT NULL REFERENCES public.period_definitions(id),
    UNIQUE (version_id, room_id, weekday, period_id),
    UNIQUE (version_id, teaching_assignment_id, weekday, period_id)
);
