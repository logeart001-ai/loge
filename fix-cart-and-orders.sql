-- Fix cart clearing and creator orders visibility issues

-- =====================================================
-- ISSUE 1: Cart not clearing after purchase
-- =====================================================

-- Check if there are completed carts with items still attached
SELECT 
    'Completed carts with items' as issue,
    COUNT(DISTINCT c.id) as cart_count,
    COUNT(ci.id) as item_count
FROM carts c
LEFT JOIN cart_items ci ON c.id = ci.cart_id
WHERE c.status = 'completed'
AND ci.id IS NOT NULL;

-- Clean up any orphaned cart items from completed carts
DELETE FROM cart_items
WHERE cart_id IN (
    SELECT id FROM carts WHERE status = 'completed'
);

-- =====================================================
-- ISSUE 2: Creator orders visibility
-- =====================================================

-- Check current orders structure
SELECT 
    'Orders table structure' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders'
AND column_name IN ('id', 'buyer_id', 'seller_id', 'item_id', 'item_type')
ORDER BY ordinal_position;

-- Check if order_items table exists
SELECT 
    'Order items table exists' as info,
    COUNT(*) as exists
FROM information_schema.tables 
WHERE table_name = 'order_items';

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

-- Enable RLS on order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing order_items policies
DROP POLICY IF EXISTS "users_view_order_items" ON order_items;
DROP POLICY IF EXISTS "buyers_create_order_items" ON order_items;
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Creators can view their order items" ON order_items;

-- Create simple policies for order_items
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
-- ISSUE 3: Ensure get_creator_orders function exists
-- =====================================================

-- Drop and recreate the function
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
    -- For the current schema where orders have seller_id
    -- Return orders where the user is the seller
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
    ORDER BY o.created_at DESC;
    
    -- If no results and order_items table exists, try that approach
    IF NOT FOUND THEN
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
    END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_creator_orders(UUID) TO authenticated;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check orders for creators
SELECT 
    'Orders with seller_id' as check_type,
    COUNT(*) as count
FROM orders
WHERE seller_id IS NOT NULL;

-- Check order_items
SELECT 
    'Order items with creator_id' as check_type,
    COUNT(*) as count
FROM order_items
WHERE creator_id IS NOT NULL;

-- Check RLS policies
SELECT 
    tablename,
    policyname,
    cmd as command
FROM pg_policies 
WHERE tablename IN ('orders', 'order_items')
ORDER BY tablename, policyname;

SELECT 'Cart and orders issues should now be fixed!' as result;