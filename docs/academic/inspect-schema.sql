-- Run in the Supabase SQL Editor for project jaivisftvckbaxnnzhbi.
-- Metadata only. No application rows, secrets, or database changes.
BEGIN TRANSACTION READ ONLY;
SELECT jsonb_build_object(
  'exported_at', current_timestamp,
  'tables', (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) FROM (
    SELECT c.relname AS table_name, c.relkind, c.relrowsecurity AS rls_enabled,
           c.relforcerowsecurity AS rls_forced
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r','p','v','m')
    ORDER BY c.relname
  ) t),
  'columns', (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) FROM (
    SELECT table_name, column_name, ordinal_position, data_type, udt_name,
           is_nullable, column_default, character_maximum_length, is_identity, is_generated
    FROM information_schema.columns WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  ) t),
  'constraints', (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) FROM (
    SELECT c.relname AS table_name, co.conname AS constraint_name, co.contype,
           pg_get_constraintdef(co.oid) AS definition
    FROM pg_constraint co JOIN pg_class c ON c.oid = co.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' ORDER BY c.relname, co.conname
  ) t),
  'indexes', (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) FROM (
    SELECT tablename, indexname, indexdef FROM pg_indexes
    WHERE schemaname = 'public' ORDER BY tablename, indexname
  ) t),
  'policies', (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) FROM (
    SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname
  ) t),
  'triggers', (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) FROM (
    SELECT c.relname AS table_name, tr.tgname AS trigger_name,
           pg_get_triggerdef(tr.oid) AS definition
    FROM pg_trigger tr JOIN pg_class c ON c.oid = tr.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND NOT tr.tgisinternal ORDER BY c.relname, tr.tgname
  ) t),
  'enums', (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) FROM (
    SELECT ty.typname, en.enumlabel, en.enumsortorder
    FROM pg_type ty JOIN pg_enum en ON en.enumtypid = ty.oid
    JOIN pg_namespace n ON n.oid = ty.typnamespace
    WHERE n.nspname = 'public' ORDER BY ty.typname, en.enumsortorder
  ) t),
  'functions', (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) FROM (
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS arguments,
           pg_get_function_result(p.oid) AS result_type, p.prosecdef AS security_definer
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind IN ('f','p') ORDER BY p.proname
  ) t),
  'grants', (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) FROM (
    SELECT table_name, grantee, privilege_type FROM information_schema.table_privileges
    WHERE table_schema = 'public' ORDER BY table_name, grantee, privilege_type
  ) t),
  'migration_tables', (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) FROM (
    SELECT table_schema, table_name FROM information_schema.tables
    WHERE table_schema = 'supabase_migrations' OR table_name = '__EFMigrationsHistory'
    ORDER BY table_schema, table_name
  ) t)
) AS schema_metadata;
ROLLBACK;
