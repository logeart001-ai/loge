

BEGIN;

-- Create project_submissions table
CREATE TABLE IF NOT EXISTS project_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  theme VARCHAR(255),
  description TEXT NOT NULL,
  cultural_reference TEXT,
  tagline VARCHAR(500),
  status VARCHAR(50) DEFAULT 'submitted',
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  review_date TIMESTAMP WITH TIME ZONE,
  published_date TIMESTAMP WITH TIME ZONE,
  reviewer_id UUID REFERENCES auth.users(id),
  review_notes TEXT,
  images JSONB DEFAULT '[]',
  videos JSONB DEFAULT '[]',
  audio_files JSONB DEFAULT '[]',
  documents JSONB DEFAULT '[]',
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NGN',
  availability_status VARCHAR(50) DEFAULT 'for_sale',
  quantity_available INTEGER DEFAULT 1,
  original_work_confirmed BOOLEAN DEFAULT false,
  terms_agreed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create artist_submissions table
CREATE TABLE IF NOT EXISTS artist_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID REFERENCES project_submissions(id) ON DELETE CASCADE,
  medium VARCHAR(255) NOT NULL,
  dimensions VARCHAR(100) NOT NULL,
  edition_number INTEGER,
  edition_total INTEGER,
  date_created DATE,
  year_created INTEGER,
  materials TEXT[],
  techniques TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create writer_submissions table
CREATE TABLE IF NOT EXISTS writer_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID REFERENCES project_submissions(id) ON DELETE CASCADE,
  genre VARCHAR(100) NOT NULL,
  format VARCHAR(50) NOT NULL,
  word_count INTEGER NOT NULL,
  page_count INTEGER,
  language VARCHAR(50) DEFAULT 'English',
  isbn VARCHAR(20),
  publication_date DATE,
  year_completed INTEGER,
  manuscript_url TEXT,
  sample_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fashion_submissions table
CREATE TABLE IF NOT EXISTS fashion_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID REFERENCES project_submissions(id) ON DELETE CASCADE,
  collection_name VARCHAR(255) NOT NULL,
  work_type VARCHAR(100) NOT NULL,
  fabric_materials TEXT[] NOT NULL,
  techniques TEXT[],
  sizes_available TEXT[],
  color_options TEXT[],
  date_completed DATE,
  year_released INTEGER,
  production_time_days INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create submission_media table
CREATE TABLE IF NOT EXISTS submission_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID REFERENCES project_submissions(id) ON DELETE CASCADE,
  file_type VARCHAR(50),
  file_category VARCHAR(50),
  file_url TEXT NOT NULL,
  file_name VARCHAR(255),
  file_size INTEGER,
  mime_type VARCHAR(100),
  caption TEXT,
  alt_text TEXT,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE project_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE writer_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fashion_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_media ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Creators can manage their own submissions" ON project_submissions;
DROP POLICY IF EXISTS "Published submissions are publicly viewable" ON project_submissions;
DROP POLICY IF EXISTS "Creators can manage their artist submissions" ON artist_submissions;
DROP POLICY IF EXISTS "Creators can manage their writer submissions" ON writer_submissions;
DROP POLICY IF EXISTS "Creators can manage their fashion submissions" ON fashion_submissions;
DROP POLICY IF EXISTS "Creators can manage their submission media" ON submission_media;

-- Create RLS policies
CREATE POLICY "Creators can manage their own submissions" 
ON project_submissions 
FOR ALL 
USING (auth.uid() = creator_id);

CREATE POLICY "Published submissions are publicly viewable" 
ON project_submissions 
FOR SELECT 
USING (status = 'published');

CREATE POLICY "Creators can manage their artist submissions" 
ON artist_submissions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM project_submissions 
    WHERE id = artist_submissions.submission_id 
    AND creator_id = auth.uid()
  )
);

CREATE POLICY "Creators can manage their writer submissions" 
ON writer_submissions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM project_submissions 
    WHERE id = writer_submissions.submission_id 
    AND creator_id = auth.uid()
  )
);

CREATE POLICY "Creators can manage their fashion submissions" 
ON fashion_submissions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM project_submissions 
    WHERE id = fashion_submissions.submission_id 
    AND creator_id = auth.uid()
  )
);

CREATE POLICY "Creators can manage their submission media" 
ON submission_media 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM project_submissions 
    WHERE id = submission_media.submission_id 
    AND creator_id = auth.uid()
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_project_submissions_creator_id ON project_submissions(creator_id);
CREATE INDEX IF NOT EXISTS idx_project_submissions_status ON project_submissions(status);
CREATE INDEX IF NOT EXISTS idx_project_submissions_creator_type ON project_submissions(creator_type);
CREATE INDEX IF NOT EXISTS idx_artist_submissions_submission_id ON artist_submissions(submission_id);
CREATE INDEX IF NOT EXISTS idx_writer_submissions_submission_id ON writer_submissions(submission_id);
CREATE INDEX IF NOT EXISTS idx_fashion_submissions_submission_id ON fashion_submissions(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_media_submission_id ON submission_media(submission_id);

COMMIT;

-- Verification
SELECT 
  '✅ Setup Complete!' as status,
  COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'project_submissions',
  'artist_submissions',
  'writer_submissions',
  'fashion_submissions',
  'submission_media'
);

-- Show created tables
SELECT 
  table_name,
  '✅ Created' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'project_submissions',
  'artist_submissions',
  'writer_submissions',
  'fashion_submissions',
  'submission_media'
)
ORDER BY table_name;

-- Show RLS policies
SELECT 
  tablename,
  policyname,
  '✅ Active' as status
FROM pg_policies 
WHERE tablename IN (
  'project_submissions',
  'artist_submissions',
  'writer_submissions',
  'fashion_submissions',
  'submission_media'
)
ORDER BY tablename, policyname;
