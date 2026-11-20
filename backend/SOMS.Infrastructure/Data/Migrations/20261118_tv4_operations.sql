BEGIN;
DO $$
DECLARE required record;
BEGIN
  FOR required IN SELECT * FROM (VALUES
    ('fee_types','school_id','uuid'),('fee_campaigns','academic_year_id','uuid'),
    ('student_charges','discount','numeric'),('student_charges','fee_type_id','uuid'),
    ('payments','amount','numeric'),('payments','recorded_by','uuid'),('payments','verified_by','uuid'),
    ('payment_allocations','charge_id','uuid'),('payment_adjustments','adjustment_type','text'),
    ('rooms','school_id','uuid'),('rooms','status','text'),('assets','code','text'),('assets','school_id','uuid'),
    ('asset_loans','borrower_user_id','uuid'),('asset_incidents','assignee_id','uuid'),
    ('maintenance_jobs','incident_id','uuid'),('notifications','payload','jsonb'),
    ('workflow_requests','requester_id','uuid'),('approval_steps','assigned_role_code','text'),
    ('workflow_events','actor_id','uuid'),('audit_logs','actor_id','uuid'),('student_guardians','can_view_finance','bool')
  ) AS v(table_name,column_name,udt_name)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema='public' AND c.table_name=required.table_name AND c.column_name=required.column_name AND c.udt_name=required.udt_name) THEN
      RAISE EXCEPTION 'Incompatible shared schema: %.% (%) required',required.table_name,required.column_name,required.udt_name;
    END IF;
  END LOOP;
  IF to_regclass('public.fee_assignments') IS NOT NULL THEN
    RAISE EXCEPTION 'Legacy duplicate fee_assignments detected; reconcile manually before TV4 cutover';
  END IF;
END $$;
CREATE SCHEMA IF NOT EXISTS tv4;
CREATE TABLE IF NOT EXISTS tv4.schema_versions(version text PRIMARY KEY,installed_at timestamptz NOT NULL DEFAULT now());
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM tv4.schema_versions WHERE version='20261118_operations') THEN
   RAISE EXCEPTION 'TV4 20261118_operations already installed; no changes made';
 END IF;
END $$;
CREATE TABLE tv4.campaign_details(campaign_id uuid PRIMARY KEY REFERENCES public.fee_campaigns(id), school_id uuid NOT NULL REFERENCES public.schools(id), semester_id uuid NULL REFERENCES public.semesters(id));
CREATE TABLE tv4.fee_rules(id uuid PRIMARY KEY,school_id uuid NOT NULL REFERENCES public.schools(id),campaign_id uuid NOT NULL REFERENCES public.fee_campaigns(id),fee_type_id uuid NOT NULL REFERENCES public.fee_types(id),grade_level_id uuid NULL REFERENCES public.grade_levels(id),class_id uuid NULL REFERENCES public.classes(id),amount numeric(18,2) NOT NULL CHECK(amount>=0),due_on date NULL,CHECK(grade_level_id IS NOT NULL OR class_id IS NOT NULL));
CREATE UNIQUE INDEX fee_rules_class ON tv4.fee_rules(campaign_id,fee_type_id,class_id) WHERE class_id IS NOT NULL;
CREATE UNIQUE INDEX fee_rules_grade ON tv4.fee_rules(campaign_id,fee_type_id,grade_level_id) WHERE class_id IS NULL;
CREATE TABLE tv4.charge_details(charge_id uuid PRIMARY KEY REFERENCES public.student_charges(id),school_id uuid NOT NULL REFERENCES public.schools(id),class_id uuid NOT NULL REFERENCES public.classes(id));
CREATE TABLE tv4.exemptions(id uuid PRIMARY KEY,school_id uuid NOT NULL REFERENCES public.schools(id),charge_id uuid NOT NULL REFERENCES public.student_charges(id),amount numeric(18,2) NOT NULL CHECK(amount>0),reason text NOT NULL,workflow_id uuid NOT NULL UNIQUE REFERENCES public.workflow_requests(id));
CREATE TABLE tv4.notices(id uuid PRIMARY KEY,school_id uuid NOT NULL REFERENCES public.schools(id),campaign_id uuid NOT NULL REFERENCES public.fee_campaigns(id),title text NOT NULL,message text NOT NULL,created_by uuid NOT NULL REFERENCES public.profiles(id),created_at timestamptz NOT NULL DEFAULT now(),sent_at timestamptz NULL);
CREATE TABLE tv4.delivery_batches(id uuid PRIMARY KEY,school_id uuid NOT NULL REFERENCES public.schools(id),request_key uuid NOT NULL,notice_id uuid NULL REFERENCES tv4.notices(id),charge_id uuid NULL REFERENCES public.student_charges(id),created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(school_id,request_key));
CREATE TABLE tv4.deliveries(id uuid PRIMARY KEY,school_id uuid NOT NULL REFERENCES public.schools(id),notice_id uuid NULL REFERENCES tv4.notices(id),charge_id uuid NULL REFERENCES public.student_charges(id),request_key uuid NOT NULL,recipient_id uuid NOT NULL REFERENCES public.profiles(id),notification_id uuid NOT NULL UNIQUE REFERENCES public.notifications(id),created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(school_id,request_key,recipient_id));
CREATE TABLE tv4.bank_transactions(id uuid PRIMARY KEY,school_id uuid NOT NULL REFERENCES public.schools(id),source text NOT NULL,transaction_id text NOT NULL,reference text NOT NULL,amount numeric(18,2) NOT NULL CHECK(amount>0),transaction_at timestamptz NOT NULL,description text NULL,payment_id uuid NULL UNIQUE REFERENCES public.payments(id),imported_by uuid NOT NULL REFERENCES public.profiles(id),imported_at timestamptz NOT NULL DEFAULT now(),reconciled_at timestamptz NULL,UNIQUE(school_id,source,transaction_id));
CREATE TABLE tv4.payment_intents(payment_id uuid NOT NULL REFERENCES public.payments(id),charge_id uuid NOT NULL REFERENCES public.student_charges(id),amount numeric(18,2) NOT NULL CHECK(amount>0),PRIMARY KEY(payment_id,charge_id));
CREATE TABLE tv4.adjustments(id uuid PRIMARY KEY,school_id uuid NOT NULL REFERENCES public.schools(id),payment_id uuid NOT NULL REFERENCES public.payments(id),type text NOT NULL CHECK(type IN ('refund','correction')),amount numeric(18,2) NOT NULL CHECK(amount>0),reason text NOT NULL,workflow_id uuid NOT NULL UNIQUE REFERENCES public.workflow_requests(id),executed_at timestamptz NULL,executed_by uuid NULL REFERENCES public.profiles(id),canonical_adjustment_id uuid NULL UNIQUE REFERENCES public.payment_adjustments(id));
CREATE TABLE tv4.adjustment_allocations(adjustment_id uuid NOT NULL REFERENCES tv4.adjustments(id),charge_id uuid NOT NULL REFERENCES public.student_charges(id),amount numeric(18,2) NOT NULL CHECK(amount>0),PRIMARY KEY(adjustment_id,charge_id));
CREATE TABLE tv4.receipts(id uuid PRIMARY KEY,school_id uuid NOT NULL REFERENCES public.schools(id),payment_id uuid NOT NULL UNIQUE REFERENCES public.payments(id),receipt_code text NOT NULL UNIQUE,student_id uuid NOT NULL REFERENCES public.students(id),amount numeric(18,2) NOT NULL CHECK(amount>0),issued_by uuid NOT NULL REFERENCES public.profiles(id),issued_at timestamptz NOT NULL DEFAULT now(),snapshot jsonb NOT NULL);
CREATE TABLE tv4.asset_categories(id uuid PRIMARY KEY,school_id uuid NOT NULL REFERENCES public.schools(id),name text NOT NULL,is_active boolean NOT NULL DEFAULT true,UNIQUE(school_id,name));
CREATE TABLE tv4.asset_details(asset_id uuid PRIMARY KEY REFERENCES public.assets(id),school_id uuid NOT NULL REFERENCES public.schools(id),condition text NOT NULL);
CREATE TABLE tv4.loan_details(loan_id uuid PRIMARY KEY REFERENCES public.asset_loans(id),school_id uuid NOT NULL REFERENCES public.schools(id),purpose text NOT NULL,handover_by uuid NULL REFERENCES public.profiles(id),returned_by uuid NULL REFERENCES public.profiles(id));
CREATE TABLE tv4.job_details(job_id uuid PRIMARY KEY REFERENCES public.maintenance_jobs(id),school_id uuid NOT NULL REFERENCES public.schools(id),title text NOT NULL,repeat_interval_months integer NULL CHECK(repeat_interval_months BETWEEN 1 AND 120),previous_job_id uuid NULL UNIQUE REFERENCES public.maintenance_jobs(id),result_condition text NULL,result_status text NULL CHECK(result_status IN ('working','damaged','maintenance','retired','lost')),result_recorded_at timestamptz NULL,result_actor uuid NULL REFERENCES public.profiles(id),completed_by uuid NULL REFERENCES public.profiles(id));
CREATE TABLE tv4.proposals(id uuid PRIMARY KEY,school_id uuid NOT NULL REFERENCES public.schools(id),workflow_id uuid NOT NULL UNIQUE REFERENCES public.workflow_requests(id),type text NOT NULL CHECK(type IN ('purchase','replacement')),title text NOT NULL,description text NOT NULL,quantity integer NOT NULL CHECK(quantity>0),estimated_cost numeric(18,2) NULL CHECK(estimated_cost>=0),asset_id uuid NULL REFERENCES public.assets(id),CHECK(type<>'replacement' OR asset_id IS NOT NULL));
CREATE TABLE tv4.inventories(id uuid PRIMARY KEY,school_id uuid NOT NULL REFERENCES public.schools(id),title text NOT NULL,counted_by uuid NOT NULL REFERENCES public.profiles(id),counted_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE tv4.inventory_observations(inventory_id uuid NOT NULL REFERENCES tv4.inventories(id),asset_id uuid NOT NULL REFERENCES public.assets(id),expected_room_id uuid NULL REFERENCES public.rooms(id),expected_status text NOT NULL,expected_condition text NULL,observed_room_id uuid NULL REFERENCES public.rooms(id),condition text NOT NULL,status text NOT NULL CHECK(status IN ('working','damaged','maintenance','retired','lost')),present boolean NOT NULL,PRIMARY KEY(inventory_id,asset_id));
INSERT INTO tv4.asset_categories(id,school_id,name,is_active) SELECT gen_random_uuid(),school_id,category,true FROM public.assets GROUP BY school_id,category;
CREATE INDEX fee_rules_school ON tv4.fee_rules(school_id,campaign_id);
CREATE INDEX notices_school ON tv4.notices(school_id,campaign_id);
CREATE INDEX bank_transactions_school ON tv4.bank_transactions(school_id,imported_at);
CREATE INDEX adjustments_school ON tv4.adjustments(school_id,payment_id);
CREATE INDEX inventories_school ON tv4.inventories(school_id,counted_at);
DO $$ DECLARE t record; BEGIN
 FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='tv4' LOOP
   EXECUTE format('ALTER TABLE tv4.%I ENABLE ROW LEVEL SECURITY',t.tablename);
   EXECUTE format('REVOKE ALL ON TABLE tv4.%I FROM PUBLIC',t.tablename);
 END LOOP;
END $$;
REVOKE ALL ON SCHEMA tv4 FROM PUBLIC;
INSERT INTO tv4.schema_versions(version) VALUES('20261118_operations');
COMMIT;
