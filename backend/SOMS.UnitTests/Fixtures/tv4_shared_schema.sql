-- Schema-only pg_catalog capture, 2026-11-18; no source rows/roles/secrets. auth.users includes only columns consumed by unchanged AuthService. Disposable DB only.
CREATE SCHEMA auth;
CREATE TABLE auth.users(id uuid PRIMARY KEY,email text NULL,encrypted_password text NULL);
CREATE TABLE public."schools" (
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
CREATE TABLE public."profiles" (
  "id" uuid NOT NULL,
  "full_name" text DEFAULT ''::text NOT NULL,
  "phone" text,
  "avatar_path" text,
  "status" text DEFAULT 'active'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."roles" (
  "code" text NOT NULL,
  "name_vi" text NOT NULL,
  "description" text
);
CREATE TABLE public."permissions" (
  "code" text NOT NULL,
  "description" text NOT NULL
);
CREATE TABLE public."role_permissions" (
  "role_code" text NOT NULL,
  "permission_code" text NOT NULL
);
CREATE TABLE public."school_memberships" (
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
CREATE TABLE public."departments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "school_id" uuid NOT NULL,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "head_teacher_id" uuid
);
CREATE TABLE public."staff" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "school_id" uuid NOT NULL,
  "user_id" uuid,
  "employee_code" text NOT NULL,
  "full_name" text NOT NULL,
  "kind" text NOT NULL,
  "department_id" uuid,
  "started_on" date,
  "ended_on" date,
  "employment_status" text DEFAULT 'active'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."academic_years" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "school_id" uuid NOT NULL,
  "name" text NOT NULL,
  "start_date" date NOT NULL,
  "end_date" date NOT NULL,
  "status" text DEFAULT 'planned'::text NOT NULL
);
CREATE TABLE public."semesters" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "academic_year_id" uuid NOT NULL,
  "name" text NOT NULL,
  "ordinal" smallint NOT NULL,
  "start_date" date NOT NULL,
  "end_date" date NOT NULL,
  "status" text DEFAULT 'planned'::text NOT NULL
);
CREATE TABLE public."grade_levels" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "school_id" uuid NOT NULL,
  "grade_number" smallint NOT NULL
);
CREATE TABLE public."classes" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "school_id" uuid NOT NULL,
  "academic_year_id" uuid NOT NULL,
  "grade_level_id" uuid NOT NULL,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "homeroom_staff_id" uuid,
  "capacity" integer,
  "status" text DEFAULT 'active'::text NOT NULL
);
CREATE TABLE public."students" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "school_id" uuid NOT NULL,
  "user_id" uuid,
  "student_code" text NOT NULL,
  "full_name" text NOT NULL,
  "date_of_birth" date,
  "status" text DEFAULT 'enrolled'::text NOT NULL,
  "admitted_on" date,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."class_enrollments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "class_id" uuid NOT NULL,
  "student_id" uuid NOT NULL,
  "enrolled_on" date DEFAULT CURRENT_DATE NOT NULL,
  "left_on" date,
  "status" text DEFAULT 'active'::text NOT NULL
);
CREATE TABLE public."guardians" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "school_id" uuid NOT NULL,
  "user_id" uuid,
  "full_name" text NOT NULL,
  "phone" text,
  "email" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."student_guardians" (
  "student_id" uuid NOT NULL,
  "guardian_id" uuid NOT NULL,
  "relationship" text NOT NULL,
  "is_primary" boolean DEFAULT false NOT NULL,
  "can_view_academics" boolean DEFAULT true NOT NULL,
  "can_submit_leave" boolean DEFAULT true NOT NULL,
  "can_view_finance" boolean DEFAULT true NOT NULL,
  "verified_at" timestamp with time zone
);
CREATE TABLE public."fee_types" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "school_id" uuid NOT NULL,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL
);
CREATE TABLE public."fee_campaigns" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "school_id" uuid NOT NULL,
  "academic_year_id" uuid NOT NULL,
  "name" text NOT NULL,
  "due_on" date,
  "status" text DEFAULT 'draft'::text NOT NULL
);
CREATE TABLE public."student_charges" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "campaign_id" uuid NOT NULL,
  "student_id" uuid NOT NULL,
  "fee_type_id" uuid NOT NULL,
  "amount" numeric(14,2) NOT NULL,
  "discount" numeric(14,2) DEFAULT 0 NOT NULL,
  "due_on" date,
  "note" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."payments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "school_id" uuid NOT NULL,
  "student_id" uuid NOT NULL,
  "amount" numeric(14,2) NOT NULL,
  "method" text NOT NULL,
  "external_reference" text,
  "paid_at" timestamp with time zone DEFAULT now() NOT NULL,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "recorded_by" uuid,
  "verified_by" uuid,
  "verified_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."payment_allocations" (
  "payment_id" uuid NOT NULL,
  "charge_id" uuid NOT NULL,
  "amount" numeric(14,2) NOT NULL
);
CREATE TABLE public."payment_adjustments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "payment_id" uuid NOT NULL,
  "adjustment_type" text NOT NULL,
  "amount" numeric(14,2) NOT NULL,
  "reason" text NOT NULL,
  "approved_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."rooms" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "school_id" uuid NOT NULL,
  "code" text NOT NULL,
  "name" text,
  "room_type" text DEFAULT 'classroom'::text NOT NULL,
  "capacity" integer,
  "status" text DEFAULT 'available'::text NOT NULL
);
CREATE TABLE public."assets" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "school_id" uuid NOT NULL,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "category" text NOT NULL,
  "room_id" uuid,
  "acquired_on" date,
  "purchase_cost" numeric(14,2),
  "status" text DEFAULT 'working'::text NOT NULL,
  "serial_no" text,
  "notes" text
);
CREATE TABLE public."asset_loans" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "asset_id" uuid NOT NULL,
  "borrower_user_id" uuid NOT NULL,
  "requested_at" timestamp with time zone DEFAULT now() NOT NULL,
  "due_at" timestamp with time zone,
  "checked_out_at" timestamp with time zone,
  "returned_at" timestamp with time zone,
  "status" text DEFAULT 'requested'::text NOT NULL,
  "approved_by" uuid,
  "notes" text
);
CREATE TABLE public."asset_incidents" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "asset_id" uuid NOT NULL,
  "reported_by" uuid NOT NULL,
  "priority" text DEFAULT 'medium'::text NOT NULL,
  "description" text NOT NULL,
  "reported_at" timestamp with time zone DEFAULT now() NOT NULL,
  "status" text DEFAULT 'open'::text NOT NULL,
  "assignee_id" uuid,
  "resolved_at" timestamp with time zone
);
CREATE TABLE public."maintenance_jobs" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "asset_id" uuid NOT NULL,
  "incident_id" uuid,
  "assigned_staff_id" uuid,
  "scheduled_for" date,
  "started_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "cost" numeric(14,2) DEFAULT 0 NOT NULL,
  "status" text DEFAULT 'planned'::text NOT NULL,
  "result_notes" text
);
CREATE TABLE public."workflow_requests" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "school_id" uuid NOT NULL,
  "requester_id" uuid NOT NULL,
  "request_type" text NOT NULL,
  "subject" text NOT NULL,
  "description" text,
  "student_id" uuid,
  "staff_id" uuid,
  "starts_on" date,
  "ends_on" date,
  "status" text DEFAULT 'draft'::text NOT NULL,
  "submitted_at" timestamp with time zone,
  "decided_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."approval_steps" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "request_id" uuid NOT NULL,
  "step_no" integer NOT NULL,
  "assigned_role_code" text,
  "assigned_user_id" uuid,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "acted_by" uuid,
  "acted_at" timestamp with time zone,
  "comment" text
);
CREATE TABLE public."workflow_events" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "request_id" uuid NOT NULL,
  "actor_id" uuid,
  "event_type" text NOT NULL,
  "old_status" text,
  "new_status" text,
  "note" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."audit_logs" (
  "id" bigint GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  "school_id" uuid,
  "actor_id" uuid,
  "table_name" text NOT NULL,
  "row_id" text,
  "operation" text NOT NULL,
  "before_data" jsonb,
  "after_data" jsonb,
  "occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."notifications" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "title" text NOT NULL,
  "message" text NOT NULL,
  "kind" text DEFAULT 'info'::text NOT NULL,
  "payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "read_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public."academic_years" ADD CONSTRAINT "academic_years_check" CHECK ((end_date > start_date));
ALTER TABLE public."academic_years" ADD CONSTRAINT "academic_years_status_check" CHECK ((status = ANY (ARRAY['planned'::text, 'active'::text, 'closed'::text])));
ALTER TABLE public."academic_years" ADD CONSTRAINT "academic_years_pkey" PRIMARY KEY (id);
ALTER TABLE public."academic_years" ADD CONSTRAINT "academic_years_school_id_name_key" UNIQUE (school_id, name);
ALTER TABLE public."approval_steps" ADD CONSTRAINT "approval_steps_check" CHECK (((assigned_role_code IS NOT NULL) OR (assigned_user_id IS NOT NULL)));
ALTER TABLE public."approval_steps" ADD CONSTRAINT "approval_steps_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'skipped'::text])));
ALTER TABLE public."approval_steps" ADD CONSTRAINT "approval_steps_step_no_check" CHECK ((step_no > 0));
ALTER TABLE public."approval_steps" ADD CONSTRAINT "approval_steps_pkey" PRIMARY KEY (id);
ALTER TABLE public."approval_steps" ADD CONSTRAINT "approval_steps_request_id_step_no_key" UNIQUE (request_id, step_no);
ALTER TABLE public."asset_incidents" ADD CONSTRAINT "asset_incidents_priority_check" CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text])));
ALTER TABLE public."asset_incidents" ADD CONSTRAINT "asset_incidents_status_check" CHECK ((status = ANY (ARRAY['open'::text, 'assigned'::text, 'in_progress'::text, 'resolved'::text, 'closed'::text])));
ALTER TABLE public."asset_incidents" ADD CONSTRAINT "asset_incidents_pkey" PRIMARY KEY (id);
ALTER TABLE public."asset_loans" ADD CONSTRAINT "asset_loans_check" CHECK (((returned_at IS NULL) OR (checked_out_at IS NOT NULL)));
ALTER TABLE public."asset_loans" ADD CONSTRAINT "asset_loans_status_check" CHECK ((status = ANY (ARRAY['requested'::text, 'approved'::text, 'rejected'::text, 'checked_out'::text, 'returned'::text, 'cancelled'::text])));
ALTER TABLE public."asset_loans" ADD CONSTRAINT "asset_loans_pkey" PRIMARY KEY (id);
ALTER TABLE public."assets" ADD CONSTRAINT "assets_purchase_cost_check" CHECK ((purchase_cost >= (0)::numeric));
ALTER TABLE public."assets" ADD CONSTRAINT "assets_status_check" CHECK ((status = ANY (ARRAY['working'::text, 'damaged'::text, 'maintenance'::text, 'retired'::text, 'lost'::text])));
ALTER TABLE public."assets" ADD CONSTRAINT "assets_pkey" PRIMARY KEY (id);
ALTER TABLE public."assets" ADD CONSTRAINT "assets_school_id_code_key" UNIQUE (school_id, code);
ALTER TABLE public."audit_logs" ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY (id);
ALTER TABLE public."class_enrollments" ADD CONSTRAINT "class_enrollments_check" CHECK (((left_on IS NULL) OR (left_on >= enrolled_on)));
ALTER TABLE public."class_enrollments" ADD CONSTRAINT "class_enrollments_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'moved'::text, 'completed'::text])));
ALTER TABLE public."class_enrollments" ADD CONSTRAINT "class_enrollments_pkey" PRIMARY KEY (id);
ALTER TABLE public."class_enrollments" ADD CONSTRAINT "class_enrollments_class_id_student_id_enrolled_on_key" UNIQUE (class_id, student_id, enrolled_on);
ALTER TABLE public."classes" ADD CONSTRAINT "classes_capacity_check" CHECK ((capacity > 0));
ALTER TABLE public."classes" ADD CONSTRAINT "classes_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'archived'::text])));
ALTER TABLE public."classes" ADD CONSTRAINT "classes_pkey" PRIMARY KEY (id);
ALTER TABLE public."classes" ADD CONSTRAINT "classes_academic_year_id_code_key" UNIQUE (academic_year_id, code);
ALTER TABLE public."departments" ADD CONSTRAINT "departments_pkey" PRIMARY KEY (id);
ALTER TABLE public."departments" ADD CONSTRAINT "departments_school_id_code_key" UNIQUE (school_id, code);
ALTER TABLE public."fee_campaigns" ADD CONSTRAINT "fee_campaigns_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'issued'::text, 'closed'::text])));
ALTER TABLE public."fee_campaigns" ADD CONSTRAINT "fee_campaigns_pkey" PRIMARY KEY (id);
ALTER TABLE public."fee_types" ADD CONSTRAINT "fee_types_pkey" PRIMARY KEY (id);
ALTER TABLE public."fee_types" ADD CONSTRAINT "fee_types_school_id_code_key" UNIQUE (school_id, code);
ALTER TABLE public."grade_levels" ADD CONSTRAINT "grade_levels_grade_number_check" CHECK (((grade_number >= 6) AND (grade_number <= 12)));
ALTER TABLE public."grade_levels" ADD CONSTRAINT "grade_levels_pkey" PRIMARY KEY (id);
ALTER TABLE public."grade_levels" ADD CONSTRAINT "grade_levels_school_id_grade_number_key" UNIQUE (school_id, grade_number);
ALTER TABLE public."guardians" ADD CONSTRAINT "guardians_pkey" PRIMARY KEY (id);
ALTER TABLE public."maintenance_jobs" ADD CONSTRAINT "maintenance_jobs_cost_check" CHECK ((cost >= (0)::numeric));
ALTER TABLE public."maintenance_jobs" ADD CONSTRAINT "maintenance_jobs_status_check" CHECK ((status = ANY (ARRAY['planned'::text, 'in_progress'::text, 'done'::text, 'cancelled'::text])));
ALTER TABLE public."maintenance_jobs" ADD CONSTRAINT "maintenance_jobs_pkey" PRIMARY KEY (id);
ALTER TABLE public."notifications" ADD CONSTRAINT "notifications_pkey" PRIMARY KEY (id);
ALTER TABLE public."payment_adjustments" ADD CONSTRAINT "payment_adjustments_adjustment_type_check" CHECK ((adjustment_type = ANY (ARRAY['refund'::text, 'correction'::text])));
ALTER TABLE public."payment_adjustments" ADD CONSTRAINT "payment_adjustments_amount_check" CHECK ((amount > (0)::numeric));
ALTER TABLE public."payment_adjustments" ADD CONSTRAINT "payment_adjustments_pkey" PRIMARY KEY (id);
ALTER TABLE public."payment_allocations" ADD CONSTRAINT "payment_allocations_amount_check" CHECK ((amount > (0)::numeric));
ALTER TABLE public."payment_allocations" ADD CONSTRAINT "payment_allocations_pkey" PRIMARY KEY (payment_id, charge_id);
ALTER TABLE public."payments" ADD CONSTRAINT "payments_amount_check" CHECK ((amount > (0)::numeric));
ALTER TABLE public."payments" ADD CONSTRAINT "payments_method_check" CHECK ((method = ANY (ARRAY['cash'::text, 'bank_transfer'::text, 'gateway'::text])));
ALTER TABLE public."payments" ADD CONSTRAINT "payments_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'verified'::text, 'rejected'::text, 'refunded'::text])));
ALTER TABLE public."payments" ADD CONSTRAINT "payments_pkey" PRIMARY KEY (id);
ALTER TABLE public."permissions" ADD CONSTRAINT "permissions_pkey" PRIMARY KEY (code);
ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'suspended'::text])));
ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_pkey" PRIMARY KEY (id);
ALTER TABLE public."role_permissions" ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY (role_code, permission_code);
ALTER TABLE public."roles" ADD CONSTRAINT "roles_pkey" PRIMARY KEY (code);
ALTER TABLE public."rooms" ADD CONSTRAINT "rooms_capacity_check" CHECK ((capacity > 0));
ALTER TABLE public."rooms" ADD CONSTRAINT "rooms_status_check" CHECK ((status = ANY (ARRAY['available'::text, 'maintenance'::text, 'closed'::text])));
ALTER TABLE public."rooms" ADD CONSTRAINT "rooms_pkey" PRIMARY KEY (id);
ALTER TABLE public."rooms" ADD CONSTRAINT "rooms_school_id_code_key" UNIQUE (school_id, code);
ALTER TABLE public."school_memberships" ADD CONSTRAINT "school_memberships_check" CHECK (((valid_to IS NULL) OR (valid_from IS NULL) OR (valid_to >= valid_from)));
ALTER TABLE public."school_memberships" ADD CONSTRAINT "school_memberships_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text])));
ALTER TABLE public."school_memberships" ADD CONSTRAINT "school_memberships_pkey" PRIMARY KEY (id);
ALTER TABLE public."school_memberships" ADD CONSTRAINT "school_memberships_school_id_user_id_role_code_key" UNIQUE (school_id, user_id, role_code);
ALTER TABLE public."schools" ADD CONSTRAINT "schools_level_check" CHECK ((level = ANY (ARRAY['middle'::text, 'high'::text, 'combined'::text])));
ALTER TABLE public."schools" ADD CONSTRAINT "schools_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text])));
ALTER TABLE public."schools" ADD CONSTRAINT "schools_pkey" PRIMARY KEY (id);
ALTER TABLE public."schools" ADD CONSTRAINT "schools_code_key" UNIQUE (code);
ALTER TABLE public."semesters" ADD CONSTRAINT "semesters_check" CHECK ((end_date >= start_date));
ALTER TABLE public."semesters" ADD CONSTRAINT "semesters_ordinal_check" CHECK (((ordinal >= 1) AND (ordinal <= 3)));
ALTER TABLE public."semesters" ADD CONSTRAINT "semesters_status_check" CHECK ((status = ANY (ARRAY['planned'::text, 'active'::text, 'closed'::text])));
ALTER TABLE public."semesters" ADD CONSTRAINT "semesters_pkey" PRIMARY KEY (id);
ALTER TABLE public."semesters" ADD CONSTRAINT "semesters_academic_year_id_ordinal_key" UNIQUE (academic_year_id, ordinal);
ALTER TABLE public."staff" ADD CONSTRAINT "staff_check" CHECK (((ended_on IS NULL) OR (started_on IS NULL) OR (ended_on >= started_on)));
ALTER TABLE public."staff" ADD CONSTRAINT "staff_employment_status_check" CHECK ((employment_status = ANY (ARRAY['active'::text, 'leave'::text, 'inactive'::text])));
ALTER TABLE public."staff" ADD CONSTRAINT "staff_kind_check" CHECK ((kind = ANY (ARRAY['teacher'::text, 'management'::text, 'academic_affairs'::text, 'accountant'::text, 'facility'::text, 'other'::text])));
ALTER TABLE public."staff" ADD CONSTRAINT "staff_pkey" PRIMARY KEY (id);
ALTER TABLE public."staff" ADD CONSTRAINT "staff_school_id_employee_code_key" UNIQUE (school_id, employee_code);
ALTER TABLE public."staff" ADD CONSTRAINT "staff_user_id_key" UNIQUE (user_id);
ALTER TABLE public."student_charges" ADD CONSTRAINT "student_charges_amount_check" CHECK ((amount >= (0)::numeric));
ALTER TABLE public."student_charges" ADD CONSTRAINT "student_charges_check" CHECK ((discount <= amount));
ALTER TABLE public."student_charges" ADD CONSTRAINT "student_charges_discount_check" CHECK ((discount >= (0)::numeric));
ALTER TABLE public."student_charges" ADD CONSTRAINT "student_charges_pkey" PRIMARY KEY (id);
ALTER TABLE public."student_charges" ADD CONSTRAINT "student_charges_campaign_id_student_id_fee_type_id_key" UNIQUE (campaign_id, student_id, fee_type_id);
ALTER TABLE public."student_guardians" ADD CONSTRAINT "student_guardians_relationship_check" CHECK ((relationship = ANY (ARRAY['mother'::text, 'father'::text, 'guardian'::text, 'other'::text])));
ALTER TABLE public."student_guardians" ADD CONSTRAINT "student_guardians_pkey" PRIMARY KEY (student_id, guardian_id);
ALTER TABLE public."students" ADD CONSTRAINT "students_status_check" CHECK ((status = ANY (ARRAY['enrolled'::text, 'transferred'::text, 'graduated'::text, 'withdrawn'::text])));
ALTER TABLE public."students" ADD CONSTRAINT "students_pkey" PRIMARY KEY (id);
ALTER TABLE public."students" ADD CONSTRAINT "students_school_id_student_code_key" UNIQUE (school_id, student_code);
ALTER TABLE public."students" ADD CONSTRAINT "students_user_id_key" UNIQUE (user_id);
ALTER TABLE public."workflow_events" ADD CONSTRAINT "workflow_events_pkey" PRIMARY KEY (id);
ALTER TABLE public."workflow_requests" ADD CONSTRAINT "workflow_requests_check" CHECK (((ends_on IS NULL) OR (starts_on IS NULL) OR (ends_on >= starts_on)));
ALTER TABLE public."workflow_requests" ADD CONSTRAINT "workflow_requests_request_type_check" CHECK ((request_type = ANY (ARRAY['teacher_leave'::text, 'student_leave'::text, 'schedule_change'::text, 'purchase'::text, 'repair'::text, 'grade_change'::text, 'other'::text])));
ALTER TABLE public."workflow_requests" ADD CONSTRAINT "workflow_requests_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'submitted'::text, 'in_review'::text, 'approved'::text, 'rejected'::text, 'cancelled'::text, 'completed'::text])));
ALTER TABLE public."workflow_requests" ADD CONSTRAINT "workflow_requests_pkey" PRIMARY KEY (id);
ALTER TABLE public."academic_years" ADD CONSTRAINT "academic_years_school_id_fkey" FOREIGN KEY (school_id) REFERENCES schools(id);
ALTER TABLE public."approval_steps" ADD CONSTRAINT "approval_steps_acted_by_fkey" FOREIGN KEY (acted_by) REFERENCES profiles(id);
ALTER TABLE public."approval_steps" ADD CONSTRAINT "approval_steps_assigned_role_code_fkey" FOREIGN KEY (assigned_role_code) REFERENCES roles(code);
ALTER TABLE public."approval_steps" ADD CONSTRAINT "approval_steps_assigned_user_id_fkey" FOREIGN KEY (assigned_user_id) REFERENCES profiles(id);
ALTER TABLE public."approval_steps" ADD CONSTRAINT "approval_steps_request_id_fkey" FOREIGN KEY (request_id) REFERENCES workflow_requests(id) ON DELETE CASCADE;
ALTER TABLE public."asset_incidents" ADD CONSTRAINT "asset_incidents_asset_id_fkey" FOREIGN KEY (asset_id) REFERENCES assets(id);
ALTER TABLE public."asset_incidents" ADD CONSTRAINT "asset_incidents_assignee_id_fkey" FOREIGN KEY (assignee_id) REFERENCES staff(id);
ALTER TABLE public."asset_incidents" ADD CONSTRAINT "asset_incidents_reported_by_fkey" FOREIGN KEY (reported_by) REFERENCES profiles(id);
ALTER TABLE public."asset_loans" ADD CONSTRAINT "asset_loans_approved_by_fkey" FOREIGN KEY (approved_by) REFERENCES profiles(id);
ALTER TABLE public."asset_loans" ADD CONSTRAINT "asset_loans_asset_id_fkey" FOREIGN KEY (asset_id) REFERENCES assets(id);
ALTER TABLE public."asset_loans" ADD CONSTRAINT "asset_loans_borrower_user_id_fkey" FOREIGN KEY (borrower_user_id) REFERENCES profiles(id);
ALTER TABLE public."assets" ADD CONSTRAINT "assets_room_id_fkey" FOREIGN KEY (room_id) REFERENCES rooms(id);
ALTER TABLE public."assets" ADD CONSTRAINT "assets_school_id_fkey" FOREIGN KEY (school_id) REFERENCES schools(id);
ALTER TABLE public."audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES profiles(id);
ALTER TABLE public."audit_logs" ADD CONSTRAINT "audit_logs_school_id_fkey" FOREIGN KEY (school_id) REFERENCES schools(id);
ALTER TABLE public."class_enrollments" ADD CONSTRAINT "class_enrollments_class_id_fkey" FOREIGN KEY (class_id) REFERENCES classes(id);
ALTER TABLE public."class_enrollments" ADD CONSTRAINT "class_enrollments_student_id_fkey" FOREIGN KEY (student_id) REFERENCES students(id);
ALTER TABLE public."classes" ADD CONSTRAINT "classes_academic_year_id_fkey" FOREIGN KEY (academic_year_id) REFERENCES academic_years(id);
ALTER TABLE public."classes" ADD CONSTRAINT "classes_grade_level_id_fkey" FOREIGN KEY (grade_level_id) REFERENCES grade_levels(id);
ALTER TABLE public."classes" ADD CONSTRAINT "classes_homeroom_staff_id_fkey" FOREIGN KEY (homeroom_staff_id) REFERENCES staff(id);
ALTER TABLE public."classes" ADD CONSTRAINT "classes_school_id_fkey" FOREIGN KEY (school_id) REFERENCES schools(id);
ALTER TABLE public."departments" ADD CONSTRAINT "departments_school_id_fkey" FOREIGN KEY (school_id) REFERENCES schools(id);
ALTER TABLE public."departments" ADD CONSTRAINT "fk_department_head" FOREIGN KEY (head_teacher_id) REFERENCES staff(id);
ALTER TABLE public."fee_campaigns" ADD CONSTRAINT "fee_campaigns_academic_year_id_fkey" FOREIGN KEY (academic_year_id) REFERENCES academic_years(id);
ALTER TABLE public."fee_campaigns" ADD CONSTRAINT "fee_campaigns_school_id_fkey" FOREIGN KEY (school_id) REFERENCES schools(id);
ALTER TABLE public."fee_types" ADD CONSTRAINT "fee_types_school_id_fkey" FOREIGN KEY (school_id) REFERENCES schools(id);
ALTER TABLE public."grade_levels" ADD CONSTRAINT "grade_levels_school_id_fkey" FOREIGN KEY (school_id) REFERENCES schools(id);
ALTER TABLE public."guardians" ADD CONSTRAINT "guardians_school_id_fkey" FOREIGN KEY (school_id) REFERENCES schools(id);
ALTER TABLE public."guardians" ADD CONSTRAINT "guardians_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id);
ALTER TABLE public."maintenance_jobs" ADD CONSTRAINT "maintenance_jobs_asset_id_fkey" FOREIGN KEY (asset_id) REFERENCES assets(id);
ALTER TABLE public."maintenance_jobs" ADD CONSTRAINT "maintenance_jobs_assigned_staff_id_fkey" FOREIGN KEY (assigned_staff_id) REFERENCES staff(id);
ALTER TABLE public."maintenance_jobs" ADD CONSTRAINT "maintenance_jobs_incident_id_fkey" FOREIGN KEY (incident_id) REFERENCES asset_incidents(id);
ALTER TABLE public."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public."payment_adjustments" ADD CONSTRAINT "payment_adjustments_approved_by_fkey" FOREIGN KEY (approved_by) REFERENCES profiles(id);
ALTER TABLE public."payment_adjustments" ADD CONSTRAINT "payment_adjustments_payment_id_fkey" FOREIGN KEY (payment_id) REFERENCES payments(id);
ALTER TABLE public."payment_allocations" ADD CONSTRAINT "payment_allocations_charge_id_fkey" FOREIGN KEY (charge_id) REFERENCES student_charges(id);
ALTER TABLE public."payment_allocations" ADD CONSTRAINT "payment_allocations_payment_id_fkey" FOREIGN KEY (payment_id) REFERENCES payments(id);
ALTER TABLE public."payments" ADD CONSTRAINT "payments_recorded_by_fkey" FOREIGN KEY (recorded_by) REFERENCES profiles(id);
ALTER TABLE public."payments" ADD CONSTRAINT "payments_school_id_fkey" FOREIGN KEY (school_id) REFERENCES schools(id);
ALTER TABLE public."payments" ADD CONSTRAINT "payments_student_id_fkey" FOREIGN KEY (student_id) REFERENCES students(id);
ALTER TABLE public."payments" ADD CONSTRAINT "payments_verified_by_fkey" FOREIGN KEY (verified_by) REFERENCES profiles(id);
ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."role_permissions" ADD CONSTRAINT "role_permissions_permission_code_fkey" FOREIGN KEY (permission_code) REFERENCES permissions(code) ON DELETE CASCADE;
ALTER TABLE public."role_permissions" ADD CONSTRAINT "role_permissions_role_code_fkey" FOREIGN KEY (role_code) REFERENCES roles(code) ON DELETE CASCADE;
ALTER TABLE public."rooms" ADD CONSTRAINT "rooms_school_id_fkey" FOREIGN KEY (school_id) REFERENCES schools(id);
ALTER TABLE public."school_memberships" ADD CONSTRAINT "school_memberships_granted_by_fkey" FOREIGN KEY (granted_by) REFERENCES profiles(id);
ALTER TABLE public."school_memberships" ADD CONSTRAINT "school_memberships_role_code_fkey" FOREIGN KEY (role_code) REFERENCES roles(code);
ALTER TABLE public."school_memberships" ADD CONSTRAINT "school_memberships_school_id_fkey" FOREIGN KEY (school_id) REFERENCES schools(id);
ALTER TABLE public."school_memberships" ADD CONSTRAINT "school_memberships_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id);
ALTER TABLE public."semesters" ADD CONSTRAINT "semesters_academic_year_id_fkey" FOREIGN KEY (academic_year_id) REFERENCES academic_years(id);
ALTER TABLE public."staff" ADD CONSTRAINT "staff_department_id_fkey" FOREIGN KEY (department_id) REFERENCES departments(id);
ALTER TABLE public."staff" ADD CONSTRAINT "staff_school_id_fkey" FOREIGN KEY (school_id) REFERENCES schools(id);
ALTER TABLE public."staff" ADD CONSTRAINT "staff_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id);
ALTER TABLE public."student_charges" ADD CONSTRAINT "student_charges_campaign_id_fkey" FOREIGN KEY (campaign_id) REFERENCES fee_campaigns(id);
ALTER TABLE public."student_charges" ADD CONSTRAINT "student_charges_fee_type_id_fkey" FOREIGN KEY (fee_type_id) REFERENCES fee_types(id);
ALTER TABLE public."student_charges" ADD CONSTRAINT "student_charges_student_id_fkey" FOREIGN KEY (student_id) REFERENCES students(id);
ALTER TABLE public."student_guardians" ADD CONSTRAINT "student_guardians_guardian_id_fkey" FOREIGN KEY (guardian_id) REFERENCES guardians(id) ON DELETE CASCADE;
ALTER TABLE public."student_guardians" ADD CONSTRAINT "student_guardians_student_id_fkey" FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
ALTER TABLE public."students" ADD CONSTRAINT "students_school_id_fkey" FOREIGN KEY (school_id) REFERENCES schools(id);
ALTER TABLE public."students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id);
ALTER TABLE public."workflow_events" ADD CONSTRAINT "workflow_events_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES profiles(id);
ALTER TABLE public."workflow_events" ADD CONSTRAINT "workflow_events_request_id_fkey" FOREIGN KEY (request_id) REFERENCES workflow_requests(id) ON DELETE CASCADE;
ALTER TABLE public."workflow_requests" ADD CONSTRAINT "workflow_requests_requester_id_fkey" FOREIGN KEY (requester_id) REFERENCES profiles(id);
ALTER TABLE public."workflow_requests" ADD CONSTRAINT "workflow_requests_school_id_fkey" FOREIGN KEY (school_id) REFERENCES schools(id);
ALTER TABLE public."workflow_requests" ADD CONSTRAINT "workflow_requests_staff_id_fkey" FOREIGN KEY (staff_id) REFERENCES staff(id);
ALTER TABLE public."workflow_requests" ADD CONSTRAINT "workflow_requests_student_id_fkey" FOREIGN KEY (student_id) REFERENCES students(id);
CREATE TABLE public.user_sessions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL REFERENCES public.profiles(id),refresh_token text NOT NULL UNIQUE,ip_address text NULL,user_agent text NULL,expires_at timestamptz NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),revoked_at timestamptz NULL);
