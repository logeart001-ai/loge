-- Check the actual structure of user_profiles table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also check if there are any constraints
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'user_profiles' 
  AND tc.table_schema = 'public';

-- Check if there are any existing records
SELECT COUNT(*) as total_profiles FROM user_profiles;

-- Check if there's a specific record for our user
SELECT * FROM user_profiles WHERE id = '8b396cf6-6110-45a6-a41a-d0d6fa2ee025';