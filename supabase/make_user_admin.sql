-- Quick Script to Make a User an Admin
-- Copy and paste this into Supabase SQL Editor

-- ============================================
-- OPTION 1: Make yourself admin by email
-- ============================================
-- Replace 'your-email@example.com' with your actual email

UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';

-- Verify the change
SELECT 
  id,
  full_name,
  email,
  role,
  'Admin access granted!' as status
FROM user_profiles
WHERE email = 'your-email@example.com';


-- ============================================
-- OPTION 2: Make user admin by user ID
-- ============================================
-- Uncomment and replace 'user-id-here' with actual user ID

-- UPDATE user_profiles 
-- SET role = 'admin' 
-- WHERE id = 'user-id-here';


-- ============================================
-- OPTION 3: Find your user first, then update
-- ============================================
-- Step 1: Find your user
-- Uncomment and replace with your email to find your user ID

-- SELECT 
--   id,
--   full_name,
--   email,
--   role,
--   created_at
-- FROM user_profiles
-- WHERE email LIKE '%your-email%';

-- Step 2: Copy the ID from results and use in OPTION 2


-- ============================================
-- USEFUL QUERIES
-- ============================================

-- List all admins
SELECT 
  full_name,
  email,
  role,
  created_at
FROM user_profiles
WHERE role = 'admin'
ORDER BY created_at DESC;

-- Count users by role
SELECT 
  role,
  COUNT(*) as user_count
FROM user_profiles
GROUP BY role
ORDER BY user_count DESC;

-- Remove admin access (change back to creator or buyer)
-- Uncomment and replace email to remove admin access
-- UPDATE user_profiles 
-- SET role = 'creator'  -- or 'buyer'
-- WHERE email = 'user-to-demote@example.com';
