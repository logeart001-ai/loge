-- Debug cart tables and relationships
-- Run this in your Supabase SQL editor to diagnose cart issues

-- 1. Check if tables exist
SELECT 
    'Table Existence Check' as check_type,
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('carts', 'cart_items', 'artworks')
ORDER BY table_name;

-- 2. Check table structures
SELECT 
    'carts' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'carts'
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
    'cart_items' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'cart_items'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check foreign key constraints
SELECT 
    'Foreign Key Constraints' as check_type,
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('carts', 'cart_items')
ORDER BY tc.table_name, tc.constraint_name;

-- 4. Check RLS policies
SELECT 
    'RLS Policies' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('carts', 'cart_items')
ORDER BY tablename, policyname;

-- 5. Test basic queries
SELECT 'Cart Count' as metric, COUNT(*) as value FROM carts;
SELECT 'Cart Items Count' as metric, COUNT(*) as value FROM cart_items;
SELECT 'Artworks Count' as metric, COUNT(*) as value FROM artworks;

-- 6. Test the problematic join query
SELECT 
    'Join Test' as test_type,
    ci.id,
    ci.artwork_id,
    ci.unit_price,
    ci.quantity,
    a.id as artwork_check,
    a.title,
    a.thumbnail_url
FROM cart_items ci
LEFT JOIN artworks a ON ci.artwork_id = a.id
LIMIT 3;

-- 7. Test Supabase-style relationship query (this might fail)
-- This is what Supabase PostgREST tries to do internally
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
    ) as artwork
FROM cart_items ci
LEFT JOIN artworks a ON ci.artwork_id = a.id
LIMIT 3;