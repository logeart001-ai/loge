-- Analytics and Marketplace Integration Migration
-- This migration adds the missing database components to make dashboards fully functional

-- =====================================================
-- 1. VIEW TRACKING SYSTEM
-- =====================================================

-- Track individual artwork/content views
CREATE TABLE IF NOT EXISTS content_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL,
  content_type VARCHAR(50) NOT NULL, -- 'artwork', 'submission', 'creator_profile', 'blog_post'
  viewer_id UUID REFERENCES auth.users(id), -- NULL for anonymous users
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  session_id VARCHAR(255),
  country VARCHAR(100),
  city VARCHAR(100),
  device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate views from same user/session within 24 hours
  UNIQUE(content_id, content_type, viewer_id, DATE(viewed_at))
);

-- Track content interactions (likes, shares, saves)
CREATE TABLE IF NOT EXISTS content_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  content_id UUID NOT NULL,
  content_type VARCHAR(50) NOT NULL, -- 'artwork', 'submission', 'creator_profile'
  interaction_type VARCHAR(50) NOT NULL, -- 'like', 'share', 'save', 'comment'
  metadata JSONB DEFAULT '{}', -- Additional interaction data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate interactions
  UNIQUE(user_id, content_id, content_type, interaction_type)
);

-- Aggregated analytics for creators (daily rollup)
CREATE TABLE IF NOT EXISTS creator_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- View metrics
  total_views INTEGER DEFAULT 0,
  unique_views INTEGER DEFAULT 0,
  anonymous_views INTEGER DEFAULT 0,
  
  -- Engagement metrics
  total_likes INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  total_saves INTEGER DEFAULT 0,
  
  -- Financial metrics
  total_earnings DECIMAL(10,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0, -- (orders / views) * 100
  
  -- Performance metrics
  avg_time_on_content INTERVAL,
  bounce_rate DECIMAL(5,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one record per creator per day
  UNIQUE(creator_id, date)
);

-- =====================================================
-- 2. MARKETPLACE INTEGRATION TABLES
-- =====================================================

-- Books table (for writer submissions)
CREATE TABLE IF NOT EXISTS books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES project_submissions(id), -- Link to original submission
  
  -- Book Details
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255),
  description TEXT,
  isbn VARCHAR(20),
  
  -- Content
  genre VARCHAR(100),
  language VARCHAR(50) DEFAULT 'English',
  page_count INTEGER,
  word_count INTEGER,
  format VARCHAR(50), -- 'physical', 'ebook', 'audiobook', 'bundle'
  
  -- Pricing
  price DECIMAL(10,2),
  original_price DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'NGN',
  
  -- Availability
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  stock_quantity INTEGER DEFAULT 0,
  
  -- Media
  cover_image_url TEXT,
  preview_url TEXT, -- Sample pages/chapters
  audio_sample_url TEXT, -- For audiobooks
  
  -- Metadata
  publication_date DATE,
  tags TEXT[],
  slug VARCHAR(255) UNIQUE,
  
  -- SEO
  meta_title VARCHAR(255),
  meta_description TEXT,
  
  -- Stats
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  sales_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fashion items table (for fashion designer submissions)
CREATE TABLE IF NOT EXISTS fashion_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES project_submissions(id), -- Link to original submission
  
  -- Fashion Details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  collection_name VARCHAR(255),
  
  -- Product Details
  category VARCHAR(100), -- 'apparel', 'accessories', 'textile', 'jewelry'
  subcategory VARCHAR(100), -- 'dress', 'shirt', 'bag', 'necklace'
  gender VARCHAR(20), -- 'men', 'women', 'unisex', 'children'
  
  -- Materials & Construction
  fabric_materials TEXT[],
  techniques TEXT[], -- 'handwoven', 'embroidered', 'tie-dye'
  care_instructions TEXT,
  
  -- Sizing & Variants
  sizes_available TEXT[], -- ['XS', 'S', 'M', 'L', 'XL', 'custom']
  color_options TEXT[],
  
  -- Pricing
  price DECIMAL(10,2),
  original_price DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'NGN',
  
  -- Availability
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_made_to_order BOOLEAN DEFAULT false,
  production_time_days INTEGER, -- For made-to-order items
  
  -- Media
  image_urls TEXT[],
  thumbnail_url TEXT,
  
  -- Metadata
  tags TEXT[],
  slug VARCHAR(255) UNIQUE,
  
  -- SEO
  meta_title VARCHAR(255),
  meta_description TEXT,
  
  -- Stats
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  sales_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. CREATOR PAYOUTS & EARNINGS
-- =====================================================

-- Track creator earnings and payouts
CREATE TABLE IF NOT EXISTS creator_payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  
  -- Financial Details
  gross_amount DECIMAL(10,2) NOT NULL, -- Total order amount
  platform_fee_percentage DECIMAL(5,2) DEFAULT 15.00, -- Platform commission %
  platform_fee_amount DECIMAL(10,2) NOT NULL, -- Calculated fee amount
  net_amount DECIMAL(10,2) NOT NULL, -- Amount paid to creator
  
  -- Payout Details
  payout_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  payout_method VARCHAR(50), -- 'bank_transfer', 'paystack', 'wallet'
  payout_reference VARCHAR(255), -- External payout reference
  
  -- Bank Details (if applicable)
  bank_name VARCHAR(100),
  account_number VARCHAR(20),
  account_name VARCHAR(255),
  
  -- Timestamps
  payout_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Creator earnings summary (monthly rollup)
CREATE TABLE IF NOT EXISTS creator_earnings_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  
  -- Earnings Breakdown
  total_gross_earnings DECIMAL(10,2) DEFAULT 0,
  total_platform_fees DECIMAL(10,2) DEFAULT 0,
  total_net_earnings DECIMAL(10,2) DEFAULT 0,
  
  -- Volume Metrics
  total_orders INTEGER DEFAULT 0,
  total_items_sold INTEGER DEFAULT 0,
  
  -- Performance Metrics
  avg_order_value DECIMAL(10,2) DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one record per creator per month
  UNIQUE(creator_id, year, month)
);

-- =====================================================
-- 4. NOTIFICATION PREFERENCES
-- =====================================================

-- User notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Channel Preferences
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  in_app_notifications BOOLEAN DEFAULT true,
  
  -- Notification Type Preferences
  submission_updates BOOLEAN DEFAULT true,
  order_notifications BOOLEAN DEFAULT true,
  payment_notifications BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  weekly_digest BOOLEAN DEFAULT true,
  
  -- Frequency Settings
  digest_frequency VARCHAR(20) DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly', 'never'
  
  -- Contact Information
  phone_number VARCHAR(20),
  preferred_language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'Africa/Lagos',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one record per user
  UNIQUE(user_id)
);

-- =====================================================
-- 5. ADMIN ANALYTICS TABLES
-- =====================================================

-- Platform-wide analytics for admin dashboard
CREATE TABLE IF NOT EXISTS platform_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  
  -- User Metrics
  total_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  creator_signups INTEGER DEFAULT 0,
  
  -- Content Metrics
  new_submissions INTEGER DEFAULT 0,
  approved_submissions INTEGER DEFAULT 0,
  rejected_submissions INTEGER DEFAULT 0,
  published_items INTEGER DEFAULT 0,
  
  -- Financial Metrics
  total_revenue DECIMAL(10,2) DEFAULT 0,
  platform_fees DECIMAL(10,2) DEFAULT 0,
  creator_payouts DECIMAL(10,2) DEFAULT 0,
  
  -- Engagement Metrics
  total_views INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one record per date
  UNIQUE(date)
);

-- Review performance tracking for admins
CREATE TABLE IF NOT EXISTS reviewer_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_id UUID REFERENCES user_profiles(id),
  date DATE NOT NULL,
  
  -- Review Metrics
  reviews_completed INTEGER DEFAULT 0,
  avg_review_time_hours DECIMAL(5,2) DEFAULT 0,
  approval_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Quality Metrics
  avg_quality_score DECIMAL(3,2) DEFAULT 0,
  feedback_quality_rating DECIMAL(3,2) DEFAULT 0, -- Based on creator feedback
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one record per reviewer per date
  UNIQUE(reviewer_id, date)
);

-- =====================================================
-- 6. SEARCH & DISCOVERY TABLES
-- =====================================================

-- Search queries tracking
CREATE TABLE IF NOT EXISTS search_queries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id), -- NULL for anonymous
  query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  clicked_result_id UUID, -- Which result was clicked
  clicked_result_type VARCHAR(50), -- 'artwork', 'book', 'fashion', 'creator'
  session_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trending content tracking
CREATE TABLE IF NOT EXISTS trending_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL,
  content_type VARCHAR(50) NOT NULL, -- 'artwork', 'book', 'fashion', 'creator'
  
  -- Trending Metrics (last 24 hours)
  views_24h INTEGER DEFAULT 0,
  likes_24h INTEGER DEFAULT 0,
  shares_24h INTEGER DEFAULT 0,
  orders_24h INTEGER DEFAULT 0,
  
  -- Trending Score (calculated)
  trending_score DECIMAL(10,2) DEFAULT 0,
  
  -- Metadata
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one record per content per day
  UNIQUE(content_id, content_type, date)
);

-- =====================================================
-- 7. INDEXES FOR PERFORMANCE
-- =====================================================

-- Content Views Indexes
CREATE INDEX IF NOT EXISTS idx_content_views_content ON content_views(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_content_views_viewer ON content_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_content_views_date ON content_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_content_views_session ON content_views(session_id);

-- Content Interactions Indexes
CREATE INDEX IF NOT EXISTS idx_content_interactions_user ON content_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_content_interactions_content ON content_interactions(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_content_interactions_type ON content_interactions(interaction_type);

-- Creator Analytics Indexes
CREATE INDEX IF NOT EXISTS idx_creator_analytics_creator_date ON creator_analytics(creator_id, date);
CREATE INDEX IF NOT EXISTS idx_creator_analytics_date ON creator_analytics(date);

-- Books Indexes
CREATE INDEX IF NOT EXISTS idx_books_creator ON books(creator_id);
CREATE INDEX IF NOT EXISTS idx_books_submission ON books(submission_id);
CREATE INDEX IF NOT EXISTS idx_books_slug ON books(slug);
CREATE INDEX IF NOT EXISTS idx_books_featured ON books(is_featured, is_available);
CREATE INDEX IF NOT EXISTS idx_books_genre ON books(genre);

-- Fashion Items Indexes
CREATE INDEX IF NOT EXISTS idx_fashion_items_creator ON fashion_items(creator_id);
CREATE INDEX IF NOT EXISTS idx_fashion_items_submission ON fashion_items(submission_id);
CREATE INDEX IF NOT EXISTS idx_fashion_items_slug ON fashion_items(slug);
CREATE INDEX IF NOT EXISTS idx_fashion_items_featured ON fashion_items(is_featured, is_available);
CREATE INDEX IF NOT EXISTS idx_fashion_items_category ON fashion_items(category, subcategory);

-- Creator Payouts Indexes
CREATE INDEX IF NOT EXISTS idx_creator_payouts_creator ON creator_payouts(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_payouts_order ON creator_payouts(order_id);
CREATE INDEX IF NOT EXISTS idx_creator_payouts_status ON creator_payouts(payout_status);
CREATE INDEX IF NOT EXISTS idx_creator_payouts_date ON creator_payouts(payout_date);

-- Search Queries Indexes
CREATE INDEX IF NOT EXISTS idx_search_queries_user ON search_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_search_queries_query ON search_queries USING gin(to_tsvector('english', query));
CREATE INDEX IF NOT EXISTS idx_search_queries_date ON search_queries(created_at);

-- Trending Content Indexes
CREATE INDEX IF NOT EXISTS idx_trending_content_score ON trending_content(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_trending_content_type ON trending_content(content_type);
CREATE INDEX IF NOT EXISTS idx_trending_content_date ON trending_content(date);

-- =====================================================
-- 8. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE content_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE fashion_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_earnings_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviewer_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $ 
BEGIN
  -- Content Views - Public read for analytics, users can view their own
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'content_views' AND policyname = 'Public can read content views') THEN
    CREATE POLICY "Public can read content views" ON content_views FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'content_views' AND policyname = 'Anyone can insert content views') THEN
    CREATE POLICY "Anyone can insert content views" ON content_views FOR INSERT WITH CHECK (true);
  END IF;

  -- Content Interactions - Users can manage their own
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'content_interactions' AND policyname = 'Users can manage their own interactions') THEN
    CREATE POLICY "Users can manage their own interactions" ON content_interactions 
    FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- Creator Analytics - Creators can view their own, admins can view all
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'creator_analytics' AND policyname = 'Creators can view their own analytics') THEN
    CREATE POLICY "Creators can view their own analytics" ON creator_analytics 
    FOR SELECT USING (auth.uid() = creator_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'creator_analytics' AND policyname = 'Admins can view all analytics') THEN
    CREATE POLICY "Admins can view all analytics" ON creator_analytics 
    FOR ALL USING (
      EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;

  -- Books - Public read, creators can manage their own
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'books' AND policyname = 'Public can read books') THEN
    CREATE POLICY "Public can read books" ON books FOR SELECT USING (is_available = true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'books' AND policyname = 'Creators can manage their own books') THEN
    CREATE POLICY "Creators can manage their own books" ON books 
    FOR ALL USING (auth.uid() = creator_id);
  END IF;

  -- Fashion Items - Public read, creators can manage their own
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fashion_items' AND policyname = 'Public can read fashion items') THEN
    CREATE POLICY "Public can read fashion items" ON fashion_items FOR SELECT USING (is_available = true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fashion_items' AND policyname = 'Creators can manage their own fashion items') THEN
    CREATE POLICY "Creators can manage their own fashion items" ON fashion_items 
    FOR ALL USING (auth.uid() = creator_id);
  END IF;

  -- Creator Payouts - Creators can view their own, admins can manage all
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'creator_payouts' AND policyname = 'Creators can view their own payouts') THEN
    CREATE POLICY "Creators can view their own payouts" ON creator_payouts 
    FOR SELECT USING (auth.uid() = creator_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'creator_payouts' AND policyname = 'Admins can manage all payouts') THEN
    CREATE POLICY "Admins can manage all payouts" ON creator_payouts 
    FOR ALL USING (
      EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;

  -- Notification Preferences - Users can manage their own
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notification_preferences' AND policyname = 'Users can manage their own preferences') THEN
    CREATE POLICY "Users can manage their own preferences" ON notification_preferences 
    FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- Platform Analytics - Admins only
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'platform_analytics' AND policyname = 'Admins can view platform analytics') THEN
    CREATE POLICY "Admins can view platform analytics" ON platform_analytics 
    FOR ALL USING (
      EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;

  -- Search Queries - Users can view their own, admins can view all
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'search_queries' AND policyname = 'Users can view their own searches') THEN
    CREATE POLICY "Users can view their own searches" ON search_queries 
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'search_queries' AND policyname = 'Anyone can insert search queries') THEN
    CREATE POLICY "Anyone can insert search queries" ON search_queries FOR INSERT WITH CHECK (true);
  END IF;

  -- Trending Content - Public read
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trending_content' AND policyname = 'Public can read trending content') THEN
    CREATE POLICY "Public can read trending content" ON trending_content FOR SELECT USING (true);
  END IF;
END $;

-- =====================================================
-- 9. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update view counts on artworks/books/fashion items
CREATE OR REPLACE FUNCTION update_content_view_count()
RETURNS TRIGGER AS $
BEGIN
  -- Update view count based on content type
  IF NEW.content_type = 'artwork' THEN
    UPDATE artworks SET views_count = views_count + 1 WHERE id = NEW.content_id;
  ELSIF NEW.content_type = 'book' THEN
    UPDATE books SET views_count = views_count + 1 WHERE id = NEW.content_id;
  ELSIF NEW.content_type = 'fashion' THEN
    UPDATE fashion_items SET views_count = views_count + 1 WHERE id = NEW.content_id;
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Trigger to update view counts
CREATE TRIGGER update_view_counts_trigger
  AFTER INSERT ON content_views
  FOR EACH ROW EXECUTE FUNCTION update_content_view_count();

-- Function to update interaction counts
CREATE OR REPLACE FUNCTION update_content_interaction_count()
RETURNS TRIGGER AS $
BEGIN
  -- Update interaction counts based on content type and interaction type
  IF NEW.interaction_type = 'like' THEN
    IF NEW.content_type = 'artwork' THEN
      UPDATE artworks SET likes_count = likes_count + 1 WHERE id = NEW.content_id;
    ELSIF NEW.content_type = 'book' THEN
      UPDATE books SET likes_count = likes_count + 1 WHERE id = NEW.content_id;
    ELSIF NEW.content_type = 'fashion' THEN
      UPDATE fashion_items SET likes_count = likes_count + 1 WHERE id = NEW.content_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Trigger to update interaction counts
CREATE TRIGGER update_interaction_counts_trigger
  AFTER INSERT ON content_interactions
  FOR EACH ROW EXECUTE FUNCTION update_content_interaction_count();

-- Function to create marketplace item from approved submission
CREATE OR REPLACE FUNCTION create_marketplace_item_from_submission()
RETURNS TRIGGER AS $
DECLARE
  submission_data project_submissions%ROWTYPE;
  artist_data artist_submissions%ROWTYPE;
  writer_data writer_submissions%ROWTYPE;
  fashion_data fashion_submissions%ROWTYPE;
  media_files JSONB;
BEGIN
  -- Only process when status changes to 'approved' or 'published'
  IF NEW.status IN ('approved', 'published') AND (OLD.status IS NULL OR OLD.status NOT IN ('approved', 'published')) THEN
    
    -- Get submission data
    SELECT * INTO submission_data FROM project_submissions WHERE id = NEW.id;
    
    -- Get media files
    SELECT COALESCE(json_agg(json_build_object(
      'url', file_url,
      'type', file_type,
      'caption', caption,
      'is_primary', is_primary
    )), '[]'::json) INTO media_files
    FROM submission_media 
    WHERE submission_id = NEW.id;
    
    -- Create marketplace item based on creator type
    IF submission_data.creator_type = 'artist' THEN
      -- Get artist-specific data
      SELECT * INTO artist_data FROM artist_submissions WHERE submission_id = NEW.id;
      
      -- Create artwork
      INSERT INTO artworks (
        creator_id, title, description, category, price, currency,
        is_available, is_featured, thumbnail_url, image_urls, tags,
        dimensions, materials, created_at
      ) VALUES (
        submission_data.creator_id,
        submission_data.title,
        submission_data.description,
        COALESCE(artist_data.medium, 'mixed_media'),
        submission_data.price,
        submission_data.currency,
        true,
        false, -- Admin can manually feature later
        (media_files->0->>'url'),
        ARRAY(SELECT jsonb_array_elements_text(jsonb_path_query_array(media_files, '$[*].url'))),
        CASE WHEN submission_data.cultural_reference IS NOT NULL 
             THEN ARRAY[submission_data.cultural_reference] 
             ELSE ARRAY[]::text[] END,
        artist_data.dimensions,
        array_to_string(artist_data.materials, ', '),
        NOW()
      );
      
    ELSIF submission_data.creator_type = 'writer' THEN
      -- Get writer-specific data
      SELECT * INTO writer_data FROM writer_submissions WHERE submission_id = NEW.id;
      
      -- Create book
      INSERT INTO books (
        creator_id, submission_id, title, description, genre, format,
        word_count, page_count, language, price, currency,
        is_available, is_featured, cover_image_url, preview_url, tags,
        publication_date, created_at
      ) VALUES (
        submission_data.creator_id,
        submission_data.id,
        submission_data.title,
        submission_data.description,
        writer_data.genre,
        writer_data.format,
        writer_data.word_count,
        writer_data.page_count,
        writer_data.language,
        submission_data.price,
        submission_data.currency,
        true,
        false,
        (media_files->0->>'url'),
        writer_data.manuscript_url,
        CASE WHEN submission_data.cultural_reference IS NOT NULL 
             THEN ARRAY[submission_data.cultural_reference] 
             ELSE ARRAY[]::text[] END,
        writer_data.publication_date,
        NOW()
      );
      
    ELSIF submission_data.creator_type = 'fashion_designer' THEN
      -- Get fashion-specific data
      SELECT * INTO fashion_data FROM fashion_submissions WHERE submission_id = NEW.id;
      
      -- Create fashion item
      INSERT INTO fashion_items (
        creator_id, submission_id, title, description, collection_name,
        category, fabric_materials, techniques, sizes_available, color_options,
        price, currency, is_available, is_featured, image_urls, thumbnail_url,
        tags, is_made_to_order, production_time_days, created_at
      ) VALUES (
        submission_data.creator_id,
        submission_data.id,
        submission_data.title,
        submission_data.description,
        fashion_data.collection_name,
        fashion_data.work_type,
        fashion_data.fabric_materials,
        fashion_da