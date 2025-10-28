-- Create content_reports table for content moderation
-- This table tracks user reports for inappropriate content

CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');
CREATE TYPE content_type AS ENUM ('artwork', 'comment', 'review', 'message');
CREATE TYPE report_reason AS ENUM (
  'spam', 
  'inappropriate', 
  'harassment', 
  'copyright', 
  'violence', 
  'hate_speech', 
  'misinformation',
  'other'
);

CREATE TABLE content_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- What is being reported
  content_type content_type NOT NULL,
  content_id UUID NOT NULL, -- ID of the artwork, comment, review, etc.
  
  -- Who reported it
  reporter_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Report details
  reason report_reason NOT NULL,
  description TEXT,
  
  -- Moderation details
  status report_status DEFAULT 'pending',
  moderator_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  moderation_action TEXT, -- 'approve', 'remove', 'warn', 'suspend_user'
  moderation_reason TEXT,
  moderation_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_content_reports_status ON content_reports(status);
CREATE INDEX idx_content_reports_content ON content_reports(content_type, content_id);
CREATE INDEX idx_content_reports_reporter ON content_reports(reporter_id);
CREATE INDEX idx_content_reports_created_at ON content_reports(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_content_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_reports_updated_at
  BEFORE UPDATE ON content_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_content_reports_updated_at();

-- Enable Row Level Security
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can see all reports
CREATE POLICY "Admins can view all reports"
  ON content_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Users can create reports
CREATE POLICY "Users can create reports"
  ON content_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    reporter_id = auth.uid()
  );

-- Users can view their own reports
CREATE POLICY "Users can view their own reports"
  ON content_reports
  FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid());

-- Admins can update reports (for moderation)
CREATE POLICY "Admins can update reports"
  ON content_reports
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Add is_removed and removal_reason columns to comments if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comments' 
    AND column_name = 'is_removed'
  ) THEN
    ALTER TABLE comments ADD COLUMN is_removed BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comments' 
    AND column_name = 'removal_reason'
  ) THEN
    ALTER TABLE comments ADD COLUMN removal_reason TEXT;
  END IF;
END $$;

-- Add is_removed and removal_reason columns to reviews if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reviews' 
    AND column_name = 'is_removed'
  ) THEN
    ALTER TABLE reviews ADD COLUMN is_removed BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reviews' 
    AND column_name = 'removal_reason'
  ) THEN
    ALTER TABLE reviews ADD COLUMN removal_reason TEXT;
  END IF;
END $$;

-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content TEXT NOT NULL,
  sender_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  is_removed BOOLEAN DEFAULT FALSE,
  removal_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add is_removed and removal_reason columns to artworks if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'artworks' 
    AND column_name = 'is_removed'
  ) THEN
    ALTER TABLE artworks ADD COLUMN is_removed BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'artworks' 
    AND column_name = 'removal_reason'
  ) THEN
    ALTER TABLE artworks ADD COLUMN removal_reason TEXT;
  END IF;
END $$;

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_commentable ON comments(commentable_type, commentable_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_artwork ON reviews(artwork_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);

-- Add updated_at trigger to notifications if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'notifications_updated_at'
  ) THEN
    CREATE TRIGGER notifications_updated_at
      BEFORE UPDATE ON notifications
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Notifications table already exists, just ensure it has the necessary indexes

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);
