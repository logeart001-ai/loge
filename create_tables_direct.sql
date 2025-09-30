-- Direct SQL to create missing tables (run this in Supabase SQL Editor)

-- User profiles table (add missing columns if table exists)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name VARCHAR(255),
  avatar_url TEXT,
  bio TEXT,
  location VARCHAR(255),
  phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'buyer',
  discipline VARCHAR(100),
  rating DECIMAL(3,2) DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Add is_verified column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'is_verified') THEN
    ALTER TABLE user_profiles ADD COLUMN is_verified BOOLEAN DEFAULT false;
  END IF;
  
  -- Add is_featured column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'is_featured') THEN
    ALTER TABLE user_profiles ADD COLUMN is_featured BOOLEAN DEFAULT false;
  END IF;
  
  -- Add social_links column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'social_links') THEN
    ALTER TABLE user_profiles ADD COLUMN social_links JSONB DEFAULT '{}';
  END IF;
END $$;

-- Artworks table
CREATE TABLE IF NOT EXISTS artworks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to artworks if they don't exist
DO $$ 
BEGIN
  -- Add is_available column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artworks' AND column_name = 'is_available') THEN
    ALTER TABLE artworks ADD COLUMN is_available BOOLEAN DEFAULT true;
  END IF;
  
  -- Add is_featured column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artworks' AND column_name = 'is_featured') THEN
    ALTER TABLE artworks ADD COLUMN is_featured BOOLEAN DEFAULT false;
  END IF;
  
  -- Add image_urls column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artworks' AND column_name = 'image_urls') THEN
    ALTER TABLE artworks ADD COLUMN image_urls TEXT[];
  END IF;
  
  -- Add tags column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artworks' AND column_name = 'tags') THEN
    ALTER TABLE artworks ADD COLUMN tags TEXT[];
  END IF;
END $$;

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(100),
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to events if they don't exist
DO $$ 
BEGIN
  -- Add start_date column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'start_date') THEN
    ALTER TABLE events ADD COLUMN start_date TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Add is_free column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'is_free') THEN
    ALTER TABLE events ADD COLUMN is_free BOOLEAN DEFAULT true;
  END IF;
  
  -- Add ticket_price column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'ticket_price') THEN
    ALTER TABLE events ADD COLUMN ticket_price DECIMAL(10,2);
  END IF;
  
  -- Add is_featured column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'is_featured') THEN
    ALTER TABLE events ADD COLUMN is_featured BOOLEAN DEFAULT false;
  END IF;
  
  -- Add is_published column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'is_published') THEN
    ALTER TABLE events ADD COLUMN is_published BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image_url TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies (with conflict handling)
DO $$ 
BEGIN
  -- User profiles policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Public profiles are viewable by everyone') THEN
    CREATE POLICY "Public profiles are viewable by everyone" ON user_profiles FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can insert their own profile') THEN
    CREATE POLICY "Users can insert their own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can update their own profile') THEN
    CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
  END IF;

  -- Artworks policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'artworks' AND policyname = 'Available artworks are viewable by everyone') THEN
    CREATE POLICY "Available artworks are viewable by everyone" ON artworks FOR SELECT USING (COALESCE(is_available, true) = true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'artworks' AND policyname = 'Creators can manage their own artworks') THEN
    CREATE POLICY "Creators can manage their own artworks" ON artworks FOR ALL USING (auth.uid() = creator_id);
  END IF;

  -- Events policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Published events are viewable by everyone') THEN
    CREATE POLICY "Published events are viewable by everyone" ON events FOR SELECT USING (COALESCE(is_published, true) = true);
  END IF;

  -- Blog posts policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blog_posts' AND policyname = 'Published blog posts are viewable by everyone') THEN
    CREATE POLICY "Published blog posts are viewable by everyone" ON blog_posts FOR SELECT USING (COALESCE(is_published, true) = true);
  END IF;
END $$;

-- Insert sample data
INSERT INTO user_profiles (id, full_name, avatar_url, bio, location, role, discipline, rating, is_verified, is_featured) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Adunni Olorunnisola', '/image/AdunniOlorunnisola.jpg', 'Contemporary African painter', 'Lagos, Nigeria', 'creator', 'painter', 4.8, true, true),
  ('550e8400-e29b-41d4-a716-446655440002', 'Kwame Asante', '/image/KwameAsante.jpg', 'Sculptor and mixed media artist', 'Accra, Ghana', 'creator', 'sculptor', 4.6, true, true),
  ('550e8400-e29b-41d4-a716-446655440003', 'Amara Diallo', '/image/AmaraDiallo.jpg', 'Fashion designer', 'Dakar, Senegal', 'creator', 'fashion_designer', 4.7, true, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO artworks (id, creator_id, title, description, category, price, original_price, thumbnail_url, is_available, is_featured) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Ancestral Echoes', 'A powerful painting exploring heritage', 'painting', 125000, 150000, '/image/AncestralEchoes.jpg', true, true),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Urban Rhythm', 'Modern city life interpretation', 'painting', 95000, NULL, '/image/urbanRythym.jpg', true, true),
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'Resilience II', 'Bronze sculpture of strength', 'sculpture', 180000, NULL, '/image/resilence2.jpg', true, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO events (id, organizer_id, title, description, event_type, event_date, start_date, location, is_free, ticket_price, is_featured, is_published) VALUES
  ('880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Contemporary African Art Exhibition', 'Art showcase', 'exhibition', '2025-11-15 10:00:00+01', '2025-11-15 10:00:00+01', 'National Theatre, Lagos', false, 2500, true, true),
  ('880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'Sculpture Workshop', 'Learn sculpting', 'workshop', '2025-10-20 14:00:00+01', '2025-10-20 14:00:00+01', 'Art Center, Accra', false, 15000, true, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO blog_posts (id, author_id, title, slug, excerpt, content, featured_image_url, is_published, published_at, tags) VALUES
  ('990e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'The Evolution of Contemporary African Art', 'evolution-contemporary-african-art', 'Exploring how African art has evolved', 'Contemporary African art has undergone remarkable transformation...', '/image/Blog Post Featured Images.png', true, '2025-09-20 10:00:00+01', ARRAY['art', 'contemporary'])
ON CONFLICT (id) DO NOTHING;