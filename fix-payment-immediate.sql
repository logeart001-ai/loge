-- Immediate fix for payment constraint error
-- Run this to allow creator users to make purchases

-- Step 1: Make seller_id nullable (this is the key fix)
ALTER TABLE orders ALTER COLUMN seller_id DROP NOT NULL;

-- Step 2: Check current orders table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('seller_id', 'buyer_id')
ORDER BY column_name;

-- That's it! The payment should now work.
-- The updated code will handle missing seller_id gracefully.

SELECT 'Constraint fixed - payments should now work for creator users!' as result;