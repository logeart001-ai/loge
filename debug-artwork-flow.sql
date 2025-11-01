-- Debug the artwork approval and display flow
-- Run this in your Supabase SQL editor to diagnose issues

-- 1. Check if there are any submissions
SELECT 
    'project_submissions' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted,
    COUNT(CASE WHEN status = 'under_review' THEN 1 END) as under_review,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
    COUNT(CASE WHEN status = 'published' THEN 1 END) as published,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
FROM project_submissions;

-- 2. Check if there are any artworks
SELECT 
    'artworks' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN is_available = true THEN 1 END) as available,
    COUNT(CASE WHEN is_featured = true THEN 1 END) as featured,
    COUNT(CASE WHEN is_available = true AND is_featured = true THEN 1 END) as available_and_featured
FROM artworks;

-- 3. Show recent submissions with their status
SELECT 
    ps.id,
    ps.title,
    ps.creator_type,
    ps.status,
    ps.submission_date,
    ps.review_date,
    up.full_name as creator_name,
    up.email as creator_email
FROM project_submissions ps
LEFT JOIN user_profiles up ON ps.creator_id = up.id
ORDER BY ps.submission_date DESC
LIMIT 10;

-- 4. Show recent artworks
SELECT 
    a.id,
    a.title,
    a.category,
    a.price,
    a.is_available,
    a.is_featured,
    a.created_at,
    up.full_name as creator_name
FROM artworks a
LEFT JOIN user_profiles up ON a.creator_id = up.id
ORDER BY a.created_at DESC
LIMIT 10;

-- 5. Check if approved submissions have corresponding artworks
SELECT 
    ps.id as submission_id,
    ps.title as submission_title,
    ps.status as submission_status,
    ps.review_date,
    a.id as artwork_id,
    a.title as artwork_title,
    a.is_available,
    a.is_featured
FROM project_submissions ps
LEFT JOIN artworks a ON (
    ps.creator_id = a.creator_id 
    AND ps.title = a.title
    AND ps.status IN ('approved', 'published')
)
WHERE ps.status IN ('approved', 'published')
ORDER BY ps.review_date DESC;

-- 6. Check for orphaned approved submissions (approved but no artwork created)
SELECT 
    ps.id,
    ps.title,
    ps.creator_type,
    ps.status,
    ps.review_date,
    up.full_name as creator_name
FROM project_submissions ps
LEFT JOIN user_profiles up ON ps.creator_id = up.id
LEFT JOIN artworks a ON (
    ps.creator_id = a.creator_id 
    AND ps.title = a.title
)
WHERE ps.status IN ('approved', 'published')
AND ps.creator_type = 'artist'
AND a.id IS NULL
ORDER BY ps.review_date DESC;

-- 7. Check RLS policies on artworks table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'artworks'
ORDER BY policyname;

-- 8. Test the exact query used by getFeaturedArtworks
SELECT 
    COUNT(*) as total_artworks,
    COUNT(CASE WHEN is_available = true THEN 1 END) as available_artworks,
    COUNT(CASE WHEN is_featured = true THEN 1 END) as featured_artworks,
    COUNT(CASE WHEN is_available = true AND is_featured = true THEN 1 END) as available_featured
FROM artworks;

-- 9. Show what the homepage query would return
SELECT 
    id,
    title,
    category,
    price,
    is_available,
    is_featured,
    thumbnail_url,
    created_at
FROM artworks
WHERE is_available = true
AND is_featured = true
ORDER BY created_at DESC
LIMIT 8;

-- 10. Show fallback query (just available artworks)
SELECT 
    id,
    title,
    category,
    price,
    is_available,
    is_featured,
    thumbnail_url,
    created_at
FROM artworks
WHERE is_available = true
ORDER BY created_at DESC
LIMIT 8;