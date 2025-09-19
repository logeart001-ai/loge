-- Fix RLS policy infinite recursion on orders table
-- The issue is multiple complex SELECT policies causing recursion

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Creators can view orders for their items" ON orders;
DROP POLICY IF EXISTS "Users can view own orders as buyer" ON orders;

-- Create a single, simple SELECT policy for orders
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (
        auth.uid() = buyer_id OR 
        auth.uid() IN (
            SELECT creator_id 
            FROM order_items 
            WHERE order_id = orders.id
        )
    );

-- Alternatively, if the above still causes issues, we can use a simpler policy:
-- CREATE POLICY "Users can view own orders" ON orders
--     FOR SELECT USING (auth.uid() = buyer_id);

-- Check the result
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'orders' AND cmd = 'SELECT';