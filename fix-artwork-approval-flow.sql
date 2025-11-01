-- Fix artwork approval flow database issues
-- Run this in your Supabase SQL editor

-- 1. Add missing columns to project_submissions table
DO $$ 
BEGIN
    -- Add marketplace_item_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_submissions' 
        AND column_name = 'marketplace_item_id'
    ) THEN
        ALTER TABLE project_submissions ADD COLUMN marketplace_item_id UUID;
    END IF;
    
    -- Add published_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_submissions' 
        AND column_name = 'published_date'
    ) THEN
        ALTER TABLE project_submissions ADD COLUMN published_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add error_message column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_submissions' 
        AND column_name = 'error_message'
    ) THEN
        ALTER TABLE project_submissions ADD COLUMN error_message TEXT;
    END IF;
END $$;

-- 2. Add submission_id reference to artworks table
DO $$ 
BEGIN
    -- Add submission_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'artworks' 
        AND column_name = 'submission_id'
    ) THEN
        ALTER TABLE artworks ADD COLUMN submission_id UUID REFERENCES project_submissions(id);
    END IF;
END $$;

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_submissions_marketplace_item_id ON project_submissions(marketplace_item_id);
CREATE INDEX IF NOT EXISTS idx_project_submissions_published_date ON project_submissions(published_date);
CREATE INDEX IF NOT EXISTS idx_artworks_submission_id ON artworks(submission_id);

-- 4. Update existing artworks to be featured if they're available
UPDATE artworks 
SET is_featured = true 
WHERE is_available = true 
AND is_featured = false;

-- 5. Check current state of submissions and artworks
SELECT 
    'Current State Summary' as info,
    (SELECT COUNT(*) FROM project_submissions) as total_submissions,
    (SELECT COUNT(*) FROM project_submissions WHERE status = 'submitted') as pending_submissions,
    (SELECT COUNT(*) FROM project_submissions WHERE status IN ('approved', 'published')) as approved_submissions,
    (SELECT COUNT(*) FROM artworks) as total_artworks,
    (SELECT COUNT(*) FROM artworks WHERE is_available = true) as available_artworks,
    (SELECT COUNT(*) FROM artworks WHERE is_featured = true) as featured_artworks;

-- 6. Show orphaned approved submissions (approved but no artwork)
SELECT 
    ps.id as submission_id,
    ps.title,
    ps.creator_type,
    ps.status,
    ps.review_date,
    CASE 
        WHEN a.id IS NOT NULL THEN 'Has Artwork'
        ELSE 'Missing Artwork'
    END as artwork_status
FROM project_submissions ps
LEFT JOIN artworks a ON ps.marketplace_item_id = a.id
WHERE ps.status IN ('approved', 'published')
ORDER BY ps.review_date DESC;

-- 7. Show recent artworks that should appear on homepage
SELECT 
    a.id,
    a.title,
    a.category,
    a.price,
    a.is_available,
    a.is_featured,
    a.created_at,
    up.full_name as creator_name,
    ps.status as submission_status
FROM artworks a
LEFT JOIN user_profiles up ON a.creator_id = up.id
LEFT JOIN project_submissions ps ON a.submission_id = ps.id
WHERE a.is_available = true
ORDER BY a.created_at DESC
LIMIT 10;