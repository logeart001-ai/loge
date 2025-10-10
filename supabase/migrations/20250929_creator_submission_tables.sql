-- Creator Submission System Tables
-- Supporting Artists, Writers & Authors, Fashion & Textile Designers

-- 1. Creator Profiles (Extended from user_profiles)
-- Add creator-specific fields to existing user_profiles table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS art_name VARCHAR(255); -- Artist alias
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS pen_name VARCHAR(255); -- Author pen name  
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS brand_name VARCHAR(255); -- Fashion brand name
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS artist_statement TEXT; -- 300-500 words statement
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS portfolio_links JSONB DEFAULT '{}'; -- Portfolio URLs
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS whatsapp_phone VARCHAR(20); -- WhatsApp number
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS billing_address JSONB; -- Billing/shipping address
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS previous_works TEXT[]; -- Past collections/works
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS submission_status VARCHAR(50) DEFAULT 'pending'; -- pending, approved, rejected
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- 2. Project Submissions (Main submission table)
CREATE TABLE IF NOT EXISTS project_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  creator_type VARCHAR(50) NOT NULL, -- 'artist', 'writer', 'fashion_designer'
  
  -- Basic Project Info
  title VARCHAR(255) NOT NULL,
  theme VARCHAR(255), -- Collection theme
  description TEXT, -- Project description
  cultural_reference TEXT, -- African heritage/inspiration
  tagline VARCHAR(500), -- Quote/tagline
  
  -- Submission Status
  status VARCHAR(50) DEFAULT 'draft', -- draft, submitted, under_review, approved, rejected, published
  submission_date TIMESTAMP WITH TIME ZONE,
  review_date TIMESTAMP WITH TIME ZONE,
  published_date TIMESTAMP WITH TIME ZONE,
  reviewer_id UUID REFERENCES user_profiles(id),
  review_notes TEXT,
  
  -- Media Files
  images JSONB DEFAULT '[]', -- Array of image URLs
  videos JSONB DEFAULT '[]', -- Array of video URLs
  audio_files JSONB DEFAULT '[]', -- Array of audio URLs (for writers)
  documents JSONB DEFAULT '[]', -- Array of document URLs (manuscripts, etc.)
  
  -- Pricing & Availability
  price DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'NGN',
  availability_status VARCHAR(50), -- for_sale, auction, showcase_only, pre_order, made_to_order
  quantity_available INTEGER DEFAULT 1,
  
  -- Agreements
  original_work_confirmed BOOLEAN DEFAULT false,
  terms_agreed BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Artist-specific details
CREATE TABLE IF NOT EXISTS artist_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID REFERENCES project_submissions(id) ON DELETE CASCADE,
  
  -- Artwork Details
  medium VARCHAR(255), -- Oil on canvas, Digital collage, etc.
  dimensions VARCHAR(100), -- Size/dimensions
  edition_number INTEGER, -- For limited editions
  edition_total INTEGER, -- Total in edition
  date_created DATE,
  year_created INTEGER,
  
  -- Materials & Techniques
  materials TEXT[],
  techniques TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Writer/Author-specific details
CREATE TABLE IF NOT EXISTS writer_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID REFERENCES project_submissions(id) ON DELETE CASCADE,
  
  -- Book/Manuscript Details
  genre VARCHAR(100), -- Fiction, Non-fiction, Poetry, etc.
  format VARCHAR(50), -- Book, Short Story, Poetry Collection, etc.
  word_count INTEGER,
  page_count INTEGER,
  language VARCHAR(50) DEFAULT 'English',
  isbn VARCHAR(20),
  publication_date DATE,
  year_completed INTEGER,
  
  -- Content
  manuscript_url TEXT, -- PDF/Word document URL
  sample_text TEXT, -- Excerpt for preview
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Fashion Designer-specific details
CREATE TABLE IF NOT EXISTS fashion_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID REFERENCES project_submissions(id) ON DELETE CASCADE,
  
  -- Fashion Details
  collection_name VARCHAR(255),
  work_type VARCHAR(100), -- Apparel, Textile, Accessories, etc.
  fabric_materials TEXT[], -- cotton, silk, Ankara, etc.
  techniques TEXT[], -- handwoven, hand-dyed, embroidery, etc.
  
  -- Sizing & Availability
  sizes_available TEXT[], -- S, M, L, custom, one-size
  color_options TEXT[],
  
  -- Production
  date_completed DATE,
  year_released INTEGER,
  production_time_days INTEGER, -- For made-to-order items
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Submission Media Files (Detailed file management)
CREATE TABLE IF NOT EXISTS submission_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID REFERENCES project_submissions(id) ON DELETE CASCADE,
  
  -- File Details
  file_type VARCHAR(50), -- image, video, audio, document
  file_category VARCHAR(50), -- frame_1, frame_2, frame_3, cover, manuscript, etc.
  file_url TEXT NOT NULL,
  file_name VARCHAR(255),
  file_size INTEGER, -- in bytes
  mime_type VARCHAR(100),
  
  -- Metadata
  caption TEXT,
  alt_text TEXT,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Submission Reviews & Feedback
CREATE TABLE IF NOT EXISTS submission_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID REFERENCES project_submissions(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES user_profiles(id),
  
  -- Review Details
  status VARCHAR(50), -- approved, rejected, needs_revision
  overall_score INTEGER CHECK (overall_score >= 1 AND overall_score <= 5),
  
  -- Detailed Feedback
  quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 5),
  originality_score INTEGER CHECK (originality_score >= 1 AND originality_score <= 5),
  cultural_relevance_score INTEGER CHECK (cultural_relevance_score >= 1 AND cultural_relevance_score <= 5),
  
  -- Comments
  feedback_text TEXT,
  suggestions TEXT,
  rejection_reason TEXT,
  
  -- Review Process
  review_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Creator Onboarding Progress
CREATE TABLE IF NOT EXISTS creator_onboarding (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE,
  
  -- Onboarding Steps
  profile_completed BOOLEAN DEFAULT false,
  portfolio_added BOOLEAN DEFAULT false,
  first_submission_created BOOLEAN DEFAULT false,
  first_submission_approved BOOLEAN DEFAULT false,
  
  -- Progress Tracking
  current_step VARCHAR(100),
  completion_percentage INTEGER DEFAULT 0,
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_project_submissions_creator_id ON project_submissions(creator_id);
CREATE INDEX IF NOT EXISTS idx_project_submissions_status ON project_submissions(status);
CREATE INDEX IF NOT EXISTS idx_project_submissions_creator_type ON project_submissions(creator_type);
CREATE INDEX IF NOT EXISTS idx_project_submissions_published_date ON project_submissions(published_date);
CREATE INDEX IF NOT EXISTS idx_artist_submissions_submission_id ON artist_submissions(submission_id);
CREATE INDEX IF NOT EXISTS idx_writer_submissions_submission_id ON writer_submissions(submission_id);
CREATE INDEX IF NOT EXISTS idx_fashion_submissions_submission_id ON fashion_submissions(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_media_submission_id ON submission_media(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_media_file_type ON submission_media(file_type);
CREATE INDEX IF NOT EXISTS idx_submission_reviews_submission_id ON submission_reviews(submission_id);
CREATE INDEX IF NOT EXISTS idx_creator_onboarding_creator_id ON creator_onboarding(creator_id);

-- Enable RLS on all new tables
ALTER TABLE project_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE writer_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fashion_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_onboarding ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Creator Submissions
DO $$ 
BEGIN
  -- Project Submissions Policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_submissions' AND policyname = 'Creators can manage their own submissions') THEN
    CREATE POLICY "Creators can manage their own submissions" ON project_submissions 
    FOR ALL USING (auth.uid() = creator_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_submissions' AND policyname = 'Published submissions are publicly viewable') THEN
    CREATE POLICY "Published submissions are publicly viewable" ON project_submissions 
    FOR SELECT USING (status = 'published');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_submissions' AND policyname = 'Admins can view all submissions') THEN
    CREATE POLICY "Admins can view all submissions" ON project_submissions 
    FOR ALL USING (
      EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;

  -- Artist Submissions Policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'artist_submissions' AND policyname = 'Creators can manage their artist submissions') THEN
    CREATE POLICY "Creators can manage their artist submissions" ON artist_submissions 
    FOR ALL USING (
      EXISTS (SELECT 1 FROM project_submissions WHERE id = artist_submissions.submission_id AND creator_id = auth.uid())
    );
  END IF;

  -- Writer Submissions Policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'writer_submissions' AND policyname = 'Creators can manage their writer submissions') THEN
    CREATE POLICY "Creators can manage their writer submissions" ON writer_submissions 
    FOR ALL USING (
      EXISTS (SELECT 1 FROM project_submissions WHERE id = writer_submissions.submission_id AND creator_id = auth.uid())
    );
  END IF;

  -- Fashion Submissions Policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fashion_submissions' AND policyname = 'Creators can manage their fashion submissions') THEN
    CREATE POLICY "Creators can manage their fashion submissions" ON fashion_submissions 
    FOR ALL USING (
      EXISTS (SELECT 1 FROM project_submissions WHERE id = fashion_submissions.submission_id AND creator_id = auth.uid())
    );
  END IF;

  -- Submission Media Policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'submission_media' AND policyname = 'Creators can manage their submission media') THEN
    CREATE POLICY "Creators can manage their submission media" ON submission_media 
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM project_submissions 
        WHERE id = submission_media.submission_id AND creator_id = auth.uid()
      )
    );
  END IF;

  -- Submission Reviews Policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'submission_reviews' AND policyname = 'Creators can view reviews of their submissions') THEN
    CREATE POLICY "Creators can view reviews of their submissions" ON submission_reviews 
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM project_submissions 
        WHERE id = submission_reviews.submission_id AND creator_id = auth.uid()
      )
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'submission_reviews' AND policyname = 'Admins can manage all reviews') THEN
    CREATE POLICY "Admins can manage all reviews" ON submission_reviews 
    FOR ALL USING (
      EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;

  -- Creator Onboarding Policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'creator_onboarding' AND policyname = 'Creators can manage their own onboarding') THEN
    CREATE POLICY "Creators can manage their own onboarding" ON creator_onboarding 
    FOR ALL USING (auth.uid() = creator_id);
  END IF;
END $$;

-- Functions for automatic triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_project_submissions_updated_at BEFORE UPDATE ON project_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create onboarding record when user becomes creator
CREATE OR REPLACE FUNCTION create_creator_onboarding()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create onboarding if user role is creator and onboarding doesn't exist
  IF NEW.role = 'creator' AND (OLD.role IS NULL OR OLD.role != 'creator') THEN
    INSERT INTO creator_onboarding (creator_id, current_step)
    VALUES (NEW.id, 'profile_setup')
    ON CONFLICT (creator_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-create onboarding when user becomes creator
DROP TRIGGER IF EXISTS create_onboarding_on_creator_role ON user_profiles;
CREATE TRIGGER create_onboarding_on_creator_role
  AFTER UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION create_creator_onboarding();

-- Function to update onboarding progress
CREATE OR REPLACE FUNCTION update_onboarding_progress()
RETURNS TRIGGER AS $$
DECLARE
  creator_uuid UUID;
  total_steps INTEGER := 4;
  completed_steps INTEGER := 0;
BEGIN
  -- Get creator_id from the submission
  IF TG_TABLE_NAME = 'project_submissions' THEN
    creator_uuid := NEW.creator_id;
  ELSE
    creator_uuid := NEW.id;
  END IF;

  -- Count completed steps
  SELECT 
    (CASE WHEN profile_completed THEN 1 ELSE 0 END) +
    (CASE WHEN portfolio_added THEN 1 ELSE 0 END) +
    (CASE WHEN first_submission_created THEN 1 ELSE 0 END) +
    (CASE WHEN first_submission_approved THEN 1 ELSE 0 END)
  INTO completed_steps
  FROM creator_onboarding 
  WHERE creator_id = creator_uuid;

  -- Update onboarding progress
  UPDATE creator_onboarding 
  SET 
    completion_percentage = (completed_steps * 100 / total_steps),
    last_activity = NOW(),
    completed_at = CASE WHEN completed_steps = total_steps THEN NOW() ELSE NULL END
  WHERE creator_id = creator_uuid;

  RETURN NEW;
END;
$$ language 'plpgsql';

-- Verification query to show new tables
SELECT 'NEW CREATOR SUBMISSION TABLES CREATED:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'project_submissions', 
  'artist_submissions', 
  'writer_submissions', 
  'fashion_submissions', 
  'submission_media', 
  'submission_reviews', 
  'creator_onboarding'
)
ORDER BY table_name;