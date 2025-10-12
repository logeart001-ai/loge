-- ============================================
-- CREATE MISSING DASHBOARD TABLES
-- Run this script to add all missing functionality tables
-- ============================================

BEGIN;

-- ============================================
-- 1. WISHLISTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one wishlist entry per user per artwork
  UNIQUE(user_id, artwork_id)
);

-- ============================================
-- 2. FOLLOWS TABLE (Creator Following System)
-- ============================================
CREATE TABLE IF NOT EXISTS follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one follow relationship per pair
  UNIQUE(follower_id, following_id),
  -- Prevent self-following
  CHECK (follower_id != following_id)
);

-- ============================================
-- 3. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'order', 'follow', 'submission_approved', 'submission_rejected'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}', -- Additional data (order_id, artwork_id, etc.)
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. ARTWORK VIEWS TABLE (For Analytics)
-- ============================================
CREATE TABLE IF NOT EXISTS artwork_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL, -- NULL for anonymous views
  ip_address INET,
  user_agent TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. REVIEWS TABLE (Artwork Reviews)
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One review per user per artwork
  UNIQUE(artwork_id, user_id)
);

-- ============================================
-- 6. FIX ORDERS TABLE (Add creator_id relationship)
-- ============================================
-- Add creator_id to orders table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'creator_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN creator_id UUID REFERENCES user_profiles(id);
  END IF;
END $$;

-- ============================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_artwork_id ON wishlists(artwork_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_artwork_views_artwork_id ON artwork_views(artwork_id);
CREATE INDEX IF NOT EXISTS idx_artwork_views_viewed_at ON artwork_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_reviews_artwork_id ON reviews(artwork_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_creator_id ON orders(creator_id);

-- ============================================
-- 8. ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE artwork_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 9. CREATE RLS POLICIES
-- ============================================

-- Wishlists policies
CREATE POLICY "Users can manage their own wishlist" ON wishlists
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public can view wishlist counts" ON wishlists
  FOR SELECT USING (true);

-- Follows policies
CREATE POLICY "Users can manage their own follows" ON follows
  FOR ALL USING (auth.uid() = follower_id);

CREATE POLICY "Public can view follow relationships" ON follows
  FOR SELECT USING (true);

-- Notifications policies
CREATE POLICY "Users can manage their own notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id);

-- Artwork views policies
CREATE POLICY "Anyone can create artwork views" ON artwork_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own views" ON artwork_views
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Reviews policies
CREATE POLICY "Users can manage their own reviews" ON reviews
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public can view reviews" ON reviews
  FOR SELECT USING (true);

-- ============================================
-- 10. CREATE HELPER FUNCTIONS
-- ============================================

-- Function to increment artwork views
CREATE OR REPLACE FUNCTION increment_artwork_views(artwork_uuid UUID, viewer_ip INET DEFAULT NULL, viewer_agent TEXT DEFAULT NULL)
RETURNS void AS $$
BEGIN
  -- Insert view record
  INSERT INTO artwork_views (artwork_id, user_id, ip_address, user_agent)
  VALUES (artwork_uuid, auth.uid(), viewer_ip, viewer_agent);
  
  -- Update artwork views count
  UPDATE artworks 
  SET views_count = COALESCE(views_count, 0) + 1,
      updated_at = NOW()
  WHERE id = artwork_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get wishlist status
CREATE OR REPLACE FUNCTION is_in_wishlist(artwork_uuid UUID, user_uuid UUID DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM wishlists 
    WHERE artwork_id = artwork_uuid AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get follow status
CREATE OR REPLACE FUNCTION is_following(creator_uuid UUID, follower_uuid UUID DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM follows 
    WHERE following_id = creator_uuid AND follower_id = follower_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
SELECT 
  '✅ TABLES CREATED SUCCESSFULLY!' as status,
  COUNT(*) as new_tables_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('wishlists', 'follows', 'notifications', 'artwork_views', 'reviews');

-- Show all new tables
SELECT 
  table_name,
  '✅ Created' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('wishlists', 'follows', 'notifications', 'artwork_views', 'reviews')
ORDER BY table_name;

-- Show RLS policies
SELECT 
  tablename,
  policyname,
  '✅ Policy Active' as status
FROM pg_policies 
WHERE tablename IN ('wishlists', 'follows', 'notifications', 'artwork_views', 'reviews')
ORDER BY tablename, policyname;