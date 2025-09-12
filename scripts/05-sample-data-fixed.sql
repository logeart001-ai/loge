-- Fixed sample data that doesn't require auth users
-- Run this AFTER creating the essential tables

-- First, let's modify the user_profiles table to make the auth constraint optional for sample data
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

-- Add the constraint back but make it deferrable so we can work around it
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE 
DEFERRABLE INITIALLY DEFERRED;

-- Create some sample user IDs that we'll use
DO $$
DECLARE
    creator1_id UUID := '11111111-1111-1111-1111-111111111111';
    creator2_id UUID := '22222222-2222-2222-2222-222222222222';
    creator3_id UUID := '33333333-3333-3333-3333-333333333333';
BEGIN
    -- Insert sample user profiles (creators) with fixed UUIDs
    INSERT INTO user_profiles (id, email, full_name, role, creator_status, bio, location, discipline, is_featured, rating) VALUES
    (creator1_id, 'adunni@example.com', 'Adunni Olorunnisola', 'creator', 'approved', 'Contemporary African artist specializing in mixed media and traditional motifs', 'Lagos, Nigeria', 'Visual Arts', true, 4.8),
    (creator2_id, 'kwame@example.com', 'Kwame Asante', 'creator', 'approved', 'Sculptor working with recycled materials to create powerful social commentary', 'Accra, Ghana', 'Sculpture', true, 4.9),
    (creator3_id, 'amara@example.com', 'Amara Diallo', 'creator', 'approved', 'Fashion designer blending traditional West African textiles with modern silhouettes', 'Dakar, Senegal', 'Fashion Design', true, 4.7)
    ON CONFLICT (email) DO NOTHING;

    -- Insert sample artworks
    INSERT INTO artworks (creator_id, title, description, category, price, original_price, thumbnail_url, is_featured, is_available, tags) VALUES
    (creator1_id, 'Ancestral Echoes', 'A vibrant mixed media piece exploring the connection between past and present through traditional Yoruba symbols', 'art_design', 150000, 200000, '/image/AncestralEchoes.jpg', true, true, ARRAY['traditional', 'mixed-media', 'yoruba', 'contemporary']),
    (creator1_id, 'Urban Rhythms', 'Digital art piece capturing the energy of Lagos street life with bold colors and geometric patterns', 'art_design', 75000, null, '/image/urbanRythym.jpg', true, true, ARRAY['digital', 'urban', 'geometric', 'lagos']),
    (creator2_id, 'Resilience', 'Bronze sculpture made from recycled materials, representing the strength of the African spirit', 'sculpture', 500000, null, '/image/resilence2.jpg', true, true, ARRAY['bronze', 'recycled', 'sculpture', 'strength']),
    (creator2_id, 'Mother Earth', 'Clay sculpture celebrating the nurturing power of nature and femininity', 'sculpture', 250000, 300000, '/image/Creator Avatars female.png', false, true, ARRAY['clay', 'nature', 'feminine', 'earth']),
    (creator3_id, 'Kente Dreams Dress', 'Modern midi dress featuring authentic Kente cloth patterns with contemporary tailoring', 'fashion', 85000, null, '/image/kente.jpg', true, true, ARRAY['kente', 'dress', 'traditional', 'modern']),
    (creator3_id, 'Ankara Blazer', 'Professional blazer in bold Ankara print, perfect for the modern African woman', 'fashion', 65000, 80000, '/image/ankarablazers.jpg', true, true, ARRAY['ankara', 'blazer', 'professional', 'bold'])
    ON CONFLICT DO NOTHING;

    -- Insert sample events
    INSERT INTO events (organizer_id, title, description, event_type, start_date, city, country, is_free, is_published, is_featured) VALUES
    (creator1_id, 'Contemporary African Art Exhibition', 'A showcase of emerging and established African artists exploring themes of identity, culture, and modernity', 'physical', NOW() + INTERVAL '30 days', 'Lagos', 'Nigeria', true, true, true),
    (creator2_id, 'Sustainable Art Workshop', 'Learn to create beautiful sculptures using recycled materials in this hands-on workshop', 'physical', NOW() + INTERVAL '15 days', 'Accra', 'Ghana', false, true, true),
    (creator3_id, 'African Fashion Week Virtual Show', 'Experience the latest in African fashion from the comfort of your home', 'virtual', NOW() + INTERVAL '45 days', null, null, true, true, true)
    ON CONFLICT DO NOTHING;

    -- Insert sample blog posts
    INSERT INTO blog_posts (author_id, title, content, excerpt, is_published, published_at, slug, tags) VALUES
    (creator1_id, 'The Evolution of African Contemporary Art', 'African contemporary art has undergone a remarkable transformation over the past decades. From the colonial period through independence and into the modern era, African artists have continuously redefined what it means to create art that speaks to both local and global audiences. Today, we see a vibrant ecosystem of creators who blend traditional techniques with contemporary themes, creating works that challenge perceptions and celebrate the rich cultural heritage of the continent.', 'Exploring how African artists are redefining contemporary art on the global stage', true, NOW() - INTERVAL '5 days', 'evolution-african-contemporary-art', ARRAY['art', 'contemporary', 'african', 'culture']),
    (creator2_id, 'Art from Waste: Creating Beauty from Discarded Materials', 'In a world grappling with environmental challenges, artists are finding innovative ways to transform waste into meaningful art. This movement goes beyond mere recycling; it represents a philosophical shift towards sustainability and conscious creation. By using discarded materials, artists not only reduce waste but also make powerful statements about consumption, environmental responsibility, and the potential for beauty in unexpected places.', 'How recycled art is making a statement about sustainability and creativity', true, NOW() - INTERVAL '10 days', 'art-from-waste-sustainability', ARRAY['sustainability', 'recycled', 'environment', 'sculpture']),
    (creator3_id, 'Traditional Textiles in Modern Fashion', 'The rich heritage of African textiles continues to inspire contemporary fashion designers around the world. From the intricate patterns of Kente cloth to the bold prints of Ankara fabric, these traditional materials carry stories, meanings, and cultural significance that transcend mere aesthetics. Modern designers are finding innovative ways to honor these traditions while creating pieces that speak to contemporary sensibilities and global fashion trends.', 'Bridging the gap between traditional craftsmanship and modern fashion trends', true, NOW() - INTERVAL '3 days', 'traditional-textiles-modern-fashion', ARRAY['fashion', 'textiles', 'traditional', 'modern'])
    ON CONFLICT (slug) DO NOTHING;

END $$;

-- Remove the foreign key constraint for development purposes
-- In production, you'd want to keep this constraint and create proper auth users
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;