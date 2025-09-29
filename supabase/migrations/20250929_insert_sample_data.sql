-- Insert sample data for Loge Arts platform

-- Insert sample user profiles (creators)
INSERT INTO user_profiles (id, full_name, avatar_url, bio, location, role, discipline, rating, is_verified, is_featured) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Adunni Olorunnisola', '/image/AdunniOlorunnisola.jpg', 'Contemporary African painter exploring themes of identity and heritage', 'Lagos, Nigeria', 'creator', 'painter', 4.8, true, true),
  ('550e8400-e29b-41d4-a716-446655440002', 'Kwame Asante', '/image/KwameAsante.jpg', 'Sculptor and mixed media artist from Ghana', 'Accra, Ghana', 'creator', 'sculptor', 4.6, true, true),
  ('550e8400-e29b-41d4-a716-446655440003', 'Amara Diallo', '/image/AmaraDiallo.jpg', 'Fashion designer specializing in contemporary African wear', 'Dakar, Senegal', 'creator', 'fashion_designer', 4.7, true, true),
  ('550e8400-e29b-41d4-a716-446655440004', 'Fatima Al-Rashid', '/image/Creator Avatars female.png', 'Digital artist and illustrator', 'Cairo, Egypt', 'creator', 'digital_artist', 4.6, false, false),
  ('550e8400-e29b-41d4-a716-446655440005', 'Kofi Mensah', '/image/Creator Avatars male.png', 'Contemporary painter', 'Cape Coast, Ghana', 'creator', 'painter', 4.8, false, false),
  ('550e8400-e29b-41d4-a716-446655440006', 'Amina Hassan', '/image/Creator Avatars female.png', 'Sculptor and installation artist', 'Marrakech, Morocco', 'creator', 'sculptor', 4.7, false, false)
ON CONFLICT (id) DO NOTHING;

-- Insert sample artworks
INSERT INTO artworks (id, creator_id, title, description, category, price, original_price, thumbnail_url, image_urls, is_available, is_featured, tags) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Ancestral Echoes', 'A powerful painting exploring the connection between past and present through vibrant colors and traditional motifs', 'painting', 125000, 150000, '/image/AncestralEchoes.jpg', ARRAY['/image/AncestralEchoes.jpg'], true, true, ARRAY['traditional', 'contemporary', 'heritage']),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Urban Rhythm', 'Modern interpretation of city life in Lagos with bold strokes and urban colors', 'painting', 95000, NULL, '/image/urbanRythym.jpg', ARRAY['/image/urbanRythym.jpg'], true, true, ARRAY['urban', 'modern', 'city']),
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'Resilience II', 'Bronze sculpture representing the strength and resilience of the African spirit', 'sculpture', 180000, NULL, '/image/resilence2.jpg', ARRAY['/image/resilence2.jpg'], true, true, ARRAY['bronze', 'strength', 'african']),
  ('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'Desert Mirage', 'Digital artwork capturing the mystical beauty of the Sahara', 'art_design', 85000, 95000, '/image/Sunset Over Lagos.png', ARRAY['/image/Sunset Over Lagos.png'], true, false, ARRAY['digital', 'desert', 'mystical']),
  ('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', 'Ocean Waves', 'Abstract painting inspired by the Atlantic coast of Ghana', 'painting', 72000, NULL, '/image/Urban Dreams.png', ARRAY['/image/Urban Dreams.png'], true, false, ARRAY['abstract', 'ocean', 'coastal']),
  ('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440006', 'Mountain Spirit', 'Clay sculpture inspired by the Atlas Mountains', 'sculpture', 110000, NULL, '/image/Mother Earth.jpg', ARRAY['/image/Mother Earth.jpg'], true, false, ARRAY['clay', 'mountains', 'nature'])
ON CONFLICT (id) DO NOTHING;

-- Insert sample fashion items
INSERT INTO fashion_items (id, designer_id, name, description, category, price, original_price, image_urls, is_available, is_featured, tags) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'Ankara Blazers', 'Contemporary blazers made with authentic Ankara fabric', 'clothing', 45000, NULL, ARRAY['/image/ankarablazers.jpg'], true, true, ARRAY['ankara', 'blazer', 'contemporary']),
  ('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'Kente Collection', 'Traditional Kente cloth reimagined for modern wear', 'clothing', 65000, 75000, ARRAY['/image/kente.jpg'], true, true, ARRAY['kente', 'traditional', 'modern'])
ON CONFLICT (id) DO NOTHING;

-- Insert sample events
INSERT INTO events (id, organizer_id, title, description, event_type, event_date, start_date, location, is_free, ticket_price, is_featured, is_published) VALUES
  ('880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Contemporary African Art Exhibition', 'Showcasing the best of contemporary African art from emerging and established artists', 'exhibition', '2025-11-15 10:00:00+01', '2025-11-15 10:00:00+01', 'National Theatre, Lagos', false, 2500, true, true),
  ('880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'Sculpture Workshop', 'Learn traditional and modern sculpting techniques', 'workshop', '2025-10-20 14:00:00+01', '2025-10-20 14:00:00+01', 'Art Center, Accra', false, 15000, true, true),
  ('880e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'African Fashion Week', 'Celebrating contemporary African fashion designers', 'fashion_show', '2025-12-05 18:00:00+01', '2025-12-05 18:00:00+01', 'Eko Convention Center, Lagos', false, 5000, true, true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample blog posts
INSERT INTO blog_posts (id, author_id, title, slug, excerpt, content, featured_image_url, is_published, published_at, tags) VALUES
  ('990e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'The Evolution of Contemporary African Art', 'evolution-contemporary-african-art', 'Exploring how African art has evolved in the 21st century', 'Contemporary African art has undergone a remarkable transformation in recent decades. Artists across the continent are blending traditional techniques with modern themes, creating works that speak to both local and global audiences...', '/image/Blog Post Featured Images.png', true, '2025-09-20 10:00:00+01', ARRAY['art', 'contemporary', 'african', 'evolution']),
  ('990e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'Sculpting Stories: The Art of Bronze', 'sculpting-stories-bronze-art', 'Understanding the ancient art of bronze sculpting in modern times', 'Bronze sculpting has been a cornerstone of African artistic expression for centuries. From the famous Benin Bronzes to contemporary works, this medium continues to tell powerful stories...', '/image/Blog Post Featured Images.png', true, '2025-09-15 14:30:00+01', ARRAY['sculpture', 'bronze', 'traditional', 'stories']),
  ('990e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'Fashion Forward: African Textiles in Modern Design', 'fashion-forward-african-textiles', 'How traditional African textiles are influencing global fashion', 'African textiles like Ankara, Kente, and Bogolan are making waves in international fashion. Designers are finding innovative ways to incorporate these rich traditions into contemporary wear...', '/image/Blog Post Featured Images.png', true, '2025-09-10 16:00:00+01', ARRAY['fashion', 'textiles', 'traditional', 'modern'])
ON CONFLICT (id) DO NOTHING;

-- Update the events table to ensure start_date is populated
UPDATE events SET start_date = event_date WHERE start_date IS NULL;