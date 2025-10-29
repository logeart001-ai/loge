-- Add notification preferences to user_profiles table
-- This allows users to control what email notifications they receive

-- Add notification preference columns
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notify_order_updates BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notify_submission_updates BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notify_new_followers BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notify_new_reviews BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notify_artwork_sold BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notify_marketing BOOLEAN DEFAULT FALSE;

-- Create email_logs table to track sent emails
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  email_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'bounced')),
  error_message TEXT,
  metadata JSONB,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);

-- Enable RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_logs
-- Users can view their own email logs
CREATE POLICY "Users can view own email logs"
  ON email_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all email logs
CREATE POLICY "Admins can view all email logs"
  ON email_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- System can insert email logs
CREATE POLICY "System can insert email logs"
  ON email_logs
  FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE email_logs IS 'Tracks all emails sent to users for audit and debugging purposes';
COMMENT ON COLUMN user_profiles.email_notifications_enabled IS 'Master toggle for all email notifications';
COMMENT ON COLUMN user_profiles.notify_order_updates IS 'Receive emails about order status changes';
COMMENT ON COLUMN user_profiles.notify_submission_updates IS 'Receive emails about submission approvals/rejections';
COMMENT ON COLUMN user_profiles.notify_new_followers IS 'Receive emails when someone follows you';
COMMENT ON COLUMN user_profiles.notify_new_reviews IS 'Receive emails when someone reviews your work';
COMMENT ON COLUMN user_profiles.notify_artwork_sold IS 'Receive emails when your artwork is sold';
COMMENT ON COLUMN user_profiles.notify_marketing IS 'Receive marketing and promotional emails';
