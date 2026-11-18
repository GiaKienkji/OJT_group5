# Quyền Academic Affairs trên Supabase

Đọc `roles` và `role_permissions` ngày 18/11/2026. Chỉ xuất mã vai trò và quyền, không đọc hồ sơ người dùng. Quyền của người dùng còn phụ thuộc membership và trường đang chọn.

| Vai trò | Quyền đã có |
|---|---|
| `academic_affairs` | `academic.manage`, `analytics.read`, `classes.manage`, `exams.manage`, `homeroom.assign`, `scheduling.manage`, `students.manage`, `subjects.manage`, `teaching_assignments.manage`, `timetables.draft`, `timetables.publish` |
| `facility_staff` | `assets.manage`, `repairs.manage`, `rooms.manage`, `workflow.submit` |
| `head_of_department` | `dept_assignments.view`, `dept_tasks.manage`, `dept_teachers.view`, `dept_timetables.view`, `tasks.manage`, `workflow.submit` |
| `parent` | `parent_academics.view`, `parent_children.view`, `parent_leave.submit`, `workflow.submit` |
| `school_management` | `academic_plans.review`, `academic.manage`, `analytics.read`, `analytics.view`, `announcements.publish`, `announcements.publish_school`, `facilities.approve_purchase`, `finance.summary_view`, `leave_requests.approve`, `operations.view`, `scheduling.approve`, `tasks.manage`, `timetables.approve`, `workflow.approve` |
| `student` | `student_attendance.view`, `student_grades.view`, `student_profile.view`, `student_timetable.view` |
| `system_admin` | `audit_logs.read`, `health.view`, `identity.manage`, `roles.manage`, `school.configure`, `system.configure`, `users.create`, `users.deactivate`, `users.read`, `users.reset_password`, `users.update` |
| `teacher` | `assessments.create`, `assigned_classes.view`, `assigned_students.view`, `attendance.record`, `attendance.update`, `attendance.write`, `grades.change_request`, `grades.enter`, `grades.write`, `homeroom.attendance_view`, `homeroom.class_view`, `homeroom.leave_approve`, `leave_requests.create`, `teaching_schedule.view`, `workflow.submit` |
