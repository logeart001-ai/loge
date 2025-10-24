-- Test script to check blog post slugs and links
-- Run this in your Supabase SQL editor

-- 1. Check all blog post slugs that should be accessible
SELECT 
    id,
    title,
    slug,
    is_published,
    published_at,
    CASE 
        WHEN tags IS NULL THEN 'No tags'
        ELSE array_length(tags, 1)::text || ' tags'
    END as tag_info
FROM blog_posts 
WHERE is_published = true
ORDER BY published_at DESC;

-- 2. Test the exact query used by the homepage getBlogPosts function
SELECT 
    bp.*,
    json_build_object(
        'full_name', up.full_name,
        'avatar_url', up.avatar_url
    ) as author
FROM blog_posts bp
LEFT JOIN user_profiles up ON bp.author_id = up.id
WHERE bp.is_published = true
ORDER BY bp.published_at DESC
LIMIT 3;

-- 3. Check if there are any special characters in slugs that might cause issues
SELECT 
    slug,
    length(slug) as slug_length,
    ascii(substring(slug, 1, 1)) as first_char_ascii,
    ascii(substring(slug, length(slug), 1)) as last_char_ascii
FROM blog_posts 
WHERE is_published = true;