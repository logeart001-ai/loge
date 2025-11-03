-- Fix Admin Dashboard Database Errors
-- Run this to resolve the submission and content moderation table issues

-- 1. Check what submission-related tables exist
SELECT 
  table_name,
  table_schema
FROM information_schema.tables 
WHERE table_name LIKE '%submission%' 
  AND table_schema = 'public'
ORDER BY table_name;

-- 2. Check what moderation-related tables exist  
SELECT 
  table_name,
  table_schema
FROM information_schema.tables 
WHERE table_name LIKE '%report%' OR table_name LIKE '%moderation%'
  AND table_schema = 'public'
ORDER BY table_name;

-- 3. Check foreign key relationships for existing tables
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND (tc.table_name LIKE '%submission%' OR tc.table_name LIKE '%report%')
ORDER BY tc.table_name;

-- 4. Create project_submissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS project_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  creator_type VARCHAR(50) NOT NULL, -- 'artist', 'writer', 'fashion_designer'
  status VARCHAR(50) DEFAULT 'submitted', -- 'submitted', 'under_review', 'approved', 'rejected', 'published'
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  review_date TIMESTAMP WITH TIME ZONE,
  reviewer_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  review_notes TEXT,
  price DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'NGN',
  cultural_reference TEXT,
  tagline TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create submission_reviews table if it doesn't exist
CREATE TABLE IF NOT EXISTS submission_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID REFERENCES project_submissions(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL, -- 'approved', 'rejected', 'needs_revision'
  overall_score INTEGER CHECK (overall_score >= 1 AND overall_score <= 5),
  quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 5),
  originality_score INTEGER CHECK (originality_score >= 1 AND originality_score <= 5),
  cultural_relevance_score INTEGER CHECK (cultural_relevance_score >= 1 AND cultural_relevance_score <= 5),
  feedback_text TEXT,
  suggestions TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create submission_media table if it doesn't exist
CREATE TABLE IF NOT EXISTS submission_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID REFERENCES project_submissions(id) ON DELETE CASCADE,
  file_type VARCHAR(50) NOT NULL, -- 'image', 'video', 'audio', 'document'
  file_category VARCHAR(100), -- 'frame_1', 'frame_2', 'video_explanation', etc.
  file_url TEXT NOT NULL,
  file_name VARCHAR(255),
  file_size BIGINT,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create content_reports table if it doesn't exist
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type VARCHAR(50) NOT NULL, -- 'artwork', 'submission', 'comment', 'user'
  content_id UUID NOT NULL,
  reporter_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  reason VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved', 'dismissed'
  moderator_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  moderation_action VARCHAR(100),
  moderation_reason TEXT,
  moderation_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create type-specific submission tables
CREATE TABLE IF NOT EXISTS artist_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID REFERENCES project_submissions(id) ON DELETE CASCADE,
  medium VARCHAR(100),
  dimensions JSONB,
  materials TEXT[],
  techniques TEXT[],
  year_created INTEGER,
  is_original BOOLEAN DEFAULT true,
  edition_size INTEGER,
  edition_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS writer_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID REFERENCES project_submissions(id) ON DELETE CASCADE,
  genre VARCHAR(100),
  format VARCHAR(50), -- 'novel', 'short_story', 'poetry', 'essay'
  word_count INTEGER,
  page_count INTEGER,
  language VARCHAR(50) DEFAULT 'English',
  isbn VARCHAR(20),
  publication_date DATE,
  year_completed INTEGER,
  manuscript_url TEXT,
  sample_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fashion_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID REFERENCES project_submissions(id) ON DELETE CASCADE,
  collection_name VARCHAR(255),
  work_type VARCHAR(100), -- 'clothing', 'accessories', 'footwear'
  fabric_materials TEXT[],
  techniques TEXT[],
  sizes_available TEXT[],
  color_options TEXT[],
  date_completed DATE,
  year_released INTEGER,
  production_time_days INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Enable RLS on new tables
ALTER TABLE project_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE writer_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fashion_submissions ENABLE ROW LEVEL SECURITY;

-- 10. Create basic RLS policies
DO $$ 
BEGIN
  -- Project submissions policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_submissions' AND policyname = 'Users can view their own submissions') THEN
    CREATE POLICY "Users can view their own submissions" ON project_submissions 
    FOR SELECT USING (auth.uid() = creator_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_submissions' AND policyname = 'Users can create their own submissions') THEN
    CREATE POLICY "Users can create their own submissions" ON project_submissions 
    FOR INSERT WITH CHECK (auth.uid() = creator_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_submissions' AND policyname = 'Admins can manage all submissions') THEN
    CREATE POLICY "Admins can manage all submissions" ON project_submissions 
    FOR ALL USING (
      EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;

  -- Content reports policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'content_reports' AND policyname = 'Users can create reports') THEN
    CREATE POLICY "Users can create reports" ON content_reports 
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'content_reports' AND policyname = 'Admins can manage all reports') THEN
    CREATE POLICY "Admins can manage all reports" ON content_reports 
    FOR ALL USING (
      EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;
END $$;

-- 11. Insert sample submission data for testing
INSERT INTO project_submissions (
  id,
  creator_id,
  title,
  description,
  creator_type,
  status,
  price,
  cultural_reference,
  tagline
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440101',
  '11111111-1111-1111-1111-111111111111', -- Adunni Olorunnisola
  'Heritage Tapestry',
  'A contemporary painting exploring Yoruba cultural motifs through modern artistic expression',
  'artist',
  'submitted',
  150000,
  'Yoruba traditional art and symbolism',
  'Where tradition meets contemporary expression'
),
(
  '550e8400-e29b-41d4-a716-446655440102',
  '22222222-2222-2222-2222-222222222222', -- Kwame Asante
  'Resilience Sculpture Series',
  'Bronze sculptures representing the strength and perseverance of African communities',
  'artist',
  'under_review',
  200000,
  'Akan symbols and philosophy',
  'Strength forged in bronze'
),
(
  '550e8400-e29b-41d4-a716-446655440103',
  '33333333-3333-3333-3333-333333333333', -- Amara Diallo
  'Modern Kente Collection',
  'Contemporary fashion pieces inspired by traditional Kente cloth patterns',
  'fashion_designer',
  'approved',
  75000,
  'Kente weaving traditions',
  'Tradition woven into modernity'
)
ON CONFLICT (id) DO NOTHING;

-- 12. Verify the setup
SELECT 
  'Setup Complete!' as status,
  COUNT(*) as sample_submissions
FROM project_submissions;