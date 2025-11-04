-- Check Artworks Data for Art Page
-- Run this to see if there are artworks in the database

-- 1. Check if artworks table exists
SELECT 
    'Table Check' as test_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'artworks' AND table_schema = 'public')
        THEN '✅ artworks table exists'
        ELSE '❌ artworks table missing'
    END as status;

-- 2. Count total artworks
SELECT 
    'Data Count' as test_type,
    COUNT(*) as total_artworks,
    COUNT(CASE WHEN is_available = true THEN 1 END) as available_artworks
FROM artworks;

-- 3. Check sample artwork data
SELECT 
    'Sample Data' as test_type,
    id,
    title,
    price,
    thumbnail_url,
    category,
    medium,
    is_available,
    creator_id,
    created_at
FROM artworks 
WHERE is_available = true
ORDER BY created_at DESC
LIMIT 5;

-- 4. Check user_profiles relationship
SELECT 
    'Relationship Check' as test_type,
    a.id as artwork_id,
    a.title,
    a.creator_id,
    up.full_name,
    up.username
FROM artworks a
LEFT JOIN user_profiles up ON a.creator_id = up.id
WHERE a.is_available = true
LIMIT 5;

-- 5. Check for any RLS issues
SELECT 
    'RLS Check' as test_type,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'artworks'
GROUP BY tablename;

-- 6. If no artworks exist, let's create some sample data
INSERT INTO artworks (
    id,
    title,
    description,
    price,
    thumbnail_url,
    medium,
    dimensions,
    category,
    creator_id,
    is_available,
    created_at
) VALUES 
(
    '11111111-1111-1111-1111-111111111111',
    'Heritage Tapestry',
    'A beautiful contemporary painting exploring African heritage',
    150000,
    '/image/AdunniOlorunnisola.jpg',
    'Acrylic on Canvas',
    '60cm x 80cm',
    'Painting',
    '8b396cf6-6110-45a6-a41a-d0d6fa2ee025', -- Admin user as creator
    true,
    NOW()
),
(
    '22222222-2222-2222-2222-222222222222',
    'Modern Sculpture',
    'Contemporary bronze sculpture representing strength',
    200000,
    '/image/KwameAsante.jpg',
    'Bronze',
    '40cm x 30cm x 50cm',
    'Sculpture',
    '8b396cf6-6110-45a6-a41a-d0d6fa2ee025', -- Admin user as creator
    true,
    NOW()
),
(
    '33333333-3333-3333-3333-333333333333',
    'Fashion Collection Piece',
    'Contemporary African fashion design',
    75000,
    '/image/AmaraDiallo.jpg',
    'Textile',
    'Size M',
    'Fashion',
    '8b396cf6-6110-45a6-a41a-d0d6fa2ee025', -- Admin user as creator
    true,
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 7. Final verification
SELECT 
    'Final Check' as test_type,
    COUNT(*) as total_available_artworks,
    'Art page should now show products' as message
FROM artworks 
WHERE is_available = true;