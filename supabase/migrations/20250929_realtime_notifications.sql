-- Real-time notifications table
CREATE TABLE IF NOT EXISTS real_time_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- submission_update, new_order, payment_received, review_completed
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_realtime_notifications_user_id ON real_time_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_realtime_notifications_read ON real_time_notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_realtime_notifications_created_at ON real_time_notifications(created_at);

-- Enable RLS
ALTER TABLE real_time_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications" ON real_time_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON real_time_notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON real_time_notifications
  FOR INSERT WITH CHECK (true); -- Allow system to insert notifications

-- Function to automatically send notifications on submission status changes
CREATE OR REPLACE FUNCTION notify_submission_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify on status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO real_time_notifications (user_id, type, title, message, data)
    VALUES (
      NEW.creator_id,
      'submission_update',
      'Submission Status Updated',
      CASE NEW.status
        WHEN 'approved' THEN 'Your submission "' || NEW.title || '" has been approved!'
        WHEN 'published' THEN 'Your submission "' || NEW.title || '" is now live on the marketplace!'
        WHEN 'rejected' THEN 'Your submission "' || NEW.title || '" needs attention.'
        WHEN 'needs_revision' THEN 'Your submission "' || NEW.title || '" needs some revisions.'
        ELSE 'Your submission "' || NEW.title || '" status has been updated to ' || NEW.status
      END,
      jsonb_build_object(
        'submission_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'submission_title', NEW.title
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for submission status notifications
CREATE TRIGGER submission_status_notification_trigger
  AFTER UPDATE ON project_submissions
  FOR EACH ROW EXECUTE FUNCTION notify_submission_status_change();

-- Function to notify creators of new orders
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO real_time_notifications (user_id, type, title, message, data)
  VALUES (
    NEW.seller_id,
    'new_order',
    'New Order Received!',
    'You have a new order for ₦' || NEW.total_amount::text,
    jsonb_build_object(
      'order_id', NEW.id,
      'buyer_id', NEW.buyer_id,
      'amount', NEW.total_amount,
      'item_type', NEW.item_type
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new order notifications
CREATE TRIGGER new_order_notification_trigger
  AFTER INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION notify_new_order();

-- Function to notify admins of new submissions
CREATE OR REPLACE FUNCTION notify_admin_new_submission()
RETURNS TRIGGER AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Get admin user ID (you can modify this logic)
  SELECT id INTO admin_user_id 
  FROM user_profiles 
  WHERE role = 'admin' 
  LIMIT 1;
  
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO real_time_notifications (user_id, type, title, message, data)
    VALUES (
      admin_user_id,
      'submission_update',
      'New Submission for Review',
      'New ' || NEW.creator_type || ' submission: "' || NEW.title || '"',
      jsonb_build_object(
        'submission_id', NEW.id,
        'creator_id', NEW.creator_id,
        'creator_type', NEW.creator_type,
        'submission_title', NEW.title
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for admin notifications
CREATE TRIGGER admin_new_submission_trigger
  AFTER INSERT ON project_submissions
  FOR EACH ROW 
  WHEN (NEW.status = 'submitted')
  EXECUTE FUNCTION notify_admin_new_submission();

-- Add updated_at trigger
CREATE TRIGGER update_realtime_notifications_updated_at BEFORE UPDATE ON real_time_notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();