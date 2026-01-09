-- Create artwork_views table for tracking views
CREATE TABLE IF NOT EXISTS artwork_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewer_ip TEXT,
  user_agent TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id TEXT
);

-- Add session_id column if it doesn't exist (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'artwork_views' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE artwork_views ADD COLUMN session_id TEXT;
  END IF;
END $$;

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_view_per_session'
  ) THEN
    ALTER TABLE artwork_views 
    ADD CONSTRAINT unique_view_per_session UNIQUE (artwork_id, session_id, viewed_at);
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_artwork_views_artwork_id ON artwork_views(artwork_id);
CREATE INDEX IF NOT EXISTS idx_artwork_views_viewer_id ON artwork_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_artwork_views_viewed_at ON artwork_views(viewed_at);

-- Enable RLS
ALTER TABLE artwork_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can insert views (for tracking)
CREATE POLICY "Anyone can insert views"
  ON artwork_views
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Users can view their own views
CREATE POLICY "Users can view their own views"
  ON artwork_views
  FOR SELECT
  TO authenticated
  USING (viewer_id = auth.uid());

-- Creators can view their artwork views
CREATE POLICY "Creators can view their artwork views"
  ON artwork_views
  FOR SELECT
  TO authenticated
  USING (
    artwork_id IN (
      SELECT id FROM artworks WHERE creator_id = auth.uid()
    )
  );

-- Admins can view all views
CREATE POLICY "Admins can view all views"
  ON artwork_views
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create a view for artwork view counts
CREATE OR REPLACE VIEW artwork_view_counts AS
SELECT 
  artwork_id,
  COUNT(DISTINCT session_id) as total_views,
  COUNT(DISTINCT viewer_id) as unique_users,
  COUNT(DISTINCT DATE(viewed_at)) as days_with_views,
  MAX(viewed_at) as last_viewed_at
FROM artwork_views
GROUP BY artwork_id;

-- Grant access to the view
GRANT SELECT ON artwork_view_counts TO authenticated, anon;

COMMENT ON TABLE artwork_views IS 'Tracks views of artworks for analytics';
COMMENT ON VIEW artwork_view_counts IS 'Aggregated view counts per artwork';
