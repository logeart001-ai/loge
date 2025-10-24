-- Test the exact query that the homepage uses for blog posts
-- This matches the getBlogPosts function in supabase-queries.ts

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

-- Also check what URLs would be generated
SELECT 
    title,
    slug,
    '/blog/' || slug as generated_url,
    published_at
FROM blog_posts 
WHERE is_published = true
ORDER BY published_at DESC
LIMIT 3;