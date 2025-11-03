-- Refresh Supabase Schema Cache
-- Run this to refresh the schema cache and resolve column not found errors

-- 1. Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- 2. Verify user_profiles table structure
SELECT 
  'Schema Cache Refreshed!' as status,
  COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND table_schema = 'public';

-- 3. Confirm social_links column exists
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND column_name = 'social_links'
  AND table_schema = 'public';

-- 4. Test a simple update to verify the column works
-- (This will only work if you have a user with this ID)
-- UPDATE user_profiles 
-- SET social_links = '{"test": "refresh"}' 
-- WHERE id = '8b396cf6-6110-45a6-a41a-d0d6fa2ee025';

-- 5. Show current user_profiles structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;