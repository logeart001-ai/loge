-- Minimal version: Create content_reports table only
-- This script creates only the essential content_reports table without dependencies

-- Drop existing enum types if they exist (to avoid conflicts)
DROP TYPE IF EXISTS report_status CASCADE;
DROP TYPE IF EXISTS content_type CASCADE;
DROP TYPE IF EXISTS report_reason CASCADE;

-- Create enum types
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

-- Create content_reports table
CREATE TABLE content_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- What is being reported
  content_type content_type NOT NULL,
  content_id UUID NOT NULL,
  
  -- Who reported it
  reporter_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Report details
  reason report_reason NOT NULL,
  description TEXT,
  
  -- Moderation details
  status report_status DEFAULT 'pending',
  moderator_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  moderation_action TEXT,
  moderation_reason TEXT,
  moderation_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for content_reports
CREATE INDEX idx_content_reports_status ON content_reports(status);
CREATE INDEX idx_content_reports_content ON content_reports(content_type, content_id);
CREATE INDEX idx_content_reports_reporter ON content_reports(reporter_id);
CREATE INDEX idx_content_reports_created_at ON content_reports(created_at DESC);

-- Create updated_at trigger for content_reports
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

-- RLS Policies for content_reports
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

CREATE POLICY "Users can create reports"
  ON content_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    reporter_id = auth.uid()
  );

CREATE POLICY "Users can view their own reports"
  ON content_reports
  FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid());

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

-- Add is_removed and removal_reason columns to artworks table if they exist
DO $$ 
BEGIN
  -- Check if artworks table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'artworks') THEN
    -- Add is_removed column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'artworks' 
      AND column_name = 'is_removed'
    ) THEN
      ALTER TABLE artworks ADD COLUMN is_removed BOOLEAN DEFAULT FALSE;
      RAISE NOTICE 'Added is_removed column to artworks table';
    END IF;

    -- Add removal_reason column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'artworks' 
      AND column_name = 'removal_reason'
    ) THEN
      ALTER TABLE artworks ADD COLUMN removal_reason TEXT;
      RAISE NOTICE 'Added removal_reason column to artworks table';
    END IF;
  END IF;
END $$;

-- Add is_removed and removal_reason columns to reviews table if it exists
DO $$ 
BEGIN
  -- Check if reviews table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
    -- Add is_removed column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'reviews' 
      AND column_name = 'is_removed'
    ) THEN
      ALTER TABLE reviews ADD COLUMN is_removed BOOLEAN DEFAULT FALSE;
      RAISE NOTICE 'Added is_removed column to reviews table';
    END IF;

    -- Add removal_reason column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'reviews' 
      AND column_name = 'removal_reason'
    ) THEN
      ALTER TABLE reviews ADD COLUMN removal_reason TEXT;
      RAISE NOTICE 'Added removal_reason column to reviews table';
    END IF;
  END IF;
END $$;

-- Create comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content TEXT NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  commentable_type TEXT NOT NULL,
  commentable_id UUID NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  is_removed BOOLEAN DEFAULT FALSE,
  removal_reason TEXT,
  is_approved BOOLEAN DEFAULT TRUE,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for comments
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_commentable ON comments(commentable_type, commentable_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content TEXT NOT NULL,
  sender_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  is_removed BOOLEAN DEFAULT FALSE,
  removal_reason TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Add indexes to notifications table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
    RAISE NOTICE 'Added indexes to notifications table';
  END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Content reports table created successfully!';
  RAISE NOTICE '✅ Moderation columns added to existing tables';
  RAISE NOTICE '✅ Comments and messages tables created if needed';
  RAISE NOTICE '✅ Row Level Security policies configured';
  RAISE NOTICE '✅ All indexes created';
END $$;
