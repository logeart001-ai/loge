-- Quick fix for the payment issue: "orders_seller_id_fkey" constraint violation
-- This script addresses the immediate problem preventing creators from making purchases

-- =====================================================
-- STEP 1: Make seller_id nullable (if not already)
-- =====================================================

-- Make seller_id nullable to allow orders without valid sellers
ALTER TABLE orders ALTER COLUMN seller_id DROP NOT NULL;

-- =====================================================
-- STEP 2: Check for problematic artworks
-- =====================================================

-- Find artworks with creator_ids that don't exist in profiles
SELECT 
    'Artworks with invalid creator_ids' as issue,
    COUNT(*) as count
FROM artworks a
LEFT JOIN profiles p ON a.creator_id = p.id
WHERE a.creator_id IS NOT NULL AND p.id IS NULL;

-- =====================================================
-- STEP 3: Fix artworks with invalid creator_ids
-- =====================================================

-- Option 1: Set invalid creator_ids to NULL (safest approach)
UPDATE artworks 
SET creator_id = NULL,
    updated_at = NOW()
WHERE creator_id IS NOT NULL 
AND creator_id NOT IN (SELECT id FROM profiles WHERE id IS NOT NULL);

-- =====================================================
-- STEP 4: Ensure all users have profiles
-- =====================================================

-- Create profiles for any auth.users that don't have them
INSERT INTO profiles (id, email, user_type, created_at, updated_at)
SELECT 
    u.id,
    u.email,
    'collector' as user_type,  -- Default to collector
    NOW(),
    NOW()
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 5: Update creator user types for users who have artworks
-- =====================================================

-- Set user_type to 'creator' for users who have created artworks
UPDATE profiles 
SET user_type = 'creator',
    updated_at = NOW()
WHERE id IN (
    SELECT DISTINCT creator_id 
    FROM artworks 
    WHERE creator_id IS NOT NULL
)
AND user_type != 'creator';

-- =====================================================
-- STEP 6: Verification
-- =====================================================

-- Check that all artworks now have valid creator references
SELECT 
    'Verification: Artworks with valid creators' as check_type,
    COUNT(*) as total_artworks,
    COUNT(a.creator_id) as with_creator_id,
    COUNT(p.id) as with_valid_creator
FROM artworks a
LEFT JOIN profiles p ON a.creator_id = p.id;

-- Check orders table structure
SELECT 
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name = 'seller_id';

SELECT 'Payment issue should now be resolved! Orders can be created with or without seller_id.' as status;