-- Fix Artworks Table - Add Missing Columns
-- Run this to add commonly needed columns to the artworks table

-- 1. Check current table structure
SELECT 
    'Current Columns' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'artworks' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Add missing columns if they don't exist
DO $$
BEGIN
    -- Add medium column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'artworks' 
                   AND column_name = 'medium' 
                   AND table_schema = 'public') THEN
        ALTER TABLE artworks ADD COLUMN medium VARCHAR(100);
        RAISE NOTICE 'Added medium column';
    END IF;

    -- Add dimensions column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'artworks' 
                   AND column_name = 'dimensions' 
                   AND table_schema = 'public') THEN
        ALTER TABLE artworks ADD COLUMN dimensions VARCHAR(100);
        RAISE NOTICE 'Added dimensions column';
    END IF;

    -- Add image_urls column if it doesn't exist (for multiple images)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'artworks' 
                   AND column_name = 'image_urls' 
                   AND table_schema = 'public') THEN
        ALTER TABLE artworks ADD COLUMN image_urls TEXT[];
        RAISE NOTICE 'Added image_urls column';
    END IF;

    -- Add views_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'artworks' 
                   AND column_name = 'views_count' 
                   AND table_schema = 'public') THEN
        ALTER TABLE artworks ADD COLUMN views_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added views_count column';
    END IF;
END $$;

-- 3. Update existing artworks with sample data (using correct enum values)
UPDATE artworks 
SET 
    medium = CASE 
        WHEN category = 'art_design' THEN 'Mixed Media'
        WHEN category = 'sculpture' THEN 'Bronze'
        WHEN category = 'fashion' THEN 'Textile'
        WHEN category = 'photography' THEN 'Digital Print'
        WHEN category = 'digital_art' THEN 'Digital'
        ELSE 'Mixed Media'
    END,
    dimensions = CASE 
        WHEN category = 'art_design' THEN '60cm x 80cm'
        WHEN category = 'sculpture' THEN '40cm x 30cm x 50cm'
        WHEN category = 'fashion' THEN 'Size M'
        WHEN category = 'photography' THEN '30cm x 40cm'
        WHEN category = 'digital_art' THEN 'Digital Format'
        ELSE 'Various'
    END,
    views_count = FLOOR(RANDOM() * 100) + 10
WHERE medium IS NULL OR dimensions IS NULL;

-- 4. Show updated structure
SELECT 
    'Updated Columns' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'artworks' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Show sample data
SELECT 
    'Sample Updated Data' as info,
    id,
    title,
    category,
    medium,
    dimensions,
    price,
    views_count
FROM artworks 
LIMIT 3;