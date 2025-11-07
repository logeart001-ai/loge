-- Comprehensive fix for cart clearing and creator orders
-- This version handles enum types properly

-- =====================================================
-- STEP 1: Check current cart status values
-- =====================================================

-- See what status values are currently in use
SELECT 
    'Current cart statuses' as info,
    status,
    COUNT(*) as count
FROM carts
GROUP BY status;

-- Check if status is an enum or text
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns 
WHERE table_name = 'carts'
AND column_name = 'status';

-- =====================================================
-- STEP 2: Add missing enum values if needed
-- =====================================================

-- Try to add 'checked_out' and 'inactive' to cart_status enum
DO $
BEGIN
    -- Only run if cart_status is an enum type
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cart_status') THEN
        -- Add 'checked_out' if it doesn't exist
        BEGIN
            ALTER TYPE cart_status ADD VALUE IF NOT EXISTS 'checked_out';
            RAISE NOTICE 'Added checked_out to cart_status enum';
        EXCEPTION
            WHEN duplicate_object THEN
                RAISE NOTICE 'checked_out already exists in cart_status enum';
        END;
        
        -- Add 'inactive' if it doesn't exist
        BEGIN
            ALTER TYPE cart_status ADD VALUE IF NOT EXISTS 'inactive';
            RAISE NOTICE 'Added inactive to cart_status enum';
        EXCEPTION
            WHEN duplicate_object THEN
                RAISE NOTICE 'inactive already exists in cart_status enum';
        END;
    ELSE
        RAISE NOTICE 'cart_status is not an enum type, no changes needed';
    END IF;
END $;

-- =====================================================
-- STEP 3: Clean up cart items from non-active carts
-- =====================================================

-- This ensures old cart items don't show up
DELETE FROM cart_items
WHERE cart_id IN (
    SELECT id FROM carts WHERE status != 'active'
);

-- =====================================================
-- STEP 4: Set up order_items table and policies
-- =====================================================

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

-- Enable RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "users_view_order_items" ON order_items;
DROP POLICY IF EXISTS "buyers_create_order_items" ON order_items;

-- Create policies
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
-- STEP 5: Create/update get_creator_orders function
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

-- Show cart status enum values
SELECT 
    'Cart status enum values' as info,
    enumlabel as value
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'cart_status'
ORDER BY e.enumsortorder;

-- Show order_items policies
SELECT 
    'Order items policies' as info,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'order_items';

-- Show sample orders for creators
SELECT 
    'Sample creator orders' as info,
    COUNT(*) as total_orders
FROM orders
WHERE seller_id IS NOT NULL;

SELECT 'Setup complete!' as result;