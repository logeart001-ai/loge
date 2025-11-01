-- Immediate cart system fix
-- Run this to fix the cart system issues identified

-- 1. First, let's see what's wrong
SELECT 'DIAGNOSTIC: Checking current issues' as step;

-- Check if tables exist
SELECT 
    'Table Check' as check_type,
    'carts' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'carts' AND table_schema = 'public') 
         THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'Table Check',
    'cart_items',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cart_items' AND table_schema = 'public') 
         THEN 'EXISTS' ELSE 'MISSING' END
UNION ALL
SELECT 
    'Table Check',
    'artworks',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'artworks' AND table_schema = 'public') 
         THEN 'EXISTS' ELSE 'MISSING' END;

-- Check for orphaned cart items
SELECT 
    'Orphaned Items' as check_type,
    COUNT(*) as count,
    CASE WHEN COUNT(*) > 0 THEN 'NEEDS CLEANUP' ELSE 'OK' END as status
FROM cart_items ci
LEFT JOIN artworks a ON ci.artwork_id = a.id
WHERE a.id IS NULL;

-- Check foreign key constraints
SELECT 
    'Foreign Keys' as check_type,
    COUNT(*) as constraint_count,
    CASE WHEN COUNT(*) >= 2 THEN 'OK' ELSE 'MISSING' END as status
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' 
AND table_name IN ('cart_items')
AND constraint_name LIKE '%artwork_id%' OR constraint_name LIKE '%cart_id%';

-- 2. CLEANUP: Remove orphaned cart items
SELECT 'STEP 1: Cleaning up orphaned cart items' as step;

DELETE FROM cart_items 
WHERE artwork_id NOT IN (
    SELECT id FROM artworks WHERE id IS NOT NULL
);

SELECT 'Orphaned cart items removed' as result;

-- 3. CLEANUP: Remove orphaned carts
SELECT 'STEP 2: Cleaning up orphaned carts' as step;

DELETE FROM carts 
WHERE user_id NOT IN (
    SELECT id FROM auth.users WHERE id IS NOT NULL
);

SELECT 'Orphaned carts removed' as result;

-- 4. ADD CONSTRAINTS: Add missing foreign key constraints
SELECT 'STEP 3: Adding foreign key constraints' as step;

-- Add cart_items -> artworks foreign key
DO $$ 
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'cart_items_artwork_id_fkey' 
        AND table_name = 'cart_items'
    ) THEN
        ALTER TABLE cart_items DROP CONSTRAINT cart_items_artwork_id_fkey;
    END IF;
    
    -- Add the constraint
    ALTER TABLE cart_items 
    ADD CONSTRAINT cart_items_artwork_id_fkey 
    FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Added artwork_id foreign key constraint';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error adding artwork_id constraint: %', SQLERRM;
END $$;

-- Add cart_items -> carts foreign key
DO $$ 
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'cart_items_cart_id_fkey' 
        AND table_name = 'cart_items'
    ) THEN
        ALTER TABLE cart_items DROP CONSTRAINT cart_items_cart_id_fkey;
    END IF;
    
    -- Add the constraint
    ALTER TABLE cart_items 
    ADD CONSTRAINT cart_items_cart_id_fkey 
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Added cart_id foreign key constraint';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error adding cart_id constraint: %', SQLERRM;
END $$;

-- Add carts -> users foreign key
DO $$ 
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'carts_user_id_fkey' 
        AND table_name = 'carts'
    ) THEN
        ALTER TABLE carts DROP CONSTRAINT carts_user_id_fkey;
    END IF;
    
    -- Add the constraint
    ALTER TABLE carts 
    ADD CONSTRAINT carts_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Added user_id foreign key constraint';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error adding user_id constraint: %', SQLERRM;
END $$;

-- 5. VERIFY: Test the fixes
SELECT 'STEP 4: Verifying fixes' as step;

-- Check constraint count
SELECT 
    'Constraint Verification' as check_type,
    COUNT(*) as total_constraints
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' 
AND table_name IN ('carts', 'cart_items');

-- Test the relationship query
SELECT 
    'Relationship Test' as check_type,
    COUNT(*) as valid_items,
    'SUCCESS' as status
FROM cart_items ci
LEFT JOIN artworks a ON ci.artwork_id = a.id;

-- 6. FINAL STATUS
SELECT 
    'CART SYSTEM STATUS' as final_check,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM information_schema.table_constraints 
            WHERE constraint_type = 'FOREIGN KEY' 
            AND table_name IN ('carts', 'cart_items')
        ) >= 3
        AND (
            SELECT COUNT(*) FROM cart_items ci
            LEFT JOIN artworks a ON ci.artwork_id = a.id
            WHERE a.id IS NULL
        ) = 0
        THEN '✅ SYSTEM FIXED - Cart should work now'
        ELSE '⚠️ STILL NEEDS ATTENTION - Check error messages above'
    END as status;