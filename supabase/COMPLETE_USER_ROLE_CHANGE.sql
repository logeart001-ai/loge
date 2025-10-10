-- ============================================
-- COMPLETE USER ROLE CHANGE SCRIPT
-- This script fixes the constraint issue and changes user role
-- Run this entire script in Supabase SQL Editor
-- ============================================

BEGIN;

-- ============================================
-- STEP 1: Fix creator_onboarding constraint
-- ============================================
DO $$ 
BEGIN
  -- Add unique constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'creator_onboarding_creator_id_key'
    AND conrelid = 'creator_onboarding'::regclass
  ) THEN
    ALTER TABLE creator_onboarding 
    ADD CONSTRAINT creator_onboarding_creator_id_key 
    UNIQUE (creator_id);
    
    RAISE NOTICE '✅ Unique constraint added to creator_onboarding.creator_id';
  ELSE
    RAISE NOTICE 'ℹ️  Unique constraint already exists';
  END IF;
END $$;

-- ============================================
-- STEP 2: Change user from collector to creator
-- ⚠️ REPLACE 'user-email@example.com' WITH ACTUAL EMAIL
-- ============================================

-- Update user_profiles table
UPDATE user_profiles 
SET 
  role = 'creator',
  creator_status = 'pending',
  updated_at = NOW()
WHERE email = 'user-email@example.com';

-- Update auth.users metadata
UPDATE auth.users
SET raw_user_meta_data = 
  raw_user_meta_data || 
  jsonb_build_object(
    'user_type', 'creator',
    'role', 'creator'
  )
WHERE email = 'user-email@example.com';

-- ============================================
-- STEP 3: Verify the changes
-- ============================================
SELECT 
  '✅ USER UPDATED TO CREATOR!' as status,
  up.id,
  up.full_name,
  up.email,
  up.role as profile_role,
  up.creator_status,
  au.raw_user_meta_data->>'user_type' as metadata_user_type,
  au.raw_user_meta_data->>'role' as metadata_role,
  up.updated_at
FROM user_profiles up
JOIN auth.users au ON au.id = up.id
WHERE up.email = 'user-email@example.com';

COMMIT;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT 
  '🎉 COMPLETE!' as message,
  'User has been changed to creator' as status,
  'User must log out and log back in for changes to take effect' as important_note,
  'User will be redirected to /dashboard/creator on next login' as next_step;


-- ============================================
-- ALTERNATIVE: Change by User ID
-- ============================================
-- Uncomment and replace 'user-id-here' if you prefer to use ID

-- BEGIN;
-- 
-- UPDATE user_profiles 
-- SET 
--   role = 'creator',
--   creator_status = 'pending',
--   updated_at = NOW()
-- WHERE id = 'user-id-here';
-- 
-- UPDATE auth.users
-- SET raw_user_meta_data = 
--   raw_user_meta_data || 
--   jsonb_build_object(
--     'user_type', 'creator',
--     'role', 'creator'
--   )
-- WHERE id = 'user-id-here';
-- 
-- COMMIT;


-- ============================================
-- USEFUL QUERIES
-- ============================================

-- Find a user by partial email or name
-- SELECT 
--   id,
--   email,
--   full_name,
--   role,
--   creator_status
-- FROM user_profiles
-- WHERE email LIKE '%search%'
--    OR full_name LIKE '%search%';

-- List all collectors
-- SELECT 
--   email,
--   full_name,
--   role,
--   created_at
-- FROM user_profiles
-- WHERE role = 'buyer'
-- ORDER BY created_at DESC;

-- List all creators
-- SELECT 
--   email,
--   full_name,
--   role,
--   creator_status,
--   created_at
-- FROM user_profiles
-- WHERE role = 'creator'
-- ORDER BY created_at DESC;

-- Count users by role
-- SELECT 
--   role,
--   COUNT(*) as count
-- FROM user_profiles
-- GROUP BY role;
