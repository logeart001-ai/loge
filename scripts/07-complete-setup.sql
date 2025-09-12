-- Complete database setup in one script
-- Copy and paste this entire script into Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS blog_posts CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS artworks CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Drop existing types if they exist
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS creator_status CASCADE;
DROP TYPE IF EXISTS artwork_category CASCADE;
DROP TYPE IF EXISTS event_type CASCADE;

-- Create enum types
CREATE TYPE user_role AS ENUM ('buyer', 'creator', 'admin');
CREATE TYPE creator_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
CREATE TYPE artwork_category AS ENUM ('art_design', 'painting', 'sculpture', 'book', 'fashion');
CREATE TYPE event_type AS ENUM ('virtual', 'physical', 'hybrid');

-- User profiles table (without foreign key constraint for development)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'buyer',
  creator_status creator_status DEFAULT NULL,
  bio TEXT,
  location TEXT,
  country TEXT,
  phone TEXT,
  discipline TEXT,
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  rating DECIMAL(3,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Artworks table
CREATE TABLE artworks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category artwork_category NOT NULL,
  price DECIMAL(10,2),
  original_price DECIMAL(10,2),
  image_urls TEXT[] DEFAULT '{}',
  thumbnail_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organizer_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type event_type NOT NULL,
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

-- Blog posts table
CREATE TABLE blog_posts (
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
CREATE INDEX idx_artworks_creator_id ON artworks(creator_id);
CREATE INDEX idx_artworks_is_available ON artworks(is_available);
CREATE INDEX idx_artworks_is_featured ON artworks(is_featured);
CREATE INDEX idx_events_is_published ON events(is_published);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_is_featured ON user_profiles(is_featured);

-- Insert sample data
-- Sample creators
INSERT INTO user_profiles (id, email, full_name, role, creator_status, bio, location, discipline, is_featured, rating) VALUES
('11111111-1111-1111-1111-111111111111', 'adunni@example.com', 'Adunni Olorunnisola', 'creator', 'approved', 'Contemporary African artist specializing in mixed media and traditional motifs', 'Lagos, Nigeria', 'Visual Arts', true, 4.8),
('22222222-2222-2222-2222-222222222222', 'kwame@example.com', 'Kwame Asante', 'creator', 'approved', 'Sculptor working with recycled materials to create powerful social commentary', 'Accra, Ghana', 'Sculpture', true, 4.9),
('33333333-3333-3333-3333-333333333333', 'amara@example.com', 'Amara Diallo', 'creator', 'approved', 'Fashion designer blending traditional West African textiles with modern silhouettes', 'Dakar, Senegal', 'Fashion Design', true, 4.7);

-- Sample artworks
INSERT INTO artworks (creator_id, title, description, category, price, original_price, thumbnail_url, is_featured, is_available, tags) VALUES
('11111111-1111-1111-1111-111111111111', 'Ancestral Echoes', 'A vibrant mixed media piece exploring the connection between past and present through traditional Yoruba symbols', 'art_design', 150000, 200000, '/image/AncestralEchoes.jpg', true, true, ARRAY['traditional', 'mixed-media', 'yoruba', 'contemporary']),
('11111111-1111-1111-1111-111111111111', 'Urban Rhythms', 'Digital art piece capturing the energy of Lagos street life with bold colors and geometric patterns', 'art_design', 75000, null, '/image/urbanRythym.jpg', true, true, ARRAY['digital', 'urban', 'geometric', 'lagos']),
('22222222-2222-2222-2222-222222222222', 'Resilience', 'Bronze sculpture made from recycled materials, representing the strength of the African spirit', 'sculpture', 500000, null, '/image/resilence2.jpg', true, true, ARRAY['bronze', 'recycled', 'sculpture', 'strength']),
('22222222-2222-2222-2222-222222222222', 'Mother Earth', 'Clay sculpture celebrating the nurturing power of nature and femininity', 'sculpture', 250000, 300000, '/image/Creator Avatars female.png', false, true, ARRAY['clay', 'nature', 'feminine', 'earth']),
('33333333-3333-3333-3333-333333333333', 'Kente Dreams Dress', 'Modern midi dress featuring authentic Kente cloth patterns with contemporary tailoring', 'fashion', 85000, null, '/image/kente.jpg', true, true, ARRAY['kente', 'dress', 'traditional', 'modern']),
('33333333-3333-3333-3333-333333333333', 'Ankara Blazer', 'Professional blazer in bold Ankara print, perfect for the modern African woman', 'fashion', 65000, 80000, '/image/ankarablazers.jpg', true, true, ARRAY['ankara', 'blazer', 'professional', 'bold']);

-- Sample events
INSERT INTO events (organizer_id, title, description, event_type, start_date, city, country, is_free, is_published, is_featured) VALUES
('11111111-1111-1111-1111-111111111111', 'Contemporary African Art Exhibition', 'A showcase of emerging and established African artists exploring themes of identity, culture, and modernity', 'physical', NOW() + INTERVAL '30 days', 'Lagos', 'Nigeria', true, true, true),
('22222222-2222-2222-2222-222222222222', 'Sustainable Art Workshop', 'Learn to create beautiful sculptures using recycled materials in this hands-on workshop', 'physical', NOW() + INTERVAL '15 days', 'Accra', 'Ghana', false, true, true),
('33333333-3333-3333-3333-333333333333', 'African Fashion Week Virtual Show', 'Experience the latest in African fashion from the comfort of your home', 'virtual', NOW() + INTERVAL '45 days', null, null, true, true, true);

-- Sample blog posts
INSERT INTO blog_posts (author_id, title, content, excerpt, is_published, published_at, slug, tags) VALUES
('11111111-1111-1111-1111-111111111111', 'The Evolution of African Contemporary Art', 'African contemporary art has undergone a remarkable transformation over the past decades. From the colonial period through independence and into the modern era, African artists have continuously redefined what it means to create art that speaks to both local and global audiences.', 'Exploring how African artists are redefining contemporary art on the global stage', true, NOW() - INTERVAL '5 days', 'evolution-african-contemporary-art', ARRAY['art', 'contemporary', 'african', 'culture']),
('22222222-2222-2222-2222-222222222222', 'Art from Waste: Creating Beauty from Discarded Materials', 'In a world grappling with environmental challenges, artists are finding innovative ways to transform waste into meaningful art. This movement goes beyond mere recycling; it represents a philosophical shift towards sustainability and conscious creation.', 'How recycled art is making a statement about sustainability and creativity', true, NOW() - INTERVAL '10 days', 'art-from-waste-sustainability', ARRAY['sustainability', 'recycled', 'environment', 'sculpture']),
('33333333-3333-3333-3333-333333333333', 'Traditional Textiles in Modern Fashion', 'The rich heritage of African textiles continues to inspire contemporary fashion designers around the world. From the intricate patterns of Kente cloth to the bold prints of Ankara fabric, these traditional materials carry stories, meanings, and cultural significance.', 'Bridging the gap between traditional craftsmanship and modern fashion trends', true, NOW() - INTERVAL '3 days', 'traditional-textiles-modern-fashion', ARRAY['fashion', 'textiles', 'traditional', 'modern']);