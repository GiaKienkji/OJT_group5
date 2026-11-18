-- Chạy bằng đúng DB login của ứng dụng. Chỉ đọc catalog, không đọc bản ghi nghiệp vụ.
BEGIN TRANSACTION READ ONLY;

SELECT current_database() AS database_name, current_setting('server_version') AS server_version,
       session_user AS login_role, current_user AS effective_role,
       r.rolsuper AS superuser, r.rolbypassrls AS bypass_rls
FROM pg_roles r
WHERE r.rolname = current_user;

SELECT c.relname AS table_name, pg_get_userbyid(c.relowner) AS table_owner,
       c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced,
       row_security_active(c.oid) AS rls_applies_to_current_user,
       has_schema_privilege(n.oid, 'USAGE') AS schema_usage,
       has_table_privilege(c.oid, 'SELECT') AS can_select,
       has_table_privilege(c.oid, 'INSERT') AS can_insert,
       has_table_privilege(c.oid, 'UPDATE') AS can_update,
       has_table_privilege(c.oid, 'DELETE') AS can_delete
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
  AND c.relname IN (
    'schools', 'profiles', 'school_memberships', 'roles', 'role_permissions', 'permissions',
    'academic_years', 'semesters', 'grade_levels', 'students', 'classes', 'class_enrollments',
    'subjects', 'teaching_assignments', 'staff', 'rooms', 'period_definitions',
    'timetable_versions', 'timetable_slots', 'substitutions', 'schedule_change_requests',
    'exam_schedules', 'attendance_sessions', 'assessments', 'grades', 'guardians', 'student_guardians',
    'workflow_requests', 'approval_steps', 'workflow_events', 'audit_logs'
  )
ORDER BY c.relname;

ROLLBACK;
