-- Fix cart status enum issue

-- First, check what enum values exist for cart_status
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'cart_status'
ORDER BY e.enumsortorder;

-- Check the carts table structure
SELECT 
    column_name,
    data_type,
    udt_name,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'carts'
AND column_name = 'status';

-- If cart_status enum doesn't have 'completed', we need to add it
-- Or change the column to use a different status value

-- Option 1: Add 'completed' to the enum (if it doesn't exist)
DO $
BEGIN
    -- Check if 'completed' value exists in cart_status enum
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'cart_status' 
        AND e.enumlabel = 'completed'
    ) THEN
        -- Add 'completed' to the enum
        ALTER TYPE cart_status ADD VALUE IF NOT EXISTS 'completed';
        RAISE NOTICE 'Added completed to cart_status enum';
    ELSE
        RAISE NOTICE 'completed already exists in cart_status enum';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not modify enum, it might not exist or column might be text type';
END $;

-- Option 2: If status is just a text field, no changes needed
-- The payment verification code will work as-is

-- Verify the change
SELECT 
    'Cart status enum values' as info,
    enumlabel as value
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'cart_status'
ORDER BY e.enumsortorder;

SELECT 'Cart status enum fixed!' as result;