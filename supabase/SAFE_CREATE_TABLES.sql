-- ============================================
-- SAFE CREATE TABLES SCRIPT
-- This script checks for table existence before creating references
-- ============================================

-- First, let's check what tables exist
SELECT 
  'Existing Tables Check:' as info,
  table_name,
  CASE 
    WHEN table_name IN (
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM (
  VALUES 
    ('user_profiles'),
    ('artworks'),
    ('orders'),
    ('wishlists'),
    ('follows'),
    ('notifications')
) AS t(table_name)
ORDER BY table_name;

-- ============================================
-- CREATE TABLES SAFELY
-- ============================================

BEGIN;

-- 1. Create wishlists table (only if artworks exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'artworks') THEN
    CREATE TABLE IF NOT EXISTS wishlists (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
      artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, artwork_id)
    );
    RAISE NOTICE '✅ Wishlists table created';
  ELSE
    RAISE NOTICE '⚠️  Skipping wishlists - artworks table does not exist';
  END IF;
END $$;

-- 2. Create follows table
CREATE TABLE IF NOT EXISTS follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- 3. Create notifications table
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

-- 4. Create artwork_views table (only if artworks exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'artworks') THEN
    CREATE TABLE IF NOT EXISTS artwork_views (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
      user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
      ip_address INET,
      user_agent TEXT,
      viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE '✅ Artwork_views table created';
  ELSE
    RAISE NOTICE '⚠️  Skipping artwork_views - artworks table does not exist';
  END IF;
END $$;

-- 5. Create reviews table (only if artworks exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'artworks') THEN
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
    RAISE NOTICE '✅ Reviews table created';
  ELSE
    RAISE NOTICE '⚠️  Skipping reviews - artworks table does not exist';
  END IF;
END $$;

-- ============================================
-- CREATE INDEXES SAFELY
-- ============================================

-- Indexes for follows table
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);

-- Indexes for notifications table
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Conditional indexes for artwork-related tables
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'wishlists') THEN
    CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
    CREATE INDEX IF NOT EXISTS idx_wishlists_artwork_id ON wishlists(artwork_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'artwork_views') THEN
    CREATE INDEX IF NOT EXISTS idx_artwork_views_artwork_id ON artwork_views(artwork_id);
    CREATE INDEX IF NOT EXISTS idx_artwork_views_viewed_at ON artwork_views(viewed_at);
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reviews') THEN
    CREATE INDEX IF NOT EXISTS idx_reviews_artwork_id ON reviews(artwork_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
  END IF;
END $$;

-- ============================================
-- ENABLE RLS
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'wishlists') THEN
    ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'follows') THEN
    ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'artwork_views') THEN
    ALTER TABLE artwork_views ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reviews') THEN
    ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================
-- CREATE RLS POLICIES
-- ============================================

-- Follows policies (always safe to create)
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

-- Conditional policies for artwork-related tables
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'wishlists') THEN
    DROP POLICY IF EXISTS "Users can manage their own wishlist" ON wishlists;
    CREATE POLICY "Users can manage their own wishlist" ON wishlists
      FOR ALL USING (auth.uid() = user_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'artwork_views') THEN
    DROP POLICY IF EXISTS "Anyone can create artwork views" ON artwork_views;
    CREATE POLICY "Anyone can create artwork views" ON artwork_views
      FOR INSERT WITH CHECK (true);
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reviews') THEN
    DROP POLICY IF EXISTS "Users can manage their own reviews" ON reviews;
    CREATE POLICY "Users can manage their own reviews" ON reviews
      FOR ALL USING (auth.uid() = user_id);
      
    DROP POLICY IF EXISTS "Public can view reviews" ON reviews;
    CREATE POLICY "Public can view reviews" ON reviews
      FOR SELECT USING (true);
  END IF;
END $$;

COMMIT;

-- ============================================
-- FINAL VERIFICATION
-- ============================================
SELECT 
  '🎉 SETUP COMPLETE!' as message,
  'Tables created based on existing schema' as details;

-- Show what was created
SELECT 
  table_name,
  '✅ Created Successfully' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('wishlists', 'follows', 'notifications', 'artwork_views', 'reviews')
ORDER BY table_name;

-- Show what was skipped (if any)
SELECT 
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'artworks')
    THEN 'artworks table missing - some features will be limited'
    ELSE 'All dependencies satisfied'
  END as dependency_check;