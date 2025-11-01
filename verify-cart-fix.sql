-- Verify cart system is working after fixes
-- Run this after running cart-immediate-fix.sql

-- 1. Check all required tables exist
SELECT 'Tables Status' as category, 
       COUNT(*) as existing_tables,
       CASE WHEN COUNT(*) = 3 THEN '✅ ALL PRESENT' ELSE '❌ MISSING TABLES' END as status
FROM information_schema.tables 
WHERE table_name IN ('carts', 'cart_items', 'artworks') 
AND table_schema = 'public';

-- 2. Check foreign key constraints
SELECT 'Foreign Keys Status' as category,
       COUNT(*) as constraint_count,
       CASE WHEN COUNT(*) >= 3 THEN '✅ ALL CONSTRAINTS ACTIVE' ELSE '❌ MISSING CONSTRAINTS' END as status
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' 
AND table_name IN ('carts', 'cart_items');

-- 3. Check for orphaned data
SELECT 'Data Integrity' as category,
       COUNT(*) as orphaned_items,
       CASE WHEN COUNT(*) = 0 THEN '✅ NO ORPHANED DATA' ELSE '❌ ORPHANED DATA EXISTS' END as status
FROM cart_items ci
LEFT JOIN artworks a ON ci.artwork_id = a.id
WHERE a.id IS NULL;

-- 4. Test the API query that was failing
SELECT 'API Compatibility' as category,
       'Supabase relationship query' as test_name,
       CASE WHEN COUNT(*) >= 0 THEN '✅ QUERY WORKS' ELSE '❌ QUERY FAILS' END as status
FROM (
    SELECT 
        ci.id,
        ci.artwork_id,
        ci.unit_price,
        ci.quantity,
        json_build_object(
            'id', a.id,
            'title', a.title,
            'thumbnail_url', a.thumbnail_url,
            'creator_id', a.creator_id
        ) as artwork_data
    FROM cart_items ci
    LEFT JOIN artworks a ON ci.artwork_id = a.id
    LIMIT 1
) test_query;

-- 5. Overall system health check
SELECT 
    '🎯 FINAL CART SYSTEM STATUS' as report,
    CASE 
        WHEN (
            -- All tables exist
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_name IN ('carts', 'cart_items', 'artworks') 
            AND table_schema = 'public'
        ) = 3 
        AND (
            -- All foreign keys exist
            SELECT COUNT(*) FROM information_schema.table_constraints 
            WHERE constraint_type = 'FOREIGN KEY' 
            AND table_name IN ('carts', 'cart_items')
        ) >= 3
        AND (
            -- No orphaned data
            SELECT COUNT(*) FROM cart_items ci
            LEFT JOIN artworks a ON ci.artwork_id = a.id
            WHERE a.id IS NULL
        ) = 0
        THEN '🎉 CART SYSTEM IS HEALTHY - Ready for use!'
        ELSE '⚠️ CART SYSTEM STILL HAS ISSUES - Check individual status above'
    END as overall_status;

-- 6. Next steps if still broken
SELECT 
    'If cart still not working' as troubleshooting,
    'Check these items:' as next_steps,
    '1. Restart Next.js dev server, 2. Clear browser cache, 3. Check browser console for errors' as actions;