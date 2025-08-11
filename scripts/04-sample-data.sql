-- Sample data for testing the homepage
-- Run this AFTER creating the essential tables

-- Insert sample user profiles (creators)
INSERT INTO user_profiles (id, email, full_name, role, creator_status, bio, location, discipline, is_featured, rating) VALUES
(uuid_generate_v4(), 'adunni@example.com', 'Adunni Olorunnisola', 'creator', 'approved', 'Contemporary African artist specializing in mixed media and traditional motifs', 'Lagos, Nigeria', 'Visual Arts', true, 4.8),
(uuid_generate_v4(), 'kwame@example.com', 'Kwame Asante', 'creator', 'approved', 'Sculptor working with recycled materials to create powerful social commentary', 'Accra, Ghana', 'Sculpture', true, 4.9),
(uuid_generate_v4(), 'amara@example.com', 'Amara Diallo', 'creator', 'approved', 'Fashion designer blending traditional West African textiles with modern silhouettes', 'Dakar, Senegal', 'Fashion Design', true, 4.7)
ON CONFLICT (email) DO NOTHING;

-- Get the creator IDs for sample artworks
DO $$
DECLARE
    creator1_id UUID;
    creator2_id UUID;
    creator3_id UUID;
BEGIN
    SELECT id INTO creator1_id FROM user_profiles WHERE email = 'adunni@example.com';
    SELECT id INTO creator2_id FROM user_profiles WHERE email = 'kwame@example.com';
    SELECT id INTO creator3_id FROM user_profiles WHERE email = 'amara@example.com';

    -- Insert sample artworks
    INSERT INTO artworks (creator_id, title, description, category, price, original_price, thumbnail_url, is_featured, is_available, tags) VALUES
    (creator1_id, 'Ancestral Echoes', 'A vibrant mixed media piece exploring the connection between past and present through traditional Yoruba symbols', 'art_design', 150000, 200000, '/placeholder.svg?height=400&width=400&text=Ancestral+Echoes', true, true, ARRAY['traditional', 'mixed-media', 'yoruba', 'contemporary']),
    (creator1_id, 'Urban Rhythms', 'Digital art piece capturing the energy of Lagos street life with bold colors and geometric patterns', 'art_design', 75000, null, '/placeholder.svg?height=400&width=400&text=Urban+Rhythms', true, true, ARRAY['digital', 'urban', 'geometric', 'lagos']),
    (creator2_id, 'Resilience', 'Bronze sculpture made from recycled materials, representing the strength of the African spirit', 'sculpture', 500000, null, '/placeholder.svg?height=400&width=400&text=Resilience', true, true, ARRAY['bronze', 'recycled', 'sculpture', 'strength']),
    (creator2_id, 'Mother Earth', 'Clay sculpture celebrating the nurturing power of nature and femininity', 'sculpture', 250000, 300000, '/placeholder.svg?height=400&width=400&text=Mother+Earth', false, true, ARRAY['clay', 'nature', 'feminine', 'earth']),
    (creator3_id, 'Kente Dreams Dress', 'Modern midi dress featuring authentic Kente cloth patterns with contemporary tailoring', 'fashion', 85000, null, '/placeholder.svg?height=400&width=400&text=Kente+Dreams', true, true, ARRAY['kente', 'dress', 'traditional', 'modern']),
    (creator3_id, 'Ankara Blazer', 'Professional blazer in bold Ankara print, perfect for the modern African woman', 'fashion', 65000, 80000, '/placeholder.svg?height=400&width=400&text=Ankara+Blazer', true, true, ARRAY['ankara', 'blazer', 'professional', 'bold']);

    -- Insert sample events
    INSERT INTO events (organizer_id, title, description, event_type, start_date, city, country, is_free, is_published, is_featured) VALUES
    (creator1_id, 'Contemporary African Art Exhibition', 'A showcase of emerging and established African artists exploring themes of identity, culture, and modernity', 'physical', NOW() + INTERVAL '30 days', 'Lagos', 'Nigeria', true, true, true),
    (creator2_id, 'Sustainable Art Workshop', 'Learn to create beautiful sculptures using recycled materials in this hands-on workshop', 'physical', NOW() + INTERVAL '15 days', 'Accra', 'Ghana', false, true, true),
    (creator3_id, 'African Fashion Week Virtual Show', 'Experience the latest in African fashion from the comfort of your home', 'virtual', NOW() + INTERVAL '45 days', null, null, true, true, true);

    -- Insert sample blog posts
    INSERT INTO blog_posts (author_id, title, content, excerpt, is_published, published_at, slug, tags) VALUES
    (creator1_id, 'The Evolution of African Contemporary Art', 'African contemporary art has undergone a remarkable transformation over the past decades...', 'Exploring how African artists are redefining contemporary art on the global stage', true, NOW() - INTERVAL '5 days', 'evolution-african-contemporary-art', ARRAY['art', 'contemporary', 'african', 'culture']),
    (creator2_id, 'Art from Waste: Creating Beauty from Discarded Materials', 'In a world grappling with environmental challenges, artists are finding innovative ways...', 'How recycled art is making a statement about sustainability and creativity', true, NOW() - INTERVAL '10 days', 'art-from-waste-sustainability', ARRAY['sustainability', 'recycled', 'environment', 'sculpture']),
    (creator3_id, 'Traditional Textiles in Modern Fashion', 'The rich heritage of African textiles continues to inspire contemporary fashion designers...', 'Bridging the gap between traditional craftsmanship and modern fashion trends', true, NOW() - INTERVAL '3 days', 'traditional-textiles-modern-fashion', ARRAY['fashion', 'textiles', 'traditional', 'modern']);

END $$;