-- Enable Row Level Security on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all public profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- User profiles policies
CREATE POLICY "Users can view all public profiles" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Creator applications policies
DROP POLICY IF EXISTS "Users can view own applications" ON creator_applications;
DROP POLICY IF EXISTS "Users can create own applications" ON creator_applications;
DROP POLICY IF EXISTS "Users can update own pending applications" ON creator_applications;

CREATE POLICY "Users can view own applications" ON creator_applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own applications" ON creator_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending applications" ON creator_applications
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- Categories policies (public read)
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
CREATE POLICY "Anyone can view categories" ON categories
  FOR SELECT USING (is_active = true);

-- Artworks policies
DROP POLICY IF EXISTS "Anyone can view available artworks" ON artworks;
DROP POLICY IF EXISTS "Creators can manage own artworks" ON artworks;

CREATE POLICY "Anyone can view available artworks" ON artworks
  FOR SELECT USING (is_available = true);

CREATE POLICY "Creators can manage own artworks" ON artworks
  FOR ALL USING (auth.uid() = creator_id);

-- Orders policies
DROP POLICY IF EXISTS "Users can view own orders as buyer" ON orders;
DROP POLICY IF EXISTS "Creators can view orders for their items" ON orders;
DROP POLICY IF EXISTS "Buyers can create orders" ON orders;
DROP POLICY IF EXISTS "Buyers can update own orders" ON orders;

CREATE POLICY "Users can view own orders as buyer" ON orders
  FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Creators can view orders for their items" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM order_items oi 
      WHERE oi.order_id = orders.id 
      AND oi.creator_id = auth.uid()
    )
  );

CREATE POLICY "Buyers can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers can update own orders" ON orders
  FOR UPDATE USING (auth.uid() = buyer_id);

-- Order items policies
DROP POLICY IF EXISTS "Users can view order items for their orders" ON order_items;
DROP POLICY IF EXISTS "System can manage order items" ON order_items;

CREATE POLICY "Users can view order items for their orders" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o 
      WHERE o.id = order_items.order_id 
      AND (o.buyer_id = auth.uid() OR order_items.creator_id = auth.uid())
    )
  );

CREATE POLICY "System can manage order items" ON order_items
  FOR ALL USING (true);

-- Wishlist policies
DROP POLICY IF EXISTS "Users can manage own wishlist" ON wishlists;
CREATE POLICY "Users can manage own wishlist" ON wishlists
  FOR ALL USING (auth.uid() = user_id);

-- Follow policies
DROP POLICY IF EXISTS "Users can manage own follows" ON follows;
DROP POLICY IF EXISTS "Users can view who follows them" ON follows;

CREATE POLICY "Users can manage own follows" ON follows
  FOR ALL USING (auth.uid() = follower_id);

CREATE POLICY "Users can view who follows them" ON follows
  FOR SELECT USING (auth.uid() = following_id);

-- Reviews policies
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;

CREATE POLICY "Anyone can view approved reviews" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = reviewer_id);

-- Events policies
DROP POLICY IF EXISTS "Anyone can view published events" ON events;
DROP POLICY IF EXISTS "Organizers can manage own events" ON events;

CREATE POLICY "Anyone can view published events" ON events
  FOR SELECT USING (is_published = true);

CREATE POLICY "Organizers can manage own events" ON events
  FOR ALL USING (auth.uid() = organizer_id);

-- Event registrations policies
DROP POLICY IF EXISTS "Users can manage own registrations" ON event_registrations;
DROP POLICY IF EXISTS "Event organizers can view registrations" ON event_registrations;

CREATE POLICY "Users can manage own registrations" ON event_registrations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Event organizers can view registrations" ON event_registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events e 
      WHERE e.id = event_registrations.event_id 
      AND e.organizer_id = auth.uid()
    )
  );

-- Blog posts policies
DROP POLICY IF EXISTS "Anyone can view published posts" ON blog_posts;
DROP POLICY IF EXISTS "Authors can manage own posts" ON blog_posts;

CREATE POLICY "Anyone can view published posts" ON blog_posts
  FOR SELECT USING (is_published = true);

CREATE POLICY "Authors can manage own posts" ON blog_posts
  FOR ALL USING (auth.uid() = author_id);

-- Comments policies
DROP POLICY IF EXISTS "Anyone can view approved comments" ON comments;
DROP POLICY IF EXISTS "Users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;

CREATE POLICY "Anyone can view approved comments" ON comments
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

-- Notifications policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Shipping zones policies (public read)
DROP POLICY IF EXISTS "Anyone can view shipping zones" ON shipping_zones;
CREATE POLICY "Anyone can view shipping zones" ON shipping_zones
  FOR SELECT USING (is_active = true);

-- Shipping rates policies
DROP POLICY IF EXISTS "Anyone can view active shipping rates" ON shipping_rates;
DROP POLICY IF EXISTS "Creators can manage own shipping rates" ON shipping_rates;

CREATE POLICY "Anyone can view active shipping rates" ON shipping_rates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Creators can manage own shipping rates" ON shipping_rates
  FOR ALL USING (auth.uid() = creator_id);

-- Coupons policies
DROP POLICY IF EXISTS "Anyone can view active coupons" ON coupons;
DROP POLICY IF EXISTS "Creators can manage own coupons" ON coupons;

CREATE POLICY "Anyone can view active coupons" ON coupons
  FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "Creators can manage own coupons" ON coupons
  FOR ALL USING (auth.uid() = creator_id);

-- Page views policies (insert only for analytics)
DROP POLICY IF EXISTS "Anyone can insert page views" ON page_views;
CREATE POLICY "Anyone can insert page views" ON page_views
  FOR INSERT WITH CHECK (true);
