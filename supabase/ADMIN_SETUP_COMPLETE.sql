-- ============================================
-- COMPLETE ADMIN SETUP SCRIPT
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- Step 1: Check current constraint
SELECT 
  'Current Constraint:' as info,
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'user_profiles_role_check'
  AND conrelid = 'user_profiles'::regclass;

-- Step 2: Drop the old constraint (if it exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_profiles_role_check'
      AND conrelid = 'user_profiles'::regclass
  ) THEN
    ALTER TABLE user_profiles DROP CONSTRAINT user_profiles_role_check;
    RAISE NOTICE '✅ Old constraint dropped';
  ELSE
    RAISE NOTICE 'ℹ️  No existing constraint found';
  END IF;
END $$;

-- Step 3: Add new constraint that includes 'admin'
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('buyer', 'creator', 'admin'));

-- Verify new constraint
SELECT 
  '✅ New Constraint Added:' as info,
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'user_profiles_role_check'
  AND conrelid = 'user_profiles'::regclass;

-- Step 4: Update your user to admin
-- ⚠️ IMPORTANT: Replace the email below with your actual email
UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'stephenmayowa112@gmail.com';

-- Step 5: Verify the change
SELECT 
  '✅ Admin User Created:' as status,
  id,
  full_name,
  email,
  role,
  created_at
FROM user_profiles
WHERE email = 'stephenmayowa112@gmail.com';

-- Step 6: Show all users by role
SELECT 
  'User Count by Role:' as info,
  role,
  COUNT(*) as count
FROM user_profiles
GROUP BY role
ORDER BY count DESC;

-- Step 7: List all admins
SELECT 
  '✅ All Admin Users:' as info,
  full_name,
  email,
  role,
  created_at
FROM user_profiles
WHERE role = 'admin'
ORDER BY created_at DESC;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT 
  '🎉 SETUP COMPLETE!' as message,
  'You can now access the admin dashboard at /admin' as next_step,
  'Remember to log out and log back in for changes to take effect' as important_note;
