-- Migration: Fix signup trigger and function
-- Description: Update handle_new_user to handle role/user_type, set creator_status, and make insert robust; ensure single trigger

BEGIN;

-- Ensure required types/columns exist
DO $$
BEGIN
  -- user_role enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'user_role' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.user_role AS ENUM ('buyer','creator','admin');
  END IF;

  -- creator_status enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'creator_status' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.creator_status AS ENUM ('pending','approved','rejected','suspended');
  END IF;

  -- add columns to user_profiles if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='user_profiles' AND column_name='role'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN role public.user_role NOT NULL DEFAULT 'buyer';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='user_profiles' AND column_name='creator_status'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN creator_status public.creator_status;
  END IF;
END$$;

-- Create or replace the signup handler
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role text;
  v_role_enum public.user_role;
  v_full_name text;
  v_creator_status public.creator_status;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', NEW.raw_user_meta_data->>'user_type', 'buyer');
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'User');

  -- Map string to enum safely
  IF v_role NOT IN ('buyer','creator','admin') THEN
    v_role_enum := 'buyer';
  ELSE
    v_role_enum := v_role::public.user_role;
  END IF;

  v_creator_status := CASE WHEN v_role_enum = 'creator' THEN 'pending' ELSE NULL END;

  INSERT INTO public.user_profiles (id, email, full_name, role, creator_status)
  VALUES (NEW.id, NEW.email, v_full_name, v_role_enum, v_creator_status)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        creator_status = EXCLUDED.creator_status,
        updated_at = NOW();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Do not block signup; log as a warning
  RAISE WARNING 'handle_new_user failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure only one trigger exists that calls handle_new_user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMIT;
