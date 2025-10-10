-- ============================================
-- CHANGE USER FROM COLLECTOR TO CREATOR
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- OPTION 1: Change by Email (Recommended)
-- ============================================
-- Replace 'user-email@example.com' with the actual user email

-- Step 1: Update user_profiles table
UPDATE user_profiles 
SET 
  role = 'creator',
  creator_status = 'pending',  -- Set initial creator status
  updated_at = NOW()
WHERE email = 'user-email@example.com';

-- Step 2: Update auth.users metadata (optional but recommended)
UPDATE auth.users
SET raw_user_meta_data = 
  raw_user_meta_data || 
  jsonb_build_object(
    'user_type', 'creator',
    'role', 'creator'
  )
WHERE email = 'user-email@example.com';

-- Step 3: Verify the change
SELECT 
  '✅ User Updated to Creator!' as status,
  up.id,
  up.full_name,
  up.email,
  up.role,
  up.creator_status,
  au.raw_user_meta_data->>'user_type' as metadata_user_type,
  au.raw_user_meta_data->>'role' as metadata_role
FROM user_profiles up
JOIN auth.users au ON au.id = up.id
WHERE up.email = 'user-email@example.com';


-- ============================================
-- OPTION 2: Change by User ID
-- ============================================
-- Uncomment and replace 'user-id-here' with actual user ID

-- UPDATE user_profiles 
-- SET 
--   role = 'creator',
--   creator_status = 'pending',
--   updated_at = NOW()
-- WHERE id = 'user-id-here';

-- UPDATE auth.users
-- SET raw_user_meta_data = 
--   raw_user_meta_data || 
--   jsonb_build_object(
--     'user_type', 'creator',
--     'role', 'creator'
--   )
-- WHERE id = 'user-id-here';


-- ============================================
-- OPTION 3: Batch Update Multiple Users
-- ============================================
-- Uncomment to change multiple users at once

-- UPDATE user_profiles 
-- SET 
--   role = 'creator',
--   creator_status = 'pending',
--   updated_at = NOW()
-- WHERE email IN (
--   'user1@example.com',
--   'user2@example.com',
--   'user3@example.com'
-- );

-- UPDATE auth.users
-- SET raw_user_meta_data = 
--   raw_user_meta_data || 
--   jsonb_build_object(
--     'user_type', 'creator',
--     'role', 'creator'
--   )
-- WHERE email IN (
--   'user1@example.com',
--   'user2@example.com',
--   'user3@example.com'
-- );


-- ============================================
-- OPTION 4: Find User First, Then Update
-- ============================================
-- Step 1: Search for the user
-- Uncomment and modify the search term

-- SELECT 
--   id,
--   email,
--   full_name,
--   role,
--   creator_status,
--   created_at
-- FROM user_profiles
-- WHERE email LIKE '%search-term%'
--    OR full_name LIKE '%search-term%';

-- Step 2: Copy the user ID or email from results
-- Step 3: Use OPTION 1 or OPTION 2 above


-- ============================================
-- USEFUL QUERIES
-- ============================================

-- List all collectors (buyers)
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM user_profiles
WHERE role = 'buyer'
ORDER BY created_at DESC;

-- List all creators
SELECT 
  id,
  email,
  full_name,
  role,
  creator_status,
  created_at
FROM user_profiles
WHERE role = 'creator'
ORDER BY created_at DESC;

-- Count users by role
SELECT 
  role,
  COUNT(*) as user_count
FROM user_profiles
GROUP BY role
ORDER BY user_count DESC;

-- Check a specific user's role
-- Replace 'user-email@example.com' with actual email
SELECT 
  up.id,
  up.email,
  up.full_name,
  up.role as profile_role,
  up.creator_status,
  au.raw_user_meta_data->>'user_type' as metadata_user_type,
  au.raw_user_meta_data->>'role' as metadata_role
FROM user_profiles up
JOIN auth.users au ON au.id = up.id
WHERE up.email = 'user-email@example.com';


-- ============================================
-- REVERSE: Change Creator Back to Collector
-- ============================================
-- Uncomment to change a creator back to collector/buyer

-- UPDATE user_profiles 
-- SET 
--   role = 'buyer',
--   creator_status = NULL,
--   updated_at = NOW()
-- WHERE email = 'user-email@example.com';

-- UPDATE auth.users
-- SET raw_user_meta_data = 
--   raw_user_meta_data || 
--   jsonb_build_object(
--     'user_type', 'buyer',
--     'role', 'buyer'
--   )
-- WHERE email = 'user-email@example.com';


-- ============================================
-- NOTES
-- ============================================
-- 1. After running this, the user needs to log out and log back in
-- 2. The user will be redirected to /dashboard/creator on next login
-- 3. creator_status is set to 'pending' - admin can approve later
-- 4. Both user_profiles.role and auth.users metadata are updated
-- 5. This is safe to run multiple times (idempotent)
