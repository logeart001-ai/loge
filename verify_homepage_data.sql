-- Verify all data needed for homepage is ready
SELECT 'Featured Creators Count:' as check_type, count(*) as count 
FROM user_profiles WHERE is_featured = true AND role = 'creator'
UNION ALL
SELECT 'Featured Artworks Count:' as check_type, count(*) as count 
FROM artworks WHERE is_featured = true AND is_available = true
UNION ALL
SELECT 'Published Events Count:' as check_type, count(*) as count 
FROM events WHERE is_published = true
UNION ALL
SELECT 'Published Blog Posts Count:' as check_type, count(*) as count 
FROM blog_posts WHERE is_published = true;