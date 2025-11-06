-- Fix creator user role
-- Run this in your Supabase SQL editor

-- 1. First, let's see what enum values are allowed for user_role
SELECT unnest(enum_range(NULL::user_role)) AS allowed_roles;

-- 2. Check current user roles
SELECT email, role, full_name FROM user_profiles 
ORDER BY role, email;

-- 3. Update your specific creator user (this should work)
UPDATE user_profiles 
SET role = 'creator' 
WHERE email = 'allofus773@gmail.com';

-- 4. Verify the update worked
SELECT email, role, full_name FROM user_profiles 
WHERE email = 'allofus773@gmail.com';