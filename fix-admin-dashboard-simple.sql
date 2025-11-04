-- Simple Admin Dashboard Fix - Avoids Enum Issues
-- This script focuses only on fixing the foreign key relationships

-- 1. Ensure tables exist with proper structure
CREATE TABLE IF NOT EXISTS project_submissions (
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

CREATE TABLE IF NOT EXISTS content_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_type VARCHAR(50) NOT NULL,
    content_id UUID NOT NULL,
    reporter_id UUID NOT NULL,
    reason VARCHAR(100) NOT NULL, -- Use VARCHAR instead of enum to avoid issues
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

-- 2. Drop and recreate foreign key constraints to ensure they're properly configured
DO $$
BEGIN
    -- Drop existing constraints if they exist
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

-- 3. Add foreign key constraints
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

-- 4. Enable RLS
ALTER TABLE project_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view their own submissions" ON project_submissions;
    DROP POLICY IF EXISTS "Users can create their own submissions" ON project_submissions;
    DROP POLICY IF EXISTS "Admins can manage all submissions" ON project_submissions;
    DROP POLICY IF EXISTS "Users can create reports" ON content_reports;
    DROP POLICY IF EXISTS "Users can view their own reports" ON content_reports;
    DROP POLICY IF EXISTS "Admins can manage all reports" ON content_reports;
    
    -- Create policies for project_submissions
    CREATE POLICY "Users can view their own submissions" ON project_submissions 
    FOR SELECT USING (auth.uid() = creator_id);
    
    CREATE POLICY "Users can create their own submissions" ON project_submissions 
    FOR INSERT WITH CHECK (auth.uid() = creator_id);
    
    CREATE POLICY "Admins can manage all submissions" ON project_submissions 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    );
    
    -- Create policies for content_reports
    CREATE POLICY "Users can create reports" ON content_reports 
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);
    
    CREATE POLICY "Users can view their own reports" ON content_reports 
    FOR SELECT USING (auth.uid() = reporter_id);
    
    CREATE POLICY "Admins can manage all reports" ON content_reports 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    );
END $$;

-- 6. Add minimal sample data only if tables are empty
DO $$
BEGIN
    -- Add sample submission if none exist
    IF (SELECT COUNT(*) FROM project_submissions) = 0 THEN
        INSERT INTO project_submissions (
            creator_id,
            title,
            description,
            creator_type,
            status,
            price
        ) VALUES (
            '8b396cf6-6110-45a6-a41a-d0d6fa2ee025', -- Admin user
            'Test Project Submission',
            'Sample submission for testing admin dashboard',
            'artist',
            'submitted',
            50000
        );
    END IF;
    
    -- Add sample report if none exist (using simple string for reason)
    IF (SELECT COUNT(*) FROM content_reports) = 0 THEN
        INSERT INTO content_reports (
            content_type,
            content_id,
            reporter_id,
            reason,
            description,
            status
        ) VALUES (
            'artwork',
            gen_random_uuid(),
            '8b396cf6-6110-45a6-a41a-d0d6fa2ee025', -- Admin user
            'test_reason',
            'Sample report for testing admin dashboard',
            'pending'
        );
    END IF;
EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE 'Sample data insertion skipped due to constraints';
END $$;

-- 7. Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- 8. Verify setup
SELECT 
    'Setup Complete!' as status,
    (SELECT COUNT(*) FROM project_submissions) as submissions_count,
    (SELECT COUNT(*) FROM content_reports) as reports_count,
    NOW() as completed_at;