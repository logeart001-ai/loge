-- ============================================================================
-- COMPREHENSIVE DATABASE INSPECTION SCRIPT
-- This script provides detailed information about all tables in your database
-- Run this in Supabase SQL Editor to get a complete overview
-- ============================================================================

-- ============================================================================
-- 1. LIST ALL TABLES IN PUBLIC SCHEMA
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  tableowner,
  tablespace
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- 2. GET DETAILED COLUMN INFORMATION FOR ALL TABLES
-- ============================================================================
SELECT 
  table_name,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default,
  ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- ============================================================================
-- 3. GET ALL FOREIGN KEY RELATIONSHIPS
-- ============================================================================
SELECT
  tc.table_name AS source_table,
  kcu.column_name AS source_column,
  ccu.table_name AS target_table,
  ccu.column_name AS target_column,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- 4. GET ALL PRIMARY KEYS
-- ============================================================================
SELECT
  tc.table_name,
  kcu.column_name AS primary_key_column,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ============================================================================
-- 5. GET ALL INDEXES
-- ============================================================================
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- 6. GET ALL UNIQUE CONSTRAINTS
-- ============================================================================
SELECT
  tc.table_name,
  kcu.column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- 7. GET ALL ENUMS (CUSTOM TYPES)
-- ============================================================================
SELECT 
  t.typname AS enum_name,
  e.enumlabel AS enum_value,
  e.enumsortorder
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
ORDER BY t.typname, e.enumsortorder;

-- ============================================================================
-- 8. GET ROW COUNTS FOR ALL TABLES
-- ============================================================================
SELECT 
  schemaname,
  relname AS table_name,
  n_live_tup AS row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- ============================================================================
-- 9. GET TABLE SIZES
-- ============================================================================
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================================================
-- 10. GET RLS (ROW LEVEL SECURITY) POLICIES
-- ============================================================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- 11. CHECK WHICH TABLES HAVE RLS ENABLED
-- ============================================================================
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- 12. GET ALL CHECK CONSTRAINTS
-- ============================================================================
SELECT
  tc.table_name,
  tc.constraint_name,
  cc.check_clause
FROM information_schema.table_constraints AS tc
JOIN information_schema.check_constraints AS cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = 'CHECK' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ============================================================================
-- 13. GET ALL TRIGGERS
-- ============================================================================
SELECT
  trigger_name,
  event_manipulation AS trigger_event,
  event_object_table AS table_name,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- 14. GET ALL FUNCTIONS/STORED PROCEDURES
-- ============================================================================
SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS return_type,
  CASE p.prokind
    WHEN 'f' THEN 'FUNCTION'
    WHEN 'p' THEN 'PROCEDURE'
    WHEN 'a' THEN 'AGGREGATE'
    WHEN 'w' THEN 'WINDOW'
  END AS function_type
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;

-- ============================================================================
-- 15. DETAILED TABLE STRUCTURE WITH ALL INFO (COMPACT VIEW)
-- ============================================================================
SELECT 
  t.table_name,
  STRING_AGG(
    c.column_name || ' ' || 
    c.data_type || 
    CASE WHEN c.character_maximum_length IS NOT NULL 
         THEN '(' || c.character_maximum_length || ')' 
         ELSE '' END ||
    CASE WHEN c.is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
    CASE WHEN c.column_default IS NOT NULL 
         THEN ' DEFAULT ' || c.column_default 
         ELSE '' END,
    ', ' ORDER BY c.ordinal_position
  ) AS columns
FROM information_schema.tables t
JOIN information_schema.columns c 
  ON t.table_name = c.table_name 
  AND t.table_schema = c.table_schema
WHERE t.table_schema = 'public' 
  AND t.table_type = 'BASE TABLE'
GROUP BY t.table_name
ORDER BY t.table_name;

-- ============================================================================
-- 16. SUMMARY: QUICK DATABASE OVERVIEW
-- ============================================================================
SELECT
  'Tables' AS category,
  COUNT(*) AS count
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'

UNION ALL

SELECT
  'Columns' AS category,
  COUNT(*) AS count
FROM information_schema.columns
WHERE table_schema = 'public'

UNION ALL

SELECT
  'Foreign Keys' AS category,
  COUNT(*) AS count
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public'

UNION ALL

SELECT
  'Indexes' AS category,
  COUNT(*) AS count
FROM pg_indexes
WHERE schemaname = 'public'

UNION ALL

SELECT
  'RLS Policies' AS category,
  COUNT(*) AS count
FROM pg_policies
WHERE schemaname = 'public'

UNION ALL

SELECT
  'Enums' AS category,
  COUNT(DISTINCT typname) AS count
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'

UNION ALL

SELECT
  'Functions' AS category,
  COUNT(*) AS count
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'

ORDER BY category;

-- ============================================================================
-- 17. SPECIFIC TABLES CHECK (For Admin Dashboard)
-- ============================================================================
-- Check if key tables exist and their row counts
SELECT 
  table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = t.table_name
    ) THEN 'EXISTS'
    ELSE 'MISSING'
  END AS status,
  COALESCE(
    (SELECT n_live_tup 
     FROM pg_stat_user_tables 
     WHERE schemaname = 'public' 
     AND relname = t.table_name), 
    0
  ) AS row_count
FROM (
  VALUES 
    ('user_profiles'),
    ('artworks'),
    ('events'),
    ('blog_posts'),
    ('project_submissions'),
    ('content_reports'),
    ('submission_media'),
    ('artist_submissions'),
    ('writer_submissions'),
    ('fashion_submissions'),
    ('submission_reviews'),
    ('carts'),
    ('cart_items'),
    ('books'),
    ('orders'),
    ('order_items')
) AS t(table_name)
ORDER BY 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = t.table_name
    ) THEN 0
    ELSE 1
  END,
  table_name;

-- ============================================================================
-- 18. CHECK COLUMN EXISTENCE IN SPECIFIC TABLES
-- ============================================================================
-- Verify user_profiles columns
SELECT 
  'user_profiles' AS table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Verify events columns
SELECT 
  'events' AS table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'events'
ORDER BY ordinal_position;

-- ============================================================================
-- END OF INSPECTION SCRIPT
-- ============================================================================
-- 
-- HOW TO USE:
-- 1. Copy sections you want to run
-- 2. Paste into Supabase SQL Editor
-- 3. Execute to see the results
-- 
-- TIP: Run section 17 first to quickly see which key tables exist
-- ============================================================================
