-- Drop existing tables and recreate them properly
-- Drop in reverse dependency order to avoid foreign key conflicts

DROP TABLE IF EXISTS page_views CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS shipping_rates CASCADE;
DROP TABLE IF EXISTS shipping_zones CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS blog_posts CASCADE;
DROP TABLE IF EXISTS event_registrations CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS follows CASCADE;
DROP TABLE IF EXISTS wishlists CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS artworks CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS creator_applications CASCADE;

-- Drop existing user_profiles table if it exists
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Drop custom types if they exist
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS creator_status CASCADE;
DROP TYPE IF EXISTS artwork_category CASCADE;
DROP TYPE IF EXISTS artwork_subcategory CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS event_type CASCADE;
DROP TYPE IF EXISTS application_status CASCADE;
DROP TYPE IF EXISTS book_format CASCADE;
DROP TYPE IF EXISTS fashion_size CASCADE;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS generate_order_number() CASCADE;
DROP FUNCTION IF EXISTS generate_unique_slug(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS increment_artwork_views(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_creator_rating(UUID) CASCADE;
DROP FUNCTION IF EXISTS handle_review_rating_update() CASCADE;
DROP FUNCTION IF EXISTS calculate_order_totals(UUID) CASCADE;
DROP FUNCTION IF EXISTS create_notification(UUID, TEXT, TEXT, TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS search_artworks(TEXT, artwork_category, DECIMAL, DECIMAL, UUID, INTEGER, INTEGER) CASCADE;
