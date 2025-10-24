-- Debug script to check blog posts and user profiles
-- Run this in your Supabase SQL editor to diagnose the issue

-- 1. Check if blog_posts table has all required columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'blog_posts'
ORDER BY column_name;

-- 2. Check a specific blog post with all details
SELECT 
    id,
    title,
    slug,
    content,
    excerpt,
    featured_image_url,
    published_at,
    tags,
    author_id,
    is_published
FROM blog_posts 
WHERE slug = 'renaissance-contemporary-african-art';

-- 3. Check if the author exists in user_profiles
SELECT 
    up.id,
    up.full_name,
    up.avatar_url,
    up.bio
FROM user_profiles up
WHERE up.id = '78092c25-ba22-432c-a8a5-f0800f6dcbe3';

-- 4. Test the exact query that the app is using
SELECT 
    bp.id,
    bp.title,
    bp.slug,
    bp.content,
    bp.excerpt,
    bp.featured_image_url,
    bp.published_at,
    bp.tags,
    json_build_object(
        'full_name', up.full_name,
        'avatar_url', up.avatar_url,
        'bio', up.bio
    ) as author
FROM blog_posts bp
LEFT JOIN user_profiles up ON bp.author_id = up.id
WHERE bp.slug = 'renaissance-contemporary-african-art' 
AND bp.is_published = true;