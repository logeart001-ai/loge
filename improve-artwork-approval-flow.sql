-- Improve Artwork Approval Flow
-- Add missing fields and create notifications system

-- 1. Add approval tracking fields to artworks table
ALTER TABLE artworks 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS revision_requested BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS revision_notes TEXT;

-- 2. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'artwork_approved', 'artwork_rejected', 'artwork_uploaded', 'revision_requested'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add missing columns to notifications if table already exists
DO $$
BEGIN
  -- Add read column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'read'
  ) THEN
    ALTER TABLE notifications ADD COLUMN read BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Add link column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'link'
  ) THEN
    ALTER TABLE notifications ADD COLUMN link TEXT;
  END IF;
  
  -- Add artwork_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'artwork_id'
  ) THEN
    ALTER TABLE notifications ADD COLUMN artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE;
  END IF;
  
  -- Add actor_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'actor_id'
  ) THEN
    ALTER TABLE notifications ADD COLUMN actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_artwork_id ON notifications(artwork_id);

-- 3. Create approval history table for audit trail
CREATE TABLE IF NOT EXISTS artwork_approval_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'approved', 'rejected', 'revision_requested'
  previous_status TEXT,
  new_status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for approval history
CREATE INDEX IF NOT EXISTS idx_approval_history_artwork_id ON artwork_approval_history(artwork_id);
CREATE INDEX IF NOT EXISTS idx_approval_history_reviewer_id ON artwork_approval_history(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_approval_history_created_at ON artwork_approval_history(created_at DESC);

-- 4. Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- System can insert notifications
CREATE POLICY "System can insert notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
  ON notifications
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 5. Enable RLS on approval history
ALTER TABLE artwork_approval_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for approval history
-- Creators can view history of their own artworks
CREATE POLICY "Creators can view their artwork history"
  ON artwork_approval_history
  FOR SELECT
  TO authenticated
  USING (
    artwork_id IN (
      SELECT id FROM artworks WHERE creator_id = auth.uid()
    )
  );

-- Admins can view all history
CREATE POLICY "Admins can view all history"
  ON artwork_approval_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- System can insert history records
CREATE POLICY "System can insert history"
  ON artwork_approval_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 6. Create function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER
  INTO unread_count
  FROM notifications
  WHERE user_id = user_uuid AND read = FALSE;
  
  RETURN unread_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_unread_notification_count(UUID) TO authenticated;

-- 7. Create function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read(user_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE notifications
  SET read = TRUE
  WHERE user_id = user_uuid AND read = FALSE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION mark_all_notifications_read(UUID) TO authenticated;

-- 8. Create function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT DEFAULT NULL,
  p_artwork_id UUID DEFAULT NULL,
  p_actor_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    link,
    artwork_id,
    actor_id
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_link,
    p_artwork_id,
    p_actor_id
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_notification(UUID, TEXT, TEXT, TEXT, TEXT, UUID, UUID) TO authenticated;

-- 9. Create trigger to log approval actions
CREATE OR REPLACE FUNCTION log_artwork_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only log if approval_status changed
  IF OLD.approval_status IS DISTINCT FROM NEW.approval_status THEN
    INSERT INTO artwork_approval_history (
      artwork_id,
      reviewer_id,
      action,
      previous_status,
      new_status,
      notes
    ) VALUES (
      NEW.id,
      NEW.approved_by,
      NEW.approval_status,
      OLD.approval_status,
      NEW.approval_status,
      NEW.review_notes
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS artwork_approval_trigger ON artworks;
CREATE TRIGGER artwork_approval_trigger
  AFTER UPDATE ON artworks
  FOR EACH ROW
  EXECUTE FUNCTION log_artwork_approval();

-- 10. Add comments for documentation
COMMENT ON TABLE notifications IS 'Stores user notifications for artwork approvals and other events';
COMMENT ON TABLE artwork_approval_history IS 'Audit trail for artwork approval actions';
COMMENT ON COLUMN artworks.approved_by IS 'Admin user who approved/rejected the artwork';
COMMENT ON COLUMN artworks.reviewed_at IS 'Timestamp when artwork was reviewed';
COMMENT ON COLUMN artworks.revision_requested IS 'Whether admin requested revisions';
COMMENT ON COLUMN artworks.revision_notes IS 'Notes for requested revisions';

-- 11. Create view for pending artworks with time waiting
CREATE OR REPLACE VIEW pending_artworks_with_wait_time AS
SELECT 
  a.*,
  up.full_name as creator_name,
  up.email as creator_email,
  EXTRACT(EPOCH FROM (NOW() - a.created_at))/3600 as hours_waiting,
  CASE 
    WHEN EXTRACT(EPOCH FROM (NOW() - a.created_at))/3600 < 24 THEN 'normal'
    WHEN EXTRACT(EPOCH FROM (NOW() - a.created_at))/3600 < 72 THEN 'warning'
    ELSE 'urgent'
  END as priority
FROM artworks a
JOIN user_profiles up ON a.creator_id = up.id
WHERE a.approval_status = 'pending'
ORDER BY a.created_at ASC;

-- Grant access to the view
GRANT SELECT ON pending_artworks_with_wait_time TO authenticated;

COMMENT ON VIEW pending_artworks_with_wait_time IS 'Shows pending artworks with wait time and priority';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Artwork approval flow improvements applied successfully!';
  RAISE NOTICE 'New features:';
  RAISE NOTICE '  - Approval tracking (approved_by, reviewed_at)';
  RAISE NOTICE '  - Notifications system';
  RAISE NOTICE '  - Approval history/audit trail';
  RAISE NOTICE '  - Revision request capability';
  RAISE NOTICE '  - Priority queue for pending artworks';
END $$;
