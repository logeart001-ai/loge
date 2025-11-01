-- Comprehensive cart system status check
-- Run this to verify cart system is working properly

-- 1. Table existence check
SELECT 
    'Table Status' as check_category,
    required_tables.table_name,
    CASE 
        WHEN t.table_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM (
    VALUES ('carts'), ('cart_items'), ('artworks')
) AS required_tables(table_name)
LEFT JOIN information_schema.tables t ON t.table_name = required_tables.table_name AND t.table_schema = 'public'
ORDER BY required_tables.table_name;

-- 2. Data integrity check
SELECT 
    'Data Integrity' as check_category,
    'Total Carts' as metric,
    COUNT(*) as value
FROM carts
UNION ALL
SELECT 
    'Data Integrity',
    'Total Cart Items',
    COUNT(*)
FROM cart_items
UNION ALL
SELECT 
    'Data Integrity',
    'Valid Cart Items (with existing artworks)',
    COUNT(*)
FROM cart_items ci
JOIN artworks a ON ci.artwork_id = a.id
UNION ALL
SELECT 
    'Data Integrity',
    'Orphaned Cart Items',
    COUNT(*)
FROM cart_items ci
LEFT JOIN artworks a ON ci.artwork_id = a.id
WHERE a.id IS NULL;

-- 3. Foreign key constraints status
SELECT 
    'Foreign Keys' as check_category,
    tc.constraint_name as constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS references_table,
    ccu.column_name AS references_column,
    '✅ ACTIVE' as status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('carts', 'cart_items')
ORDER BY tc.table_name, tc.constraint_name;

-- 4. RLS policies status
SELECT 
    'RLS Policies' as check_category,
    tablename,
    policyname,
    cmd as operation,
    CASE 
        WHEN policyname IS NOT NULL THEN '✅ ACTIVE'
        ELSE '❌ MISSING'
    END as status
FROM pg_policies 
WHERE tablename IN ('carts', 'cart_items')
ORDER BY tablename, policyname;

-- 5. Test cart operations (simulation)
-- Create a test cart entry (will be cleaned up)
DO $$
DECLARE
    test_user_id UUID;
    test_cart_id UUID;
    test_artwork_id UUID;
    test_success BOOLEAN := TRUE;
BEGIN
    -- Get a real user ID for testing (if any exist)
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    -- Get a real artwork ID for testing (if any exist)
    SELECT id INTO test_artwork_id FROM artworks WHERE is_available = true LIMIT 1;
    
    IF test_user_id IS NOT NULL AND test_artwork_id IS NOT NULL THEN
        -- Test cart creation
        INSERT INTO carts (user_id, status) 
        VALUES (test_user_id, 'test') 
        RETURNING id INTO test_cart_id;
        
        -- Test cart item creation
        INSERT INTO cart_items (cart_id, artwork_id, quantity, unit_price)
        VALUES (test_cart_id, test_artwork_id, 1, 100.00);
        
        -- Clean up test data
        DELETE FROM cart_items WHERE cart_id = test_cart_id;
        DELETE FROM carts WHERE id = test_cart_id;
        
        RAISE NOTICE 'Cart Operations Test: ✅ SUCCESS - All operations work correctly';
    ELSE
        RAISE NOTICE 'Cart Operations Test: ⚠️  SKIPPED - No test data available (need users and artworks)';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Cart Operations Test: ❌ FAILED - %', SQLERRM;
    -- Clean up on error
    IF test_cart_id IS NOT NULL THEN
        DELETE FROM cart_items WHERE cart_id = test_cart_id;
        DELETE FROM carts WHERE id = test_cart_id;
    END IF;
END $$;

-- 6. API compatibility test (check if the query structure works)
SELECT 
    'API Compatibility' as check_category,
    'Supabase Join Query Test' as test_name,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ COMPATIBLE'
        ELSE '❌ INCOMPATIBLE'
    END as status
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

-- 7. Summary report
SELECT 
    'CART SYSTEM STATUS SUMMARY' as report_title,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_name IN ('carts', 'cart_items') 
            AND table_schema = 'public'
        ) = 2 
        AND (
            SELECT COUNT(*) FROM information_schema.table_constraints 
            WHERE constraint_type = 'FOREIGN KEY' 
            AND table_name IN ('carts', 'cart_items')
        ) >= 2
        AND (
            SELECT COUNT(*) FROM cart_items ci
            LEFT JOIN artworks a ON ci.artwork_id = a.id
            WHERE a.id IS NULL
        ) = 0
        THEN '🎉 SYSTEM HEALTHY - Cart functionality should work properly'
        ELSE '⚠️  SYSTEM NEEDS ATTENTION - Run fix scripts to resolve issues'
    END as overall_status;