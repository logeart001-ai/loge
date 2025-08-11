-- Insert default categories
INSERT INTO categories (name, slug, description, sort_order) VALUES
('Art Designs', 'art-designs', 'Digital and print art designs', 1),
('Paintings', 'paintings', 'Original paintings and prints', 2),
('Sculptures', 'sculptures', 'Three-dimensional artworks', 3),
('Books', 'books', 'Literature, poetry, and educational content', 4),
('Fashion', 'fashion', 'Clothing, accessories, and wearables', 5)
ON CONFLICT (slug) DO NOTHING;

-- Insert subcategories
INSERT INTO categories (name, slug, description, parent_id, sort_order) VALUES
-- Art Design subcategories
('Digital Art', 'digital-art', 'Computer-generated artwork', (SELECT id FROM categories WHERE slug = 'art-designs'), 1),
('Print Designs', 'print-designs', 'Designs for printing', (SELECT id FROM categories WHERE slug = 'art-designs'), 2),
('Abstract', 'abstract', 'Abstract art pieces', (SELECT id FROM categories WHERE slug = 'art-designs'), 3),

-- Painting subcategories
('Oil Paintings', 'oil-paintings', 'Oil on canvas paintings', (SELECT id FROM categories WHERE slug = 'paintings'), 1),
('Acrylic Paintings', 'acrylic-paintings', 'Acrylic paintings', (SELECT id FROM categories WHERE slug = 'paintings'), 2),
('Watercolor', 'watercolor', 'Watercolor paintings', (SELECT id FROM categories WHERE slug = 'paintings'), 3),

-- Sculpture subcategories
('Wood Sculptures', 'wood-sculptures', 'Carved wood sculptures', (SELECT id FROM categories WHERE slug = 'sculptures'), 1),
('Bronze Sculptures', 'bronze-sculptures', 'Cast bronze sculptures', (SELECT id FROM categories WHERE slug = 'sculptures'), 2),
('Clay Sculptures', 'clay-sculptures', 'Ceramic and clay works', (SELECT id FROM categories WHERE slug = 'sculptures'), 3),

-- Book subcategories
('Fiction', 'fiction', 'Fictional literature', (SELECT id FROM categories WHERE slug = 'books'), 1),
('Poetry', 'poetry', 'Poetry collections', (SELECT id FROM categories WHERE slug = 'books'), 2),
('Biography', 'biography', 'Biographical works', (SELECT id FROM categories WHERE slug = 'books'), 3),
('Essays', 'essays', 'Essay collections', (SELECT id FROM categories WHERE slug = 'books'), 4),

-- Fashion subcategories
('Women\'s Fashion', 'womens-fashion', 'Women\'s clothing and accessories', (SELECT id FROM categories WHERE slug = 'fashion'), 1),
('Men\'s Fashion', 'mens-fashion', 'Men\'s clothing and accessories', (SELECT id FROM categories WHERE slug = 'fashion'), 2),
('Accessories', 'accessories', 'Fashion accessories', (SELECT id FROM categories WHERE slug = 'fashion'), 3)
ON CONFLICT (slug) DO NOTHING;

-- Insert default shipping zones
INSERT INTO shipping_zones (name, countries) VALUES
('Nigeria', ARRAY['Nigeria']),
('West Africa', ARRAY['Ghana', 'Senegal', 'Mali', 'Burkina Faso', 'Ivory Coast', 'Guinea', 'Sierra Leone', 'Liberia', 'Togo', 'Benin']),
('Africa', ARRAY['South Africa', 'Kenya', 'Tanzania', 'Uganda', 'Rwanda', 'Ethiopia', 'Morocco', 'Algeria', 'Tunisia', 'Egypt']),
('International', ARRAY['United States', 'United Kingdom', 'Canada', 'Germany', 'France', 'Netherlands', 'Australia'])
ON CONFLICT DO NOTHING;

-- Insert sample events
INSERT INTO events (
  title, 
  description, 
  event_type, 
  start_date, 
  end_date,
  venue_name,
  city,
  country,
  is_free,
  ticket_price,
  max_attendees,
  is_featured,
  is_published,
  slug,
  tags
) VALUES
(
  'Contemporary African Art Exhibition 2024',
  'A showcase of the finest contemporary African art from emerging and established artists across the continent.',
  'physical',
  '2024-03-15 10:00:00+01',
  '2024-03-17 18:00:00+01',
  'National Theatre Lagos',
  'Lagos',
  'Nigeria',
  false,
  5000.00,
  500,
  true,
  true,
  'contemporary-african-art-exhibition-2024',
  ARRAY['art', 'exhibition', 'contemporary', 'african']
),
(
  'Virtual Poetry Reading: Voices of Africa',
  'Join us for an evening of powerful poetry from African writers and poets.',
  'virtual',
  '2024-02-20 19:00:00+01',
  '2024-02-20 21:00:00+01',
  null,
  null,
  null,
  true,
  null,
  1000,
  true,
  true,
  'virtual-poetry-reading-voices-of-africa',
  ARRAY['poetry', 'literature', 'virtual', 'reading']
),
(
  'African Fashion Week Accra',
  'The premier fashion event showcasing the best of African fashion designers.',
  'physical',
  '2024-04-10 18:00:00+00',
  '2024-04-12 22:00:00+00',
  'Accra International Conference Centre',
  'Accra',
  'Ghana',
  false,
  25000.00,
  800,
  true,
  true,
  'african-fashion-week-accra',
  ARRAY['fashion', 'runway', 'designers', 'accra']
)
ON CONFLICT (slug) DO NOTHING;
