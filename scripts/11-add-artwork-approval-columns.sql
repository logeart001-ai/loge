-- Add approval tracking columns to artworks table if they don't exist

-- Add approval_status column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'artworks' AND column_name = 'approval_status') THEN
        ALTER TABLE artworks ADD COLUMN approval_status VARCHAR(20) DEFAULT 'pending' 
        CHECK (approval_status IN ('pending', 'approved', 'rejected'));
    END IF;
END $$;

-- Add approved_at column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'artworks' AND column_name = 'approved_at') THEN
        ALTER TABLE artworks ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add review_notes column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'artworks' AND column_name = 'review_notes') THEN
        ALTER TABLE artworks ADD COLUMN review_notes TEXT;
    END IF;
END $$;

-- Update existing artworks without approval_status to set them as approved
-- (assuming they were already in the database)
UPDATE artworks 
SET approval_status = 'approved', is_available = true
WHERE approval_status IS NULL OR approval_status = '';

-- Create index for faster filtering by approval status
CREATE INDEX IF NOT EXISTS idx_artworks_approval_status ON artworks(approval_status);
CREATE INDEX IF NOT EXISTS idx_artworks_approved_at ON artworks(approved_at);

-- Comment on columns
COMMENT ON COLUMN artworks.approval_status IS 'Status of admin review: pending, approved, or rejected';
COMMENT ON COLUMN artworks.approved_at IS 'Timestamp when the artwork was approved by admin';
COMMENT ON COLUMN artworks.review_notes IS 'Admin notes about the review decision';

-- Show results
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'artworks' 
  AND column_name IN ('approval_status', 'approved_at', 'review_notes', 'is_available', 'is_featured')
ORDER BY column_name;
