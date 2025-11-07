-- Simple cart cleanup without assuming enum values

-- First, let's see what status values are actually used
SELECT 
    'Current cart statuses in use' as info,
    status,
    COUNT(*) as count
FROM carts
GROUP BY status
ORDER BY count DESC;

-- Check the cart_items that might be orphaned
SELECT 
    'Cart items without active carts' as info,
    COUNT(*) as count
FROM cart_items ci
LEFT JOIN carts c ON ci.cart_id = c.id
WHERE c.id IS NULL OR c.status != 'active';

-- Clean up cart items from non-active carts
-- This is safe because we only want to show items from active carts
DELETE FROM cart_items
WHERE cart_id IN (
    SELECT id FROM carts WHERE status != 'active'
);

-- Alternative: If you want to keep the data but just hide it,
-- you can leave the items and rely on the API to filter by status='active'

SELECT 'Cart cleanup complete!' as result;