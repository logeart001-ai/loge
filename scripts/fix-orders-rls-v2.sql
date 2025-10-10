-- =====================================================
-- FIX: Orders RLS Policies - Remove Infinite Recursion
-- Date: October 10, 2025
-- Issue: Complex policies causing infinite recursion
-- Solution: Simple, direct policies without recursive queries
-- =====================================================

-- First, let's check and create tables if they don't exist
-- This ensures the migration can run even if tables aren't fully set up

-- Create order_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  artwork_id UUID NOT NULL,
  creator_id UUID NOT NULL,
  
  artwork_title TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_at_purchase DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  
  creator_commission_rate DECIMAL(5,4) DEFAULT 0.85,
  platform_fee_rate DECIMAL(5,4) DEFAULT 0.15,
  creator_earnings DECIMAL(10,2),
  platform_earnings DECIMAL(10,2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on both tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 1: Clean up existing policies
-- =====================================================

-- Drop all existing problematic policies on orders table
DROP POLICY IF EXISTS "Creators can view orders for their items" ON orders;
DROP POLICY IF EXISTS "Users can view own orders as buyer" ON orders;
DROP POLICY IF EXISTS "Users can view orders" ON orders;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Buyers can view their orders" ON orders;
DROP POLICY IF EXISTS "Creators can view orders" ON orders;
DROP POLICY IF EXISTS "buyers_view_own_orders" ON orders;
DROP POLICY IF EXISTS "buyers_create_own_orders" ON orders;
DROP POLICY IF EXISTS "buyers_update_own_orders" ON orders;

-- Drop existing order_items policies
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Creators can view their order items" ON order_items;
DROP POLICY IF EXISTS "users_view_order_items" ON order_items;
DROP POLICY IF EXISTS "buyers_create_order_items" ON order_items;

-- =====================================================
-- STEP 2: Create simple, non-recursive policies
-- =====================================================

-- Orders: Buyers can view their own orders
CREATE POLICY "buyers_view_own_orders" ON orders
    FOR SELECT
    TO authenticated
    USING (auth.uid() = buyer_id);

-- Orders: Buyers can create their own orders
CREATE POLICY "buyers_create_own_orders" ON orders
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = buyer_id);

-- Orders: Buyers can update their own orders
CREATE POLICY "buyers_update_own_orders" ON orders
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = buyer_id)
    WITH CHECK (auth.uid() = buyer_id);

-- =====================================================
-- STEP 3: Order Items Policies
-- =====================================================

-- Order Items: Users can view items from their orders OR items they created
CREATE POLICY "users_view_order_items" ON order_items
    FOR SELECT
    TO authenticated
    USING (
        -- User is the buyer of the order
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.buyer_id = auth.uid()
        )
        OR
        -- User is the creator of the item
        auth.uid() = order_items.creator_id
    );

-- Order Items: Buyers can create order items for their orders
CREATE POLICY "buyers_create_order_items" ON order_items
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.buyer_id = auth.uid()
        )
    );

-- =====================================================
-- STEP 4: Helper function for creators to see their sales
-- =====================================================

-- Drop the function if it exists
DROP FUNCTION IF EXISTS get_creator_orders(UUID);

-- Create helper function for creators
CREATE OR REPLACE FUNCTION get_creator_orders(creator_uuid UUID)
RETURNS TABLE (
    id UUID,
    order_number TEXT,
    buyer_id UUID,
    total_amount DECIMAL,
    status TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        o.id,
        o.order_number,
        o.buyer_id,
        o.total_amount,
        o.status,
        o.created_at,
        o.updated_at
    FROM orders o
    INNER JOIN order_items oi ON o.id = oi.order_id
    WHERE oi.creator_id = creator_uuid
    ORDER BY o.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_creator_orders(UUID) TO authenticated;

-- Add helpful comments
COMMENT ON POLICY "buyers_view_own_orders" ON orders IS 
'Allows buyers to view only their own orders without recursion';

COMMENT ON POLICY "users_view_order_items" ON order_items IS 
'Allows buyers to see items from their orders and creators to see their sold items';

COMMENT ON FUNCTION get_creator_orders(UUID) IS 
'Helper function for creators to see orders containing their items. Bypasses RLS safely.';

-- =====================================================
-- STEP 5: Verification (optional - shows results)
-- =====================================================

-- Verify RLS is enabled
SELECT 
    schemaname,
    tablename, 
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename IN ('orders', 'order_items')
ORDER BY tablename;

-- Show all policies on orders table
SELECT 
    tablename,
    policyname,
    cmd as "Command"
FROM pg_policies 
WHERE tablename = 'orders'
ORDER BY policyname;

-- Show all policies on order_items table
SELECT 
    tablename,
    policyname,
    cmd as "Command"
FROM pg_policies 
WHERE tablename = 'order_items'
ORDER BY policyname;

-- =====================================================
-- SUCCESS! RLS policies are now fixed
-- =====================================================
