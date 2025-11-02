-- Database Debug Script
-- Run this to check database state and permissions

-- 1. Check if tables exist
SELECT 
  schemaname,
  tablename,
  tableowner,
  hasindexes,
  hasrules,
  hastriggers,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('profiles', 'user_profiles', 'carts', 'cart_items', 'artworks')
ORDER BY tablename;

-- 2. Check RLS policies on user_profiles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 3. Check current user and role
SELECT 
  current_user as current_db_user,
  session_user as session_db_user,
  current_setting('role') as current_role;

-- 4. Check auth.users table (if accessible)
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users
FROM auth.users;

-- 5. Check user_profiles table
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_profiles,
  COUNT(CASE WHEN role = 'creator' THEN 1 END) as creator_profiles,
  COUNT(CASE WHEN role = 'buyer' THEN 1 END) as buyer_profiles
FROM user_profiles;

-- 6. Check if current auth user has a profile
-- (This will only work if you're authenticated in the SQL editor)
SELECT 
  up.*,
  au.email
FROM user_profiles up
JOIN auth.users au ON up.id = au.id
WHERE up.id = auth.uid();

-- 7. Test RLS by trying to select from user_profiles
-- (This should show what the current user can see)
SELECT 
  id,
  full_name,
  role,
  created_at
FROM user_profiles
LIMIT 5;