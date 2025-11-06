-- Fix admin access
-- Run this in your Supabase SQL editor

-- 1. Check what admin users exist
SELECT email, role, full_name, created_at 
FROM user_profiles 
WHERE role = 'admin'
ORDER BY created_at;

-- 2. Check your specific user (replace with your admin email)
SELECT email, role, full_name, created_at 
FROM user_profiles 
WHERE email = 'stephenmayowa112@gmail.com';  -- Replace with your admin email

-- 3. Set your user as admin (replace with your admin email)
UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'stephenmayowa112@gmail.com';  -- Replace with your admin email

-- 4. If your user doesn't exist in user_profiles, create them
-- (Replace the email and details with your actual admin account)
INSERT INTO user_profiles (
  id, 
  email, 
  full_name, 
  role, 
  created_at, 
  updated_at
) 
SELECT 
  auth.uid(),
  'stephenmayowa112@gmail.com',  -- Replace with your admin email
  'Admin User',                   -- Replace with your name
  'admin',
  NOW(),
  NOW()
FROM auth.users 
WHERE email = 'stephenmayowa112@gmail.com'  -- Replace with your admin email
AND NOT EXISTS (
  SELECT 1 FROM user_profiles WHERE email = 'stephenmayowa112@gmail.com'  -- Replace with your admin email
);

-- 5. Verify the admin user was created/updated
SELECT email, role, full_name 
FROM user_profiles 
WHERE email = 'stephenmayowa112@gmail.com';  -- Replace with your admin email