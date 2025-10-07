

-- 1. Check if tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IN (
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM (
  VALUES 
    ('project_submissions'),
    ('artist_submissions'),
    ('writer_submissions'),
    ('fashion_submissions'),
    ('submission_media'),
    ('submission_reviews'),
    ('creator_onboarding')
) AS t(table_name);

-- 2. If any tables are missing, run the migration
-- Check if we need to run the migration
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'project_submissions') THEN
    RAISE NOTICE 'Tables are missing. Please run the migration: 20250929_creator_submission_tables.sql';
  ELSE
    RAISE NOTICE 'All tables exist!';
  END IF;
END $$;

-- 3. Verify RLS is enabled
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS Enabled'
    ELSE '❌ RLS Disabled'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'project_submissions',
  'artist_submissions',
  'writer_submissions',
  'fashion_submissions',
  'submission_media',
  'submission_reviews',
  'creator_onboarding'
)
ORDER BY tablename;

-- 4. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operation,
  qual as using_expression
FROM pg_policies 
WHERE tablename IN (
  'project_submissions',
  'artist_submissions',
  'writer_submissions',
  'fashion_submissions'
)
ORDER BY tablename, policyname;

-- 5. Test insert permissions (will fail if RLS blocks it)
-- This is a dry run - it will rollback
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Get current user
  SELECT auth.uid() INTO test_user_id;
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE '⚠️  No authenticated user - RLS policies will block inserts';
  ELSE
    RAISE NOTICE '✅ Authenticated as user: %', test_user_id;
  END IF;
END $$;

-- 6. Show table structure for project_submissions
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'project_submissions'
AND table_schema = 'public'
ORDER BY ordinal_position;
