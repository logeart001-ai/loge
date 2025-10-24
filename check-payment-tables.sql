-- Check if payment-related tables exist and have the correct structure
-- Run this in your Supabase SQL editor

-- Check if orders table exists
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- Check if order_items table exists  
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'order_items'
ORDER BY ordinal_position;

-- Check if carts table exists
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'carts'
ORDER BY ordinal_position;

-- Check if cart_items table exists
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'cart_items'
ORDER BY ordinal_position;

-- Check if you have any active carts
SELECT 
    id,
    user_id,
    status,
    created_at
FROM carts 
WHERE status = 'active'
LIMIT 5;