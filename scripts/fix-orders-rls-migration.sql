-- Migration to fix orders table RLS infinite recursion
-- The problem is multiple SELECT policies with complex subqueries

BEGIN;

-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Creators can view orders for their items" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders as buyer" ON public.orders;

-- Create a single, simple SELECT policy
-- This allows users to see their own orders as buyers
CREATE POLICY "orders_select_policy" ON public.orders
    FOR SELECT USING (auth.uid() = buyer_id);

-- If you need creators to see orders for their items, add it separately with a simpler approach
-- But for now, let's just allow buyers to see their own orders

COMMIT;