-- Fix orphaned cart items before adding foreign key constraints
-- Run this in your Supabase SQL editor

-- 1. First, let's see what we're dealing with
SELECT 
    'Orphaned Cart Items Analysis' as analysis_type,
    COUNT(*) as total_cart_items,
    COUNT(CASE WHEN a.id IS NULL THEN 1 END) as orphaned_items,
    COUNT(CASE WHEN a.id IS NOT NULL THEN 1 END) as valid_items
FROM cart_items ci
LEFT JOIN artworks a ON ci.artwork_id = a.id;

-- 2. Show the specific orphaned items
SELECT 
    'Orphaned Items Details' as details,
    ci.id as cart_item_id,
    ci.artwork_id as missing_artwork_id,
    ci.quantity,
    ci.unit_price,
    ci.created_at
FROM cart_items ci
LEFT JOIN artworks a ON ci.artwork_id = a.id
WHERE a.id IS NULL
ORDER BY ci.created_at DESC;

-- 3. Clean up orphaned cart items (items referencing non-existent artworks)
DELETE FROM cart_items 
WHERE artwork_id NOT IN (
    SELECT id FROM artworks
);

-- 4. Show cleanup results
SELECT 
    'After Cleanup' as status,
    COUNT(*) as remaining_cart_items
FROM cart_items;

-- 5. Verify all remaining cart items have valid artwork references
SELECT 
    'Validation Check' as check_type,
    COUNT(*) as total_items,
    COUNT(CASE WHEN a.id IS NOT NULL THEN 1 END) as valid_references,
    COUNT(CASE WHEN a.id IS NULL THEN 1 END) as invalid_references
FROM cart_items ci
LEFT JOIN artworks a ON ci.artwork_id = a.id;

-- 6. Now safely add the foreign key constraints
DO $$ 
BEGIN
    -- Drop existing constraint if it exists (in case of partial previous runs)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'cart_items_artwork_id_fkey' 
        AND table_name = 'cart_items'
    ) THEN
        ALTER TABLE cart_items DROP CONSTRAINT cart_items_artwork_id_fkey;
    END IF;
    
    -- Add the foreign key constraint
    ALTER TABLE cart_items 
    ADD CONSTRAINT cart_items_artwork_id_fkey 
    FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Foreign key constraint added successfully';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error adding foreign key constraint: %', SQLERRM;
END $$;

-- 7. Verify the constraint was added
SELECT 
    'Constraint Verification' as check_type,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'cart_items'
AND kcu.column_name = 'artwork_id';

-- 8. Test the relationship query that was failing
SELECT 
    'Relationship Test' as test_type,
    ci.id,
    ci.artwork_id,
    ci.quantity,
    ci.unit_price,
    a.title as artwork_title,
    a.thumbnail_url
FROM cart_items ci
JOIN artworks a ON ci.artwork_id = a.id
LIMIT 5;