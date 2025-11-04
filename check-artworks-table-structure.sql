-- Check Artworks Table Structure
-- Run this to see the actual columns in the artworks table

-- 1. Check if artworks table exists
SELECT 
    'Table Exists' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'artworks' AND table_schema = 'public')
        THEN '✅ YES'
        ELSE '❌ NO'
    END as status;

-- 2. Show all columns in artworks table
SELECT 
    'Column Structure' as info_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'artworks' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Show sample data to understand the structure
SELECT 
    'Sample Data' as info_type,
    *
FROM artworks 
LIMIT 3;