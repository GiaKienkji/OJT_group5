-- Back up the curricular configuration and homeroom history before using this rollback.
-- Roll back the M3 application first. Existing classes retain their current homeroom_staff_id.
BEGIN;
DROP TABLE public.academic_homeroom_assignments;
DROP TABLE public.academic_class_subjects;
COMMIT;
