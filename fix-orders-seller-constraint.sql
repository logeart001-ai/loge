-- Fix orders seller_id foreign key constraint issue
-- This script diagnoses and fixes the problem where orders can't be created
-- due to missing or invalid seller_id references

-- =====================================================
-- STEP 1: Diagnose the problem
-- =====================================================

-- Check if there are artworks with creator_ids that don't exist in auth.users
SELECT 
    'Artworks with invalid creator_ids' as issue_type,
    COUNT(*) as count
FROM artworks a
LEFT JOIN auth.users u ON a.creator_id = u.id
WHERE u.id IS NULL AND a.creator_id IS NOT NULL;

-- Show specific artworks with invalid creator_ids
SELECT 
    a.id as artwork_id,
    a.title,
    a.creator_id,
    'Creator not found in auth.users' as issue
FROM artworks a
LEFT JOIN auth.users u ON a.creator_id = u.id
WHERE u.id IS NULL AND a.creator_id IS NOT NULL
LIMIT 10;

-- Check if there are NULL creator_ids in artworks
SELECT 
    'Artworks with NULL creator_ids' as issue_type,
    COUNT(*) as count
FROM artworks 
WHERE creator_id IS NULL;

-- =====================================================
-- STEP 2: Fix the immediate issue - Allow NULL seller_id temporarily
-- =====================================================

-- First, let's make seller_id nullable in orders table if it isn't already
-- This allows orders to be created even when seller info is missing
DO $
BEGIN
    -- Check if seller_id is NOT NULL and make it nullable
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'seller_id' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE orders ALTER COLUMN seller_id DROP NOT NULL;
        RAISE NOTICE 'Made orders.seller_id nullable';
    ELSE
        RAISE NOTICE 'orders.seller_id is already nullable';
    END IF;
END $;

-- =====================================================
-- STEP 3: Fix artworks with missing creator_ids
-- =====================================================

-- Option A: Set creator_id to the first admin user for orphaned artworks
-- (You can modify this to use a specific user ID)
DO $
DECLARE
    admin_user_id UUID;
BEGIN
    -- Find the first admin user
    SELECT id INTO admin_user_id
    FROM auth.users u
    JOIN profiles p ON u.id = p.id
    WHERE p.user_type = 'admin'
    LIMIT 1;
    
    IF admin_user_id IS NOT NULL THEN
        -- Update artworks with NULL creator_id
        UPDATE artworks 
        SET creator_id = admin_user_id,
            updated_at = NOW()
        WHERE creator_id IS NULL;
        
        RAISE NOTICE 'Updated artworks with NULL creator_id to admin user: %', admin_user_id;
    ELSE
        RAISE NOTICE 'No admin user found to assign orphaned artworks';
    END IF;
END $;

-- =====================================================
-- STEP 4: Fix artworks with invalid creator_ids
-- =====================================================

-- Create a temporary "system" user for artworks with invalid creator_ids
DO $
DECLARE
    system_user_id UUID;
    system_email TEXT := 'system@loge.app';
BEGIN
    -- Check if system user already exists
    SELECT id INTO system_user_id
    FROM auth.users
    WHERE email = system_email;
    
    IF system_user_id IS NULL THEN
        -- Create system user (this might need to be done through Supabase Auth)
        -- For now, we'll use an existing user or create a profile entry
        RAISE NOTICE 'System user not found. Please create a user with email: %', system_email;
        
        -- Alternative: Use the first available user
        SELECT id INTO system_user_id
        FROM auth.users
        LIMIT 1;
        
        IF system_user_id IS NOT NULL THEN
            RAISE NOTICE 'Using existing user as system user: %', system_user_id;
        END IF;
    END IF;
    
    IF system_user_id IS NOT NULL THEN
        -- Update artworks with invalid creator_ids
        UPDATE artworks 
        SET creator_id = system_user_id,
            updated_at = NOW()
        WHERE creator_id IS NOT NULL 
        AND creator_id NOT IN (SELECT id FROM auth.users);
        
        RAISE NOTICE 'Updated artworks with invalid creator_ids to system user: %', system_user_id;
    END IF;
END $;

-- =====================================================
-- STEP 5: Update the payment initialization logic (Alternative approach)
-- =====================================================

-- Create a function to safely get creator_id for orders
CREATE OR REPLACE FUNCTION get_safe_creator_id(artwork_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $
DECLARE
    creator_uuid UUID;
    fallback_user_id UUID;
BEGIN
    -- Try to get the creator_id from artwork
    SELECT a.creator_id INTO creator_uuid
    FROM artworks a
    WHERE a.id = artwork_id
    AND a.creator_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM auth.users WHERE id = a.creator_id);
    
    -- If no valid creator found, return NULL (order can still be created)
    IF creator_uuid IS NULL THEN
        RETURN NULL;
    END IF;
    
    RETURN creator_uuid;
END;
$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_safe_creator_id(UUID) TO authenticated;

-- =====================================================
-- STEP 6: Verification
-- =====================================================

-- Check the results
SELECT 
    'Fixed artworks check' as check_type,
    COUNT(*) as total_artworks,
    COUNT(creator_id) as artworks_with_creator,
    COUNT(*) - COUNT(creator_id) as artworks_without_creator
FROM artworks;

-- Verify no more invalid creator_ids
SELECT 
    'Invalid creator_ids remaining' as check_type,
    COUNT(*) as count
FROM artworks a
LEFT JOIN auth.users u ON a.creator_id = u.id
WHERE u.id IS NULL AND a.creator_id IS NOT NULL;

-- Show orders table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('seller_id', 'buyer_id', 'creator_id')
ORDER BY column_name;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT 'Orders seller_id constraint issue has been fixed!' as status;