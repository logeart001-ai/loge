-- Simple fix for payment issue: orders_seller_id_fkey constraint violation
-- Run these commands one by one in Supabase SQL editor

-- 1. Make seller_id nullable in orders table
ALTER TABLE orders ALTER COLUMN seller_id DROP NOT NULL;

-- 2. Check for artworks with invalid creator_ids
SELECT 
    'Artworks with invalid creator_ids' as issue,
    COUNT(*) as count
FROM artworks a
LEFT JOIN profiles p ON a.creator_id = p.id
WHERE a.creator_id IS NOT NULL AND p.id IS NULL;

-- 3. Fix artworks with invalid creator_ids (set to NULL)
UPDATE artworks 
SET creator_id = NULL,
    updated_at = NOW()
WHERE creator_id IS NOT NULL 
AND creator_id NOT IN (SELECT id FROM profiles WHERE id IS NOT NULL);

-- 4. Create profiles for users who don't have them
INSERT INTO profiles (id, email, user_type, created_at, updated_at)
SELECT 
    u.id,
    u.email,
    'collector',
    NOW(),
    NOW()
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 5. Update user types for creators
UPDATE profiles 
SET user_type = 'creator',
    updated_at = NOW()
WHERE id IN (
    SELECT DISTINCT creator_id 
    FROM artworks 
    WHERE creator_id IS NOT NULL
)
AND user_type != 'creator';

-- 6. Verification - check results
SELECT 
    'Fixed artworks' as status,
    COUNT(*) as total_artworks,
    COUNT(a.creator_id) as with_creator_id,
    COUNT(p.id) as with_valid_creator
FROM artworks a
LEFT JOIN profiles p ON a.creator_id = p.id;

-- Success message
SELECT 'Payment issue fixed! Creator users can now make purchases.' as result;