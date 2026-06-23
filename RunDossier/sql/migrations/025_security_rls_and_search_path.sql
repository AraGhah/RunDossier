-- 025: Security hardening (audit 2026-06-23).
-- Enable RLS on 6 server-only public tables the Supabase advisor flagged as exposed to
-- PostgREST/anon, and pin search_path on our trigger functions.
-- APPLIED to production (Supabase migration: enable_rls_and_fix_function_search_path).
--
-- These tables are written only by the backend over a direct (owner) Postgres connection
-- that bypasses RLS — matching the 18 other already-RLS-enabled tables — so no policies
-- are required. This closes anon read/write, including to the audit_events hash-chain log.

ALTER TABLE telegram_updates      ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events          ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_command_log  ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN ALTER FUNCTION set_updated_at() SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION set_failed_jobs_dead_letter_at() SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN ALTER FUNCTION pilot_requests_set_updated_at() SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL; END $$;
