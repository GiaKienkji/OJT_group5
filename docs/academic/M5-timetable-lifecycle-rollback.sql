-- Export the version approvals and effective windows before using this rollback.
BEGIN;
DROP INDEX public.academic_timetable_effective;
ALTER TABLE public.timetable_versions
    DROP CONSTRAINT timetable_approval_fields,
    DROP CONSTRAINT timetable_effective_dates,
    DROP COLUMN effective_until,
    DROP COLUMN effective_from,
    DROP COLUMN approved_at,
    DROP COLUMN approved_by,
    DROP COLUMN approved_revision,
    DROP COLUMN submitted_by,
    DROP COLUMN content_revision;
COMMIT;
