-- ============================================
-- QUICK FIX: Create Missing Tables (Fixed Version)
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
-- 3. NOTIFICATIONS TABLE (Fixed column name)
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. ARTWORK VIEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS artwork_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. REVIEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(artwork_id, user_id)
);

-- ============================================
-- 6. CREATE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_artwork_id ON wishlists(artwork_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_artwork_views_artwork_id ON artwork_views(artwork_id);
CREATE INDEX IF NOT EXISTS idx_reviews_artwork_id ON reviews(artwork_id);

-- ============================================
-- 7. ENABLE RLS
-- ============================================
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE artwork_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. CREATE RLS POLICIES
-- ============================================

-- Wishlists policies
DROP POLICY IF EXISTS "Users can manage their own wishlist" ON wishlists;
CREATE POLICY "Users can manage their own wishlist" ON wishlists
  FOR ALL USING (auth.uid() = user_id);

-- Follows policies
DROP POLICY IF EXISTS "Users can manage their own follows" ON follows;
CREATE POLICY "Users can manage their own follows" ON follows
  FOR ALL USING (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Public can view follow relationships" ON follows;
CREATE POLICY "Public can view follow relationships" ON follows
  FOR SELECT USING (true);

-- Notifications policies
DROP POLICY IF EXISTS "Users can manage their own notifications" ON notifications;
CREATE POLICY "Users can manage their own notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id);

-- Artwork views policies
DROP POLICY IF EXISTS "Anyone can create artwork views" ON artwork_views;
CREATE POLICY "Anyone can create artwork views" ON artwork_views
  FOR INSERT WITH CHECK (true);

-- Reviews policies
DROP POLICY IF EXISTS "Users can manage their own reviews" ON reviews;
CREATE POLICY "Users can manage their own reviews" ON reviews
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can view reviews" ON reviews;
CREATE POLICY "Public can view reviews" ON reviews
  FOR SELECT USING (true);

COMMIT;

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 
  '✅ ALL TABLES CREATED SUCCESSFULLY!' as status,
  COUNT(*) as new_tables_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('wishlists', 'follows', 'notifications', 'artwork_views', 'reviews');

-- Show created tables
SELECT 
  table_name,
  '✅ Ready' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('wishlists', 'follows', 'notifications', 'artwork_views', 'reviews')
ORDER BY table_name;