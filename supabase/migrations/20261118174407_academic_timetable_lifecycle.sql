ALTER TABLE public.timetable_versions
    ADD COLUMN content_revision bigint NOT NULL DEFAULT 1 CHECK (content_revision > 0),
    ADD COLUMN submitted_by uuid REFERENCES public.profiles(id),
    ADD COLUMN approved_revision bigint,
    ADD COLUMN approved_by uuid REFERENCES public.profiles(id),
    ADD COLUMN approved_at timestamptz,
    ADD COLUMN effective_from date,
    ADD COLUMN effective_until date,
    ADD CONSTRAINT timetable_approval_fields CHECK (
        (approved_revision IS NULL AND approved_by IS NULL AND approved_at IS NULL)
        OR (approved_revision IS NOT NULL AND approved_by IS NOT NULL AND approved_at IS NOT NULL)
    ),
    ADD CONSTRAINT timetable_effective_dates CHECK (effective_until IS NULL OR
        (effective_from IS NOT NULL AND effective_until >= effective_from));

-- Existing published versions remain visible from the start of the semester.
UPDATE public.timetable_versions v
SET effective_from = se.start_date
FROM public.semesters se
WHERE se.id = v.semester_id AND v.status = 'published';

CREATE INDEX academic_timetable_effective
    ON public.timetable_versions (semester_id, effective_from, effective_until)
    WHERE status IN ('published', 'archived') AND effective_from IS NOT NULL;
