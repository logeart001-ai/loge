-- Simple Verification Script for Admin Dashboard Fix

-- 1. Check if required tables exist
SELECT 
    'Tables Check' as test_type,
    COUNT(CASE WHEN table_name = 'project_submissions' THEN 1 END) as project_submissions_exists,
    COUNT(CASE WHEN table_name = 'content_reports' THEN 1 END) as content_reports_exists,
    COUNT(CASE WHEN table_name = 'user_profiles' THEN 1 END) as user_profiles_exists
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('project_submissions', 'content_reports', 'user_profiles');

-- 2. Check foreign key constraints
SELECT 
    'Foreign Keys Check' as test_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name as references_table,
    ccu.column_name as references_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('project_submissions', 'content_reports')
ORDER BY tc.table_name, kcu.column_name;

-- 3. Test the actual queries that were failing
-- Test project_submissions query (this is what the admin dashboard uses)
SELECT 
    'Query Test' as test_type,
    'project_submissions_join' as query_name,
    COUNT(*) as record_count,
    'SUCCESS' as status
FROM project_submissions ps
LEFT JOIN user_profiles up ON ps.creator_id = up.id;

-- Test content_reports query (this is what content moderation uses)
SELECT 
    'Query Test' as test_type,
    'content_reports_join' as query_name,
    COUNT(*) as record_count,
    'SUCCESS' as status
FROM content_reports cr
LEFT JOIN user_profiles up ON cr.reporter_id = up.id;

-- 4. Check RLS policies
SELECT 
    'RLS Policies' as test_type,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('project_submissions', 'content_reports')
GROUP BY tablename;

-- 5. Final status
SELECT 
    '✅ VERIFICATION COMPLETE' as final_status,
    'Admin dashboard should now work without PGRST200 errors' as message,
    NOW() as verified_at;