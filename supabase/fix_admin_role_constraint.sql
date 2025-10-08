-- Fix Admin Role Constraint
-- This script removes the old constraint and adds a new one that includes 'admin'

-- Step 1: Drop the existing constraint
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_role_check;

-- Step 2: Add new constraint that includes 'admin'
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('buyer', 'creator', 'admin'));

-- Step 3: Verify the constraint was updated
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'user_profiles_role_check';

-- Step 4: Now you can update your user to admin
-- Replace 'your-email@example.com' with your actual email
UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'stephenmayowa112@gmail.com';

-- Step 5: Verify the change
SELECT 
  id,
  full_name,
  email,
  role,
  '✅ Admin access granted!' as status
FROM user_profiles
WHERE email = 'stephenmayowa112@gmail.com';

-- Optional: List all admins
SELECT 
  full_name,
  email,
  role,
  created_at
FROM user_profiles
WHERE role = 'admin'
ORDER BY created_at DESC;
