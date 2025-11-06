-- Fix creator user role
-- Run this in your Supabase SQL editor

-- 1. First, let's see what enum values are allowed
SELECT unnest(enum_range(NULL::user_role)) AS allowed_roles;

-- 2. Check current user roles
SELECT email, role, full_name FROM user_profiles 
ORDER BY role, email;

-- 3. Update your specific creator user
UPDATE user_profiles 
SET role = 'creator' 
WHERE email = 'allofus773@gmail.com';

-- 4. Keep "buyer" as is (since "collector" is not allowed in the enum)
-- The code will handle the buyer/collector mapping

-- 5. Verify the updates
SELECT email, role, full_name FROM user_profiles 
WHERE email = 'allofus773@gmail.com' OR role IN ('creator', 'buyer')
ORDER BY role, email;