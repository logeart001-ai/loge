-- =====================================================
-- Notifications Table Setup - Flexible Version
-- Date: October 10, 2025
-- Purpose: Set up notifications with proper schema detection
-- =====================================================

-- First, check if we need to alter the existing notifications table
DO $$
BEGIN
    -- Check if notifications table exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
        
        -- Check if user_id column exists
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'notifications' 
            AND column_name = 'user_id'
        ) THEN
            -- Add user_id column if it doesn't exist
            ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE;
            
            -- If recipient_email exists, try to populate user_id from it
            IF EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'notifications' 
                AND column_name = 'recipient_email'
            ) THEN
                -- Update user_id based on recipient_email
                UPDATE notifications n
                SET user_id = up.id
                FROM user_profiles up
                WHERE n.recipient_email = up.email
                AND n.user_id IS NULL;
            END IF;
        END IF;

        -- Ensure required columns exist
        ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'general';
        ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Notification';
        ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message TEXT DEFAULT '';
        ALTER TABLE notifications ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::JSONB;
        ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
        
    ELSE
        -- Create new table if it doesn't exist
        CREATE TABLE notifications (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
            type TEXT NOT NULL DEFAULT 'general',
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            data JSONB DEFAULT '{}'::JSONB,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "users_view_own_notifications" ON notifications;
DROP POLICY IF EXISTS "users_update_own_notifications" ON notifications;
DROP POLICY IF EXISTS "authenticated_users_create_notifications" ON notifications;

-- Users can view their own notifications
CREATE POLICY "users_view_own_notifications" ON notifications
    FOR SELECT
    TO authenticated
    USING (
        CASE 
            WHEN user_id IS NOT NULL THEN auth.uid() = user_id
            ELSE false
        END
    );

-- Users can update their own notifications (mark as read)
CREATE POLICY "users_update_own_notifications" ON notifications
    FOR UPDATE
    TO authenticated
    USING (
        CASE 
            WHEN user_id IS NOT NULL THEN auth.uid() = user_id
            ELSE false
        END
    )
    WITH CHECK (
        CASE 
            WHEN user_id IS NOT NULL THEN auth.uid() = user_id
            ELSE false
        END
    );

-- Allow authenticated users to insert notifications
CREATE POLICY "authenticated_users_create_notifications" ON notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read) WHERE NOT is_read;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS create_notification(UUID, TEXT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS mark_notification_read(UUID);
DROP FUNCTION IF EXISTS mark_all_notifications_read();

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_data JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, type, title, message, data, is_read, created_at)
    VALUES (p_user_id, p_type, p_title, p_message, p_data, false, NOW())
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_notification(UUID, TEXT, TEXT, TEXT, JSONB) TO authenticated;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE notifications
    SET is_read = true
    WHERE id = notification_id
      AND user_id = auth.uid();
    
    RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION mark_notification_read(UUID) TO authenticated;

-- Function to mark all notifications as read for current user
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    rows_updated INTEGER;
BEGIN
    UPDATE notifications
    SET is_read = true
    WHERE user_id = auth.uid()
      AND is_read = false;
    
    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    RETURN rows_updated;
END;
$$;

GRANT EXECUTE ON FUNCTION mark_all_notifications_read() TO authenticated;

-- Add helpful comments
COMMENT ON TABLE notifications IS 'User notifications for orders, events, and system messages';
COMMENT ON COLUMN notifications.user_id IS 'Reference to user_profiles table';
COMMENT ON COLUMN notifications.type IS 'Notification type: order, follow, like, comment, event, etc.';
COMMENT ON COLUMN notifications.data IS 'Additional JSON data for the notification';
COMMENT ON FUNCTION create_notification(UUID, TEXT, TEXT, TEXT, JSONB) IS 'Helper function to create notifications for users';
COMMENT ON FUNCTION mark_notification_read(UUID) IS 'Mark a single notification as read';
COMMENT ON FUNCTION mark_all_notifications_read() IS 'Mark all unread notifications as read for current user';

-- Verification queries
SELECT 'Table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'notifications'
ORDER BY ordinal_position;

SELECT 'RLS Policies:' as info;
SELECT 
    tablename,
    policyname,
    cmd as "Command"
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY policyname;

SELECT 'Functions created:' as info;
SELECT 
    proname as "Function Name"
FROM pg_proc 
WHERE proname LIKE '%notification%'
  AND pronamespace = 'public'::regnamespace;
