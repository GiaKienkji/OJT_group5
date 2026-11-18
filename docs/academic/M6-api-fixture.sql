CREATE TABLE public.substitutions (
    id uuid PRIMARY KEY,
    original_slot_id uuid NOT NULL REFERENCES public.timetable_slots(id),
    on_date date NOT NULL,
    substitute_staff_id uuid NOT NULL REFERENCES public.staff(id),
    confirmed_by uuid REFERENCES public.profiles(id),
    status text NOT NULL,
    UNIQUE (original_slot_id, on_date)
);
CREATE TABLE public.exam_schedules (
    id uuid PRIMARY KEY,
    class_id uuid NOT NULL REFERENCES public.classes(id),
    subject_id uuid NOT NULL REFERENCES public.subjects(id),
    semester_id uuid NOT NULL REFERENCES public.semesters(id),
    starts_at timestamptz NOT NULL,
    ends_at timestamptz NOT NULL CHECK (ends_at > starts_at),
    room_id uuid REFERENCES public.rooms(id),
    status text NOT NULL
);
CREATE TABLE public.attendance_sessions (
    id uuid PRIMARY KEY,
    teaching_assignment_id uuid NOT NULL REFERENCES public.teaching_assignments(id),
    slot_id uuid REFERENCES public.timetable_slots(id),
    session_date date NOT NULL,
    status text NOT NULL
);
CREATE TABLE public.workflow_requests (
    id uuid PRIMARY KEY,
    school_id uuid NOT NULL REFERENCES public.schools(id),
    staff_id uuid REFERENCES public.staff(id),
    request_type text NOT NULL,
    status text NOT NULL,
    starts_on date,
    ends_on date
);
CREATE TABLE public.guardians (
    id uuid PRIMARY KEY,
    school_id uuid NOT NULL REFERENCES public.schools(id),
    user_id uuid REFERENCES public.profiles(id)
);
CREATE TABLE public.student_guardians (
    student_id uuid NOT NULL REFERENCES public.students(id),
    guardian_id uuid NOT NULL REFERENCES public.guardians(id),
    can_view_academics boolean NOT NULL,
    verified_at timestamptz,
    PRIMARY KEY (student_id, guardian_id)
);
