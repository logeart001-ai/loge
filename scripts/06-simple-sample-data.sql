-- Simple sample data without auth dependencies
-- Run this AFTER creating the essential tables

-- Temporarily remove the foreign key constraint for development
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

-- Clear any existing sample data
DELETE FROM blog_posts WHERE slug LIKE '%-african-%' OR slug LIKE '%-sustainability%' OR slug LIKE '%-fashion%';
DELETE FROM events WHERE title LIKE '%Exhibition%' OR title LIKE '%Workshop%' OR title LIKE '%Fashion Week%';
DELETE FROM artworks WHERE title IN ('Ancestral Echoes', 'Urban Rhythms', 'Resilience', 'Mother Earth', 'Kente Dreams Dress', 'Ankara Blazer');
DELETE FROM user_profiles WHERE email IN ('adunni@example.com', 'kwame@example.com', 'amara@example.com');

-- Insert sample creators with fixed UUIDs
INSERT INTO user_profiles (id, email, full_name, role, creator_status, bio, location, discipline, is_featured, rating) VALUES
('11111111-1111-1111-1111-111111111111', 'adunni@example.com', 'Adunni Olorunnisola', 'creator', 'approved', 'Contemporary African artist specializing in mixed media and traditional motifs', 'Lagos, Nigeria', 'Visual Arts', true, 4.8),
('22222222-2222-2222-2222-222222222222', 'kwame@example.com', 'Kwame Asante', 'creator', 'approved', 'Sculptor working with recycled materials to create powerful social commentary', 'Accra, Ghana', 'Sculpture', true, 4.9),
('33333333-3333-3333-3333-333333333333', 'amara@example.com', 'Amara Diallo', 'creator', 'approved', 'Fashion designer blending traditional West African textiles with modern silhouettes', 'Dakar, Senegal', 'Fashion Design', true, 4.7);

-- Insert sample artworks
INSERT INTO artworks (creator_id, title, description, category, price, original_price, thumbnail_url, is_featured, is_available, tags) VALUES
('11111111-1111-1111-1111-111111111111', 'Ancestral Echoes', 'A vibrant mixed media piece exploring the connection between past and present through traditional Yoruba symbols', 'art_design', 150000, 200000, '/image/AncestralEchoes.jpg', true, true, ARRAY['traditional', 'mixed-media', 'yoruba', 'contemporary']),
('11111111-1111-1111-1111-111111111111', 'Urban Rhythms', 'Digital art piece capturing the energy of Lagos street life with bold colors and geometric patterns', 'art_design', 75000, null, '/image/urbanRythym.jpg', true, true, ARRAY['digital', 'urban', 'geometric', 'lagos']),
('22222222-2222-2222-2222-222222222222', 'Resilience', 'Bronze sculpture made from recycled materials, representing the strength of the African spirit', 'sculpture', 500000, null, '/image/resilence2.jpg', true, true, ARRAY['bronze', 'recycled', 'sculpture', 'strength']),
('22222222-2222-2222-2222-222222222222', 'Mother Earth', 'Clay sculpture celebrating the nurturing power of nature and femininity', 'sculpture', 250000, 300000, '/image/Creator Avatars female.png', false, true, ARRAY['clay', 'nature', 'feminine', 'earth']),
('33333333-3333-3333-3333-333333333333', 'Kente Dreams Dress', 'Modern midi dress featuring authentic Kente cloth patterns with contemporary tailoring', 'fashion', 85000, null, '/image/kente.jpg', true, true, ARRAY['kente', 'dress', 'traditional', 'modern']),
('33333333-3333-3333-3333-333333333333', 'Ankara Blazer', 'Professional blazer in bold Ankara print, perfect for the modern African woman', 'fashion', 65000, 80000, '/image/ankarablazers.jpg', true, true, ARRAY['ankara', 'blazer', 'professional', 'bold']);

-- Insert sample events
INSERT INTO events (organizer_id, title, description, event_type, start_date, city, country, is_free, is_published, is_featured) VALUES
('11111111-1111-1111-1111-111111111111', 'Contemporary African Art Exhibition', 'A showcase of emerging and established African artists exploring themes of identity, culture, and modernity', 'physical', NOW() + INTERVAL '30 days', 'Lagos', 'Nigeria', true, true, true),
('22222222-2222-2222-2222-222222222222', 'Sustainable Art Workshop', 'Learn to create beautiful sculptures using recycled materials in this hands-on workshop', 'physical', NOW() + INTERVAL '15 days', 'Accra', 'Ghana', false, true, true),
('33333333-3333-3333-3333-333333333333', 'African Fashion Week Virtual Show', 'Experience the latest in African fashion from the comfort of your home', 'virtual', NOW() + INTERVAL '45 days', null, null, true, true, true);

-- Insert sample blog posts
INSERT INTO blog_posts (author_id, title, content, excerpt, is_published, published_at, slug, tags) VALUES
('11111111-1111-1111-1111-111111111111', 'The Evolution of African Contemporary Art', 'African contemporary art has undergone a remarkable transformation over the past decades. From the colonial period through independence and into the modern era, African artists have continuously redefined what it means to create art that speaks to both local and global audiences. Today, we see a vibrant ecosystem of creators who blend traditional techniques with contemporary themes, creating works that challenge perceptions and celebrate the rich cultural heritage of the continent.', 'Exploring how African artists are redefining contemporary art on the global stage', true, NOW() - INTERVAL '5 days', 'evolution-african-contemporary-art', ARRAY['art', 'contemporary', 'african', 'culture']),
('22222222-2222-2222-2222-222222222222', 'Art from Waste: Creating Beauty from Discarded Materials', 'In a world grappling with environmental challenges, artists are finding innovative ways to transform waste into meaningful art. This movement goes beyond mere recycling; it represents a philosophical shift towards sustainability and conscious creation. By using discarded materials, artists not only reduce waste but also make powerful statements about consumption, environmental responsibility, and the potential for beauty in unexpected places.', 'How recycled art is making a statement about sustainability and creativity', true, NOW() - INTERVAL '10 days', 'art-from-waste-sustainability', ARRAY['sustainability', 'recycled', 'environment', 'sculpture']),
('33333333-3333-3333-3333-333333333333', 'Traditional Textiles in Modern Fashion', 'The rich heritage of African textiles continues to inspire contemporary fashion designers around the world. From the intricate patterns of Kente cloth to the bold prints of Ankara fabric, these traditional materials carry stories, meanings, and cultural significance that transcend mere aesthetics. Modern designers are finding innovative ways to honor these traditions while creating pieces that speak to contemporary sensibilities and global fashion trends.', 'Bridging the gap between traditional craftsmanship and modern fashion trends', true, NOW() - INTERVAL '3 days', 'traditional-textiles-modern-fashion', ARRAY['fashion', 'textiles', 'traditional', 'modern']);