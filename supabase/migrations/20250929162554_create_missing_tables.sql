-- Create missing tables for Loge Arts platform (safe version)

-- User profiles table (extends auth.users)
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
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  social_links JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Artworks table
CREATE TABLE IF NOT EXISTS artworks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'NGN',
  dimensions JSONB,
  weight DECIMAL(8,2),
  materials TEXT[],
  techniques TEXT[],
  year_created INTEGER,
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_original BOOLEAN DEFAULT true,
  edition_size INTEGER,
  edition_number INTEGER,
  thumbnail_url TEXT,
  image_urls TEXT[],
  tags TEXT[],
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(100),
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  venue_name VARCHAR(255),
  address TEXT,
  capacity INTEGER,
  is_free BOOLEAN DEFAULT true,
  ticket_price DECIMAL(10,2),
  registration_url TEXT,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Carts table
CREATE TABLE IF NOT EXISTS carts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
  artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (safe creation)
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
    CREATE POLICY "Available artworks are viewable by everyone" ON artworks FOR SELECT USING (is_available = true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'artworks' AND policyname = 'Creators can manage their own artworks') THEN
    CREATE POLICY "Creators can manage their own artworks" ON artworks FOR ALL USING (auth.uid() = creator_id);
  END IF;

  -- Events policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Published events are viewable by everyone') THEN
    CREATE POLICY "Published events are viewable by everyone" ON events FOR SELECT USING (is_published = true);
  END IF;

  -- Blog posts policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blog_posts' AND policyname = 'Published blog posts are viewable by everyone') THEN
    CREATE POLICY "Published blog posts are viewable by everyone" ON blog_posts FOR SELECT USING (is_published = true);
  END IF;

  -- Carts policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'carts' AND policyname = 'Users can manage their own carts') THEN
    CREATE POLICY "Users can manage their own carts" ON carts FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- Cart items policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cart_items' AND policyname = 'Users can manage their own cart items') THEN
    CREATE POLICY "Users can manage their own cart items" ON cart_items FOR ALL USING (
      EXISTS (SELECT 1 FROM carts WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid())
    );
  END IF;
END $$;

-- Insert sample data
INSERT INTO user_profiles (id, full_name, avatar_url, bio, location, role, discipline, rating, is_verified, is_featured) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Adunni Olorunnisola', '/image/AdunniOlorunnisola.jpg', 'Contemporary African painter exploring themes of identity and heritage', 'Lagos, Nigeria', 'creator', 'painter', 4.8, true, true),
  ('550e8400-e29b-41d4-a716-446655440002', 'Kwame Asante', '/image/KwameAsante.jpg', 'Sculptor and mixed media artist from Ghana', 'Accra, Ghana', 'creator', 'sculptor', 4.6, true, true),
  ('550e8400-e29b-41d4-a716-446655440003', 'Amara Diallo', '/image/AmaraDiallo.jpg', 'Fashion designer specializing in contemporary African wear', 'Dakar, Senegal', 'creator', 'fashion_designer', 4.7, true, true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample artworks
INSERT INTO artworks (id, creator_id, title, description, category, price, original_price, thumbnail_url, image_urls, is_available, is_featured, tags) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Ancestral Echoes', 'A powerful painting exploring the connection between past and present through vibrant colors and traditional motifs', 'painting', 125000, 150000, '/image/AncestralEchoes.jpg', ARRAY['/image/AncestralEchoes.jpg'], true, true, ARRAY['traditional', 'contemporary', 'heritage']),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Urban Rhythm', 'Modern interpretation of city life in Lagos with bold strokes and urban colors', 'painting', 95000, NULL, '/image/urbanRythym.jpg', ARRAY['/image/urbanRythym.jpg'], true, true, ARRAY['urban', 'modern', 'city']),
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'Resilience II', 'Bronze sculpture representing the strength and resilience of the African spirit', 'sculpture', 180000, NULL, '/image/resilence2.jpg', ARRAY['/image/resilence2.jpg'], true, true, ARRAY['bronze', 'strength', 'african'])
ON CONFLICT (id) DO NOTHING;

-- Insert sample events
INSERT INTO events (id, organizer_id, title, description, event_type, event_date, start_date, location, is_free, ticket_price, is_featured, is_published) VALUES
  ('880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Contemporary African Art Exhibition', 'Showcasing the best of contemporary African art from emerging and established artists', 'exhibition', '2025-11-15 10:00:00+01', '2025-11-15 10:00:00+01', 'National Theatre, Lagos', false, 2500, true, true),
  ('880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'Sculpture Workshop', 'Learn traditional and modern sculpting techniques', 'workshop', '2025-10-20 14:00:00+01', '2025-10-20 14:00:00+01', 'Art Center, Accra', false, 15000, true, true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample blog posts
INSERT INTO blog_posts (id, author_id, title, slug, excerpt, content, featured_image_url, is_published, published_at, tags) VALUES
  ('990e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'The Evolution of Contemporary African Art', 'evolution-contemporary-african-art', 'Exploring how African art has evolved in the 21st century', 'Contemporary African art has undergone a remarkable transformation in recent decades...', '/image/Blog Post Featured Images.png', true, '2025-09-20 10:00:00+01', ARRAY['art', 'contemporary', 'african', 'evolution'])
ON CONFLICT (id) DO NOTHING;