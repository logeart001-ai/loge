-- Simple fix for cart and orders without DO blocks
-- Run these commands one by one

-- =====================================================
-- STEP 1: Check current setup
-- =====================================================

-- See what cart statuses are in use
SELECT 
    'Current cart statuses' as info,
    status,
    COUNT(*) as count
FROM carts
GROUP BY status;

-- =====================================================
-- STEP 2: Add enum values (run these one at a time)
-- =====================================================

-- Add 'checked_out' to cart_status enum
ALTER TYPE cart_status ADD VALUE IF NOT EXISTS 'checked_out';

-- Add 'inactive' to cart_status enum  
ALTER TYPE cart_status ADD VALUE IF NOT EXISTS 'inactive';

-- =====================================================
-- STEP 3: Clean up cart items
-- =====================================================

-- Delete cart items from non-active carts
DELETE FROM cart_items
WHERE cart_id IN (
    SELECT id FROM carts WHERE status != 'active'
);

-- =====================================================
-- STEP 4: Create order_items table
-- =====================================================

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

-- Enable RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 5: Set up policies
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "users_view_order_items" ON order_items;
DROP POLICY IF EXISTS "buyers_create_order_items" ON order_items;

-- Create view policy
CREATE POLICY "users_view_order_items" ON order_items
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.buyer_id = auth.uid()
        )
        OR auth.uid() = order_items.creator_id
    );

-- Create insert policy
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
-- STEP 6: Create helper function
-- =====================================================

DROP FUNCTION IF EXISTS get_creator_orders(UUID);

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
    SELECT 
        o.id,
        o.order_number,
        o.buyer_id,
        o.total_amount,
        o.status,
        o.created_at,
        o.updated_at
    FROM orders o
    WHERE o.seller_id = creator_uuid
    
    UNION
    
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
    
    ORDER BY created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_creator_orders(UUID) TO authenticated;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check enum values
SELECT 
    'Cart status values' as info,
    enumlabel as value
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'cart_status'
ORDER BY e.enumsortorder;

-- Check policies
SELECT 
    'Order items policies' as info,
    policyname
FROM pg_policies 
WHERE tablename = 'order_items';

-- Check orders
SELECT 
    'Orders with seller_id' as info,
    COUNT(*) as count
FROM orders
WHERE seller_id IS NOT NULL;

SELECT 'Setup complete!' as result;