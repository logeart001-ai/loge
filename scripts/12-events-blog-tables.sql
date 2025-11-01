-- Migration: Add Events and Blog Posts tables
-- Run this in Supabase SQL Editor if these tables don't exist

-- Check and create event_type enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE event_type AS ENUM ('exhibition', 'workshop', 'gallery_opening', 'art_fair', 'networking');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organizer_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type event_type NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
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

-- Insert some sample data (optional)
INSERT INTO events (organizer_id, title, description, event_type, event_date, start_date, city, country, is_free, is_published)
SELECT 
  id,
  'Nigerian Art Exhibition 2025',
  'A showcase of contemporary Nigerian art featuring works from emerging and established artists.',
  'exhibition',
  NOW() + interval '30 days',
  NOW() + interval '30 days',
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
