-- Migration: Cleanup extra auth.users triggers and ensure audit table
BEGIN;

-- Ensure audit log table exists (harmless if not used)
CREATE TABLE IF NOT EXISTS public.auth_audit_log (
  id BIGSERIAL PRIMARY KEY,
  event TEXT NOT NULL,
  user_id UUID,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drop known conflicting trigger and function if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'auth' AND c.relname = 'users' AND t.tgname = 'auth_user_created_trigger'
  ) THEN
    EXECUTE 'DROP TRIGGER IF EXISTS auth_user_created_trigger ON auth.users';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'handle_auth_user_created'
  ) THEN
    EXECUTE 'DROP FUNCTION public.handle_auth_user_created()';
  END IF;
END$$;

-- Safety: remove any other triggers on auth.users except the canonical one
DO $$
DECLARE r record;
BEGIN
  FOR r IN (
    SELECT t.tgname
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'auth' AND c.relname = 'users' AND NOT t.tgisinternal
      AND t.tgname <> 'on_auth_user_created'
  ) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users', r.tgname);
  END LOOP;
END$$;

COMMIT;
