-- Migration: Add Events and Blog Posts tables
-- IMPORTANT: Run this in TWO STEPS if the enum already exists with different values!
-- 
-- If you get error "unsafe use of new value", do this:
-- 1. First, run ONLY the enum section (lines 8-52) and click "Run"
-- 2. Wait a moment (to commit the transaction)
-- 3. Then run the rest of the script (from line 54 onwards)

-- ============================================================================
-- STEP 1: Handle enum type (RUN THIS FIRST if enum needs updating)
-- ============================================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_type') THEN
        CREATE TYPE event_type AS ENUM ('exhibition', 'workshop', 'gallery_opening', 'art_fair', 'networking');
    END IF;
END $$;

-- Add missing enum values if they don't exist
-- If this fails with "unsafe use" error, run this section alone first, then run the rest
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'exhibition' AND enumtypid = 'event_type'::regtype) THEN
        ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'exhibition';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'workshop' AND enumtypid = 'event_type'::regtype) THEN
        ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'workshop';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'gallery_opening' AND enumtypid = 'event_type'::regtype) THEN
        ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'gallery_opening';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'art_fair' AND enumtypid = 'event_type'::regtype) THEN
        ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'art_fair';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'networking' AND enumtypid = 'event_type'::regtype) THEN
        ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'networking';
    END IF;
END $$;

-- ============================================================================
-- STEP 2: Create tables, indexes, and policies (RUN THIS SECOND)
-- ============================================================================

-- STEP 2: Create tables and indexes
-- (Separated from enum modifications to ensure enum values are committed first)

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organizer_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type event_type NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  city TEXT,
  country TEXT,
  is_free BOOLEAN DEFAULT TRUE,
  ticket_price DECIMAL(10,2),
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If table already exists but has start_date instead of event_date, add event_date column
DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'events' 
    AND column_name = 'start_date'
    AND NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'events' 
      AND column_name = 'event_date'
    )
  ) THEN
    ALTER TABLE events ADD COLUMN event_date TIMESTAMP WITH TIME ZONE;
    -- Copy start_date to event_date for existing records
    UPDATE events SET event_date = start_date WHERE event_date IS NULL;
    -- Make event_date NOT NULL
    ALTER TABLE events ALTER COLUMN event_date SET NOT NULL;
  END IF;
END $$;

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  author_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image_url TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  slug TEXT UNIQUE NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_is_published ON events(is_published);
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events(organizer_id);

CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_is_published ON blog_posts(is_published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events
CREATE POLICY "Events are viewable by everyone" ON events
  FOR SELECT USING (is_published = true OR auth.uid() = organizer_id);

CREATE POLICY "Organizers can insert their own events" ON events
  FOR INSERT WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update their own events" ON events
  FOR UPDATE USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can delete their own events" ON events
  FOR DELETE USING (auth.uid() = organizer_id);

-- RLS Policies for blog_posts
CREATE POLICY "Published blog posts are viewable by everyone" ON blog_posts
  FOR SELECT USING (is_published = true OR auth.uid() = author_id);

CREATE POLICY "Authors can insert their own blog posts" ON blog_posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own blog posts" ON blog_posts
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their own blog posts" ON blog_posts
  FOR DELETE USING (auth.uid() = author_id);

-- Insert some sample data (optional - skip if enum values are new)
-- Note: If you just added enum values, you MUST run the script in two parts (see instructions at top)
-- Otherwise, comment out these INSERT statements and add data manually later
INSERT INTO events (organizer_id, title, description, event_type, event_date, start_date, end_date, city, country, is_free, is_published)
SELECT 
  id,
  'Nigerian Art Exhibition 2025',
  'A showcase of contemporary Nigerian art featuring works from emerging and established artists.',
  'exhibition'::event_type,
  NOW() + interval '30 days',
  NOW() + interval '30 days',
  NOW() + interval '33 days',
  'Lagos',
  'Nigeria',
  false,
  true
FROM user_profiles 
WHERE role = 'creator'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO blog_posts (author_id, title, content, excerpt, slug, is_published, published_at)
SELECT 
  id,
  'The Evolution of Nigerian Contemporary Art',
  'Nigerian art has evolved significantly over the past decades, blending traditional techniques with modern innovations. This article explores the journey of Nigerian artists and their impact on the global art scene.',
  'Exploring the rich history and modern developments in Nigerian contemporary art.',
  'evolution-nigerian-contemporary-art',
  true,
  NOW()
FROM user_profiles 
WHERE role = 'creator'
LIMIT 1
ON CONFLICT (slug) DO NOTHING;

-- Verify tables were created
SELECT 
  'events' as table_name,
  COUNT(*) as row_count
FROM events
UNION ALL
SELECT 
  'blog_posts' as table_name,
  COUNT(*) as row_count
FROM blog_posts;
