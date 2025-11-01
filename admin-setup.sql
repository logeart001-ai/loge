-- Admin Setup Script
-- Run this to check and create admin users

-- Check existing user profiles
SELECT 
  id,
  full_name,
  role,
  created_at
FROM user_profiles
ORDER BY created_at DESC;

-- Check auth users (to see who's registered)
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users
ORDER BY created_at DESC;

-- Create admin profile for a specific user (replace the email with your admin email)
-- First, find the user ID from auth.users table above, then run:

/*
INSERT INTO user_profiles (id, full_name, role)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'full_name', email),
  'admin'
FROM auth.users 
WHERE email = 'your-admin-email@example.com'
ON CONFLICT (id) 
DO UPDATE SET role = 'admin';
*/

-- Or update an existing user to admin:
/*
UPDATE user_profiles 
SET role = 'admin' 
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'your-admin-email@example.com'
);
*/

-- Verify admin users
SELECT 
  up.id,
  up.full_name,
  up.role,
  au.email
FROM user_profiles up
JOIN auth.users au ON up.id = au.id
WHERE up.role = 'admin';