-- Simple cart system check
-- Run this to quickly verify cart system status

-- 1. Check if required tables exist
SELECT 'carts table' as table_check, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'carts' AND table_schema = 'public') 
            THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 'cart_items table' as table_check,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cart_items' AND table_schema = 'public') 
            THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 'artworks table' as table_check,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'artworks' AND table_schema = 'public') 
            THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- 2. Check data counts
SELECT 'Data Counts' as category, 'carts' as table_name, COUNT(*) as count FROM carts
UNION ALL
SELECT 'Data Counts', 'cart_items', COUNT(*) FROM cart_items
UNION ALL
SELECT 'Data Counts', 'artworks', COUNT(*) FROM artworks;

-- 3. Check for orphaned cart items
SELECT 
    'Orphaned Items Check' as category,
    COUNT(*) as orphaned_cart_items
FROM cart_items ci
LEFT JOIN artworks a ON ci.artwork_id = a.id
WHERE a.id IS NULL;

-- 4. Check foreign key constraints
SELECT 
    'Foreign Key Check' as category,
    constraint_name,
    table_name,
    '✅ ACTIVE' as status
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' 
AND table_name IN ('carts', 'cart_items')
ORDER BY table_name, constraint_name;

-- 5. Simple relationship test
SELECT 
    'Relationship Test' as category,
    'SUCCESS' as result,
    COUNT(*) as valid_relationships
FROM cart_items ci
JOIN artworks a ON ci.artwork_id = a.id;