-- Fix creator user role
-- Your database enum allows: buyer, creator, admin

-- 1. Check current user roles
SELECT email, role, full_name FROM user_profiles 
ORDER BY role, email;

-- 2. Update your specific creator user to 'creator' (this is safe)
UPDATE user_profiles 
SET role = 'creator' 
WHERE email = 'allofus773@gmail.com';

-- 3. Verify the update worked
SELECT email, role, full_name FROM user_profiles 
WHERE email = 'allofus773@gmail.com';

-- Note: We keep other users as 'buyer' since 'collector' is not allowed in the enum
-- The code will handle displaying 'buyer' as 'collector' in the UI