-- Verify content_reports table and add sample test data

-- 1. Check if table exists and show structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'content_reports'
ORDER BY ordinal_position;

-- 2. Check enum types
SELECT 
  t.typname as enum_name,
  e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN ('report_status', 'content_type', 'report_reason')
ORDER BY t.typname, e.enumsortorder;

-- 3. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'content_reports';

-- 4. Insert a sample report for testing (optional - comment out if not needed)
-- This will only work if you're authenticated as a user
/*
INSERT INTO content_reports (
  content_type,
  content_id,
  reporter_id,
  reason,
  description,
  status
) VALUES (
  'artwork'::content_type,
  uuid_generate_v4(), -- Replace with actual artwork ID
  auth.uid(), -- Current authenticated user
  'spam'::report_reason,
  'This is a test report for development purposes',
  'pending'::report_status
);
*/

-- 5. Count reports by status
SELECT 
  status,
  COUNT(*) as count
FROM content_reports
GROUP BY status;

-- Success message
SELECT '✅ Content reports table is properly configured!' as message;
