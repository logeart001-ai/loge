-- Fix Foreign Key Relationships for Admin Dashboard
-- This script fixes the missing foreign key relationships causing PGRST200 errors

-- 1. First, let's check if the tables exist
DO $$
BEGIN
    -- Check if project_submissions table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_submissions' AND table_schema = 'public') THEN
        RAISE NOTICE 'Creating project_submissions table...';
        
        CREATE TABLE project_submissions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            creator_id UUID NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            creator_type VARCHAR(50) NOT NULL,
            status VARCHAR(50) DEFAULT 'submitted',
            submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            review_date TIMESTAMP WITH TIME ZONE,
            reviewer_id UUID,
            review_notes TEXT,
            price DECIMAL(10,2),
            currency VARCHAR(3) DEFAULT 'NGN',
            cultural_reference TEXT,
            tagline TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE project_submissions ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Check if content_reports table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_reports' AND table_schema = 'public') THEN
        RAISE NOTICE 'Creating content_reports table...';
        
        CREATE TABLE content_reports (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            content_type VARCHAR(50) NOT NULL,
            content_id UUID NOT NULL,
            reporter_id UUID NOT NULL,
            reason VARCHAR(100) NOT NULL,
            description TEXT,
            status VARCHAR(50) DEFAULT 'pending',
            moderator_id UUID,
            moderation_action VARCHAR(100),
            moderation_reason TEXT,
            moderation_notes TEXT,
            reviewed_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 2. Drop existing foreign key constraints if they exist (to recreate them properly)
DO $$
BEGIN
    -- Drop foreign keys for project_submissions if they exist
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'project_submissions_creator_id_fkey' 
               AND table_name = 'project_submissions') THEN
        ALTER TABLE project_submissions DROP CONSTRAINT project_submissions_creator_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'project_submissions_reviewer_id_fkey' 
               AND table_name = 'project_submissions') THEN
        ALTER TABLE project_submissions DROP CONSTRAINT project_submissions_reviewer_id_fkey;
    END IF;

    -- Drop foreign keys for content_reports if they exist
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'content_reports_reporter_id_fkey' 
               AND table_name = 'content_reports') THEN
        ALTER TABLE content_reports DROP CONSTRAINT content_reports_reporter_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'content_reports_moderator_id_fkey' 
               AND table_name = 'content_reports') THEN
        ALTER TABLE content_reports DROP CONSTRAINT content_reports_moderator_id_fkey;
    END IF;
END $$;

-- 3. Add the foreign key constraints properly
ALTER TABLE project_submissions 
ADD CONSTRAINT project_submissions_creator_id_fkey 
FOREIGN KEY (creator_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE project_submissions 
ADD CONSTRAINT project_submissions_reviewer_id_fkey 
FOREIGN KEY (reviewer_id) REFERENCES user_profiles(id) ON DELETE SET NULL;

ALTER TABLE content_reports 
ADD CONSTRAINT content_reports_reporter_id_fkey 
FOREIGN KEY (reporter_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE content_reports 
ADD CONSTRAINT content_reports_moderator_id_fkey 
FOREIGN KEY (moderator_id) REFERENCES user_profiles(id) ON DELETE SET NULL;

-- 4. Create RLS policies for project_submissions
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view their own submissions" ON project_submissions;
    DROP POLICY IF EXISTS "Users can create their own submissions" ON project_submissions;
    DROP POLICY IF EXISTS "Admins can manage all submissions" ON project_submissions;
    
    -- Create new policies
    CREATE POLICY "Users can view their own submissions" ON project_submissions 
    FOR SELECT USING (auth.uid() = creator_id);
    
    CREATE POLICY "Users can create their own submissions" ON project_submissions 
    FOR INSERT WITH CHECK (auth.uid() = creator_id);
    
    CREATE POLICY "Admins can manage all submissions" ON project_submissions 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    );
END $$;

-- 5. Create RLS policies for content_reports
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can create reports" ON content_reports;
    DROP POLICY IF EXISTS "Users can view their own reports" ON content_reports;
    DROP POLICY IF EXISTS "Admins can manage all reports" ON content_reports;
    
    -- Create new policies
    CREATE POLICY "Users can create reports" ON content_reports 
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);
    
    CREATE POLICY "Users can view their own reports" ON content_reports 
    FOR SELECT USING (auth.uid() = reporter_id);
    
    CREATE POLICY "Admins can manage all reports" ON content_reports 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    );
END $$;

-- 6. Insert some sample data for testing
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
    '8b396cf6-6110-45a6-a41a-d0d6fa2ee025', -- Admin user as creator for testing
    'Test Heritage Project',
    'A test submission to verify the admin dashboard functionality',
    'artist',
    'submitted',
    50000,
    'Test cultural reference',
    'Test tagline for admin dashboard'
)
ON CONFLICT (id) DO NOTHING;

-- First check if content_reports has data, if not, insert sample data
DO $$
BEGIN
    -- Only insert if the table is empty to avoid enum errors
    IF (SELECT COUNT(*) FROM content_reports) = 0 THEN
        INSERT INTO content_reports (
            id,
            content_type,
            content_id,
            reporter_id,
            reason,
            description,
            status
        ) VALUES 
        (
            '660e8400-e29b-41d4-a716-446655440101',
            'artwork',
            '550e8400-e29b-41d4-a716-446655440101',
            '8b396cf6-6110-45a6-a41a-d0d6fa2ee025', -- Admin user as reporter for testing
            'spam', -- Use a simple string value that should work
            'Test report to verify the content moderation functionality',
            'pending'
        );
    END IF;
EXCEPTION 
    WHEN OTHERS THEN
        -- If there's still an enum error, just skip the insert
        RAISE NOTICE 'Skipping content_reports sample data due to enum constraints';
END $$;

-- 7. Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- 8. Verify the setup
SELECT 
    'Foreign Key Relationships Fixed!' as status,
    (SELECT COUNT(*) FROM project_submissions) as sample_submissions,
    (SELECT COUNT(*) FROM content_reports) as sample_reports;

-- 9. Show the foreign key relationships
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('project_submissions', 'content_reports')
ORDER BY tc.table_name, kcu.column_name;