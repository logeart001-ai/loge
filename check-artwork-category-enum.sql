-- Check Artwork Category Enum Values
-- Run this to see what category values are allowed

-- 1. Check if category column is an enum
SELECT 
    'Column Info' as info_type,
    column_name,
    data_type,
    udt_name
FROM information_schema.columns 
WHERE table_name = 'artworks' 
    AND column_name = 'category'
    AND table_schema = 'public';

-- 2. Get enum values if it's an enum type
SELECT 
    'Enum Values' as info_type,
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

-- 3. Show current category values in use
SELECT 
    'Current Values' as info_type,
    category,
    COUNT(*) as count
FROM artworks 
GROUP BY category
ORDER BY count DESC;

-- 4. Safe update using existing enum values
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
    END
WHERE medium IS NULL OR dimensions IS NULL;

-- 5. Verify the update worked
SELECT 
    'Updated Data' as info_type,
    category,
    medium,
    dimensions,
    COUNT(*) as count
FROM artworks 
GROUP BY category, medium, dimensions
ORDER BY category;