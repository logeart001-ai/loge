-- Quick verification to check all RLS policies
-- Run this to confirm everything is set up correctly

-- 1. Check if RLS is enabled on both tables
SELECT 
    tablename, 
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('orders', 'order_items')
ORDER BY tablename;

-- 2. Check all policies on ORDERS table
SELECT 
    tablename,
    policyname,
    cmd as "Command",
    roles
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename = 'orders'
ORDER BY policyname;

-- 3. Check all policies on ORDER_ITEMS table  
SELECT 
    tablename,
    policyname,
    cmd as "Command",
    roles
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename = 'order_items'
ORDER BY policyname;

-- 4. Check if helper function exists
SELECT 
    proname as "Function Name",
    pronargs as "Number of Args"
FROM pg_proc 
WHERE proname = 'get_creator_orders';

-- Expected Results:
-- ==================
-- Table: orders
--   - buyers_view_own_orders (SELECT)
--   - buyers_create_own_orders (INSERT)
--   - buyers_update_own_orders (UPDATE)
--
-- Table: order_items
--   - users_view_order_items (SELECT)
--   - buyers_create_order_items (INSERT)
--
-- Function: get_creator_orders (should exist)
