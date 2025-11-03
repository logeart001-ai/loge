-- Check if project_submissions table exists
SELECT 
  table_name,
  table_schema,
  table_type
FROM information_schema.tables 
WHERE table_name = 'project_submissions';

-- Check what submission-related tables exist
SELECT 
  table_name,
  table_schema
FROM information_schema.tables 
WHERE table_name LIKE '%submission%'
  AND table_schema = 'public';

-- Check all tables in public schema
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;