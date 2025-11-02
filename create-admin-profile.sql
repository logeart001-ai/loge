-- Create admin profile for stephenmayowa112@gmail.com
-- User ID: 8b396cf6-6110-45a6-a41a-d0d6fa2ee025

-- First, check if the profile already exists
SELECT 
  up.id,
  up.full_name,
  up.role,
  up.email
FROM user_profiles up
WHERE up.id = '8b396cf6-6110-45a6-a41a-d0d6fa2ee025';

-- Create the admin profile (including email if the column exists)
INSERT INTO user_profiles (
  id,
  full_name,
  email,
  role,
  created_at,
  updated_at
) VALUES (
  '8b396cf6-6110-45a6-a41a-d0d6fa2ee025',
  'Stephen Mayowa',
  'stephenmayowa112@gmail.com',
  'admin',
  NOW(),
  NOW()
) ON CONFLICT (id) 
DO UPDATE SET 
  role = 'admin',
  email = 'stephenmayowa112@gmail.com',
  updated_at = NOW();

-- Verify the profile was created
SELECT 
  up.id,
  up.full_name,
  up.email,
  up.role,
  up.created_at
FROM user_profiles up
WHERE up.id = '8b396cf6-6110-45a6-a41a-d0d6fa2ee025';