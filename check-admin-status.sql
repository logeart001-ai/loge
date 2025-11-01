-- Quick Admin Status Check
-- Run this to see current admin setup

-- 1. Check all users and their profiles
SELECT 
  au.email,
  au.id as user_id,
  up.full_name,
  up.role,
  up.created_at as profile_created,
  au.created_at as user_created
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
ORDER BY au.created_at DESC;

-- 2. Count users by role
SELECT 
  COALESCE(up.role, 'no_profile') as role,
  COUNT(*) as count
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
GROUP BY up.role
ORDER BY count DESC;

-- 3. Check specifically for admin users
SELECT 
  au.email,
  up.full_name,
  up.role
FROM auth.users au
JOIN user_profiles up ON au.id = up.id
WHERE up.role = 'admin';

-- 4. If you need to make yourself admin, uncomment and modify this:
/*
UPDATE user_profiles 
SET role = 'admin' 
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE@example.com'
);
*/