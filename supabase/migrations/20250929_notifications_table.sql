-- Create notifications table for email tracking
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'email', -- email, sms, push
  status VARCHAR(50) DEFAULT 'pending', -- pending, sent, failed, delivered, opened
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_email);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications(sent_at);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$ 
BEGIN
  -- Admins can view all notifications
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Admins can manage all notifications') THEN
    CREATE POLICY "Admins can manage all notifications" ON notifications 
    FOR ALL USING (
      EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;
  
  -- Users can view their own notifications
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can view their own notifications') THEN
    CREATE POLICY "Users can view their own notifications" ON notifications 
    FOR SELECT USING (
      recipient_email = (SELECT email FROM user_profiles WHERE id = auth.uid())
    );
  END IF;
END $$;

-- Function to create notifications table (for email service)
CREATE OR REPLACE FUNCTION create_notifications_table_if_not_exists()
RETURNS VOID AS $$
BEGIN
  -- This function ensures the table exists
  -- It's called from the email service
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create Supabase Storage buckets (run these in Supabase Dashboard > Storage)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('submission-media', 'submission-media', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('profile-images', 'profile-images', true);

-- Storage policies for submission-media bucket
-- CREATE POLICY "Authenticated users can upload submission media" ON storage.objects 
-- FOR INSERT WITH CHECK (bucket_id = 'submission-media' AND auth.role() = 'authenticated');

-- CREATE POLICY "Public can view submission media" ON storage.objects 
-- FOR SELECT USING (bucket_id = 'submission-media');

-- CREATE POLICY "Users can update their own submission media" ON storage.objects 
-- FOR UPDATE USING (bucket_id = 'submission-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can delete their own submission media" ON storage.objects 
-- FOR DELETE USING (bucket_id = 'submission-media' AND auth.uid()::text = (storage.foldername(name))[1]);