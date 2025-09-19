# RLS Policy Infinite Recursion Fix

## Issue Description
The orders table has RLS policies that cause "infinite recursion detected in policy for relation 'orders'" error (PostgreSQL error code 42P17).

## Root Cause
Multiple SELECT policies on the orders table:
1. "Creators can view orders for their items" - Complex subquery to order_items table
2. "Users can view own orders as buyer" - Simple buyer_id check

The first policy creates a circular dependency when combined with RLS policies on related tables.

## Temporary Fix (Currently Applied)
- File: `app/dashboard/collector/orders/page.tsx`
- Solution: Use service role instead of authenticated client to bypass RLS
- Security: Still filters by user ID, but bypasses problematic policies

## Permanent Fix Required
Execute this SQL on the database:

```sql
BEGIN;

-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Creators can view orders for their items" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders as buyer" ON public.orders;

-- Create a single, simple SELECT policy
CREATE POLICY "orders_select_policy" ON public.orders
    FOR SELECT USING (auth.uid() = buyer_id);

-- If creators need to see orders for their items, create a separate view or function
-- instead of using complex RLS policies

COMMIT;
```

## How to Apply the Fix
1. Access Supabase Studio SQL Editor
2. Run the SQL above
3. Revert the temporary service role fix in the orders page
4. Test that the orders page works with regular authenticated queries

## Verification
After applying the fix, this query should work without errors:
```javascript
// Should work without "infinite recursion" error
const { data, error } = await supabase
  .from('orders')
  .select('*')
  .eq('buyer_id', userId)
```

## Files Modified (Temporarily)
- `app/dashboard/collector/orders/page.tsx` - Using service role as workaround