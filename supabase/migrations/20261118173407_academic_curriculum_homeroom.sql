-- Giáo vụ dùng ASP.NET làm đường ghi. Chạy trên database thử trước khi áp dụng.
CREATE TABLE public.academic_class_subjects (
    class_id uuid NOT NULL REFERENCES public.classes(id),
    semester_id uuid NOT NULL REFERENCES public.semesters(id),
    subject_id uuid NOT NULL REFERENCES public.subjects(id),
    weekly_periods smallint NOT NULL CHECK (weekly_periods > 0),
    PRIMARY KEY (class_id, semester_id, subject_id)
);

CREATE TABLE public.academic_homeroom_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id uuid NOT NULL REFERENCES public.classes(id),
    staff_id uuid NOT NULL REFERENCES public.staff(id),
    starts_on date NOT NULL,
    ends_before date CHECK (ends_before >= starts_on)
);

CREATE UNIQUE INDEX academic_homeroom_one_current
    ON public.academic_homeroom_assignments (class_id) WHERE ends_before IS NULL;
CREATE INDEX academic_homeroom_class_history
    ON public.academic_homeroom_assignments (class_id, starts_on DESC);

ALTER TABLE public.academic_class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_homeroom_assignments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.academic_class_subjects, public.academic_homeroom_assignments
    FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.classes c
        LEFT JOIN public.staff st ON st.id = c.homeroom_staff_id AND st.school_id = c.school_id
        WHERE c.homeroom_staff_id IS NOT NULL AND st.id IS NULL
    ) THEN
        RAISE EXCEPTION 'Resolve homeroom staff references outside their class school before migration';
    END IF;
END $$;

-- Hiện trạng được ghi nhận từ ngày áp dụng. Không suy ra ngày bổ nhiệm cũ.
INSERT INTO public.academic_homeroom_assignments (class_id, staff_id, starts_on)
SELECT c.id, c.homeroom_staff_id, (CURRENT_TIMESTAMP AT TIME ZONE s.timezone)::date
FROM public.classes c
JOIN public.schools s ON s.id = c.school_id
WHERE c.homeroom_staff_id IS NOT NULL;
