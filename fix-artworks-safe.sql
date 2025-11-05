-- Safe Artworks Table Fix - Step by Step
-- This script safely adds columns and updates data without enum errors

-- Step 1: Check what we're working with
SELECT 
    'Current Table Structure' as info,
    column_name,
    data_type,
    udt_name
FROM information_schema.columns 
WHERE table_name = 'artworks' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Check current enum values for category
SELECT 
    'Valid Category Values' as info,
    enumlabel as allowed_value
FROM pg_enum 
WHERE enumtypid = (
    SELECT oid 
    FROM pg_type 
    WHERE typname = (
        SELECT udt_name 
        FROM information_schema.columns 
        WHERE table_name = 'artworks' 
            AND column_name = 'category'
            AND table_schema = 'public'
    )
)
ORDER BY enumsortorder;

-- Step 3: Add missing columns one by one
DO $$
BEGIN
    -- Add medium column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'artworks' 
                   AND column_name = 'medium' 
                   AND table_schema = 'public') THEN
        ALTER TABLE artworks ADD COLUMN medium VARCHAR(100);
        RAISE NOTICE 'Added medium column';
    ELSE
        RAISE NOTICE 'Medium column already exists';
    END IF;

    -- Add dimensions column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'artworks' 
                   AND column_name = 'dimensions' 
                   AND table_schema = 'public') THEN
        ALTER TABLE artworks ADD COLUMN dimensions VARCHAR(100);
        RAISE NOTICE 'Added dimensions column';
    ELSE
        RAISE NOTICE 'Dimensions column already exists';
    END IF;

    -- Add views_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'artworks' 
                   AND column_name = 'views_count' 
                   AND table_schema = 'public') THEN
        ALTER TABLE artworks ADD COLUMN views_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added views_count column';
    ELSE
        RAISE NOTICE 'Views_count column already exists';
    END IF;
END $$;

-- Step 4: Update data using ONLY the enum values that actually exist
-- First, let's see what categories we actually have
SELECT 
    'Current Categories in Use' as info,
    category,
    COUNT(*) as count
FROM artworks 
GROUP BY category;

-- Step 5: Safe update using only existing categories
UPDATE artworks 
SET 
    medium = CASE 
        WHEN category = 'art_design' THEN 'Mixed Media'
        WHEN category = 'sculpture' THEN 'Bronze'
        WHEN category = 'fashion' THEN 'Textile'
        ELSE 'Mixed Media'
    END,
    dimensions = CASE 
        WHEN category = 'art_design' THEN '60cm x 80cm'
        WHEN category = 'sculpture' THEN '40cm x 30cm x 50cm'
        WHEN category = 'fashion' THEN 'Size M'
        ELSE 'Various'
    END,
    views_count = COALESCE(views_count, FLOOR(RANDOM() * 100) + 10)
WHERE medium IS NULL OR dimensions IS NULL OR views_count IS NULL;

-- Step 6: Verify the final result
SELECT 
    'Final Table Structure' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'artworks' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 7: Show sample updated data
SELECT 
    'Sample Updated Artworks' as info,
    id,
    title,
    category,
    medium,
    dimensions,
    views_count,
    price
FROM artworks 
LIMIT 5;