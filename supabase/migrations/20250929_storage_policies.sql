-- Storage Policies for Loge Arts Platform
-- Run this after creating storage buckets in Supabase Dashboard

-- Create storage buckets (run these in Supabase Dashboard > Storage first)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('submission-media', 'submission-media', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('profile-images', 'profile-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('marketplace-images', 'marketplace-images', true);

-- Submission Media Bucket Policies
-- Allow authenticated users to upload submission media
CREATE POLICY "Authenticated users can upload submission media" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'submission-media' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public viewing of submission media
CREATE POLICY "Public can view submission media" ON storage.objects 
FOR SELECT USING (bucket_id = 'submission-media');

-- Allow users to update their own submission media
CREATE POLICY "Users can update their own submission media" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'submission-media' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own submission media
CREATE POLICY "Users can delete their own submission media" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'submission-media' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Profile Images Bucket Policies
-- Allow authenticated users to upload profile images
CREATE POLICY "Authenticated users can upload profile images" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'profile-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public viewing of profile images
CREATE POLICY "Public can view profile images" ON storage.objects 
FOR SELECT USING (bucket_id = 'profile-images');

-- Allow users to update their own profile images
CREATE POLICY "Users can update their own profile images" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'profile-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own profile images
CREATE POLICY "Users can delete their own profile images" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'profile-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Marketplace Images Bucket Policies (for approved submissions)
-- Allow creators and admins to upload marketplace images
CREATE POLICY "Creators and admins can upload marketplace images" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'marketplace-images' 
  AND auth.role() = 'authenticated'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  )
);

-- Allow public viewing of marketplace images
CREATE POLICY "Public can view marketplace images" ON storage.objects 
FOR SELECT USING (bucket_id = 'marketplace-images');

-- Allow creators and admins to update marketplace images
CREATE POLICY "Creators and admins can update marketplace images" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'marketplace-images' 
  AND auth.role() = 'authenticated'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  )
);

-- Allow creators and admins to delete marketplace images
CREATE POLICY "Creators and admins can delete marketplace images" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'marketplace-images' 
  AND auth.role() = 'authenticated'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  )
);

-- File size and type restrictions (implement in application logic)
-- Maximum file size: 50MB for videos, 10MB for images, 25MB for documents
-- Allowed image types: JPEG, PNG, GIF, WebP
-- Allowed video types: MP4, MOV, AVI
-- Allowed document types: PDF, DOC, DOCX
-- Allowed audio types: MP3, WAV, M4A

-- Create helper function to get file extension
CREATE OR REPLACE FUNCTION get_file_extension(filename TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(split_part(filename, '.', array_length(string_to_array(filename, '.'), 1)));
END;
$$ LANGUAGE plpgsql;

-- Create function to validate file upload
CREATE OR REPLACE FUNCTION validate_file_upload(
  bucket_name TEXT,
  file_name TEXT,
  file_size BIGINT
)
RETURNS BOOLEAN AS $$
DECLARE
  file_ext TEXT;
  max_size BIGINT;
  allowed_extensions TEXT[];
BEGIN
  file_ext := get_file_extension(file_name);
  
  -- Set size limits and allowed extensions based on bucket
  CASE bucket_name
    WHEN 'submission-media' THEN
      max_size := 52428800; -- 50MB
      allowed_extensions := ARRAY['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'avi', 'mp3', 'wav', 'm4a', 'pdf', 'doc', 'docx'];
    WHEN 'profile-images' THEN
      max_size := 10485760; -- 10MB
      allowed_extensions := ARRAY['jpg', 'jpeg', 'png', 'gif', 'webp'];
    WHEN 'marketplace-images' THEN
      max_size := 10485760; -- 10MB
      allowed_extensions := ARRAY['jpg', 'jpeg', 'png', 'gif', 'webp'];
    ELSE
      RETURN FALSE;
  END CASE;
  
  -- Check file size
  IF file_size > max_size THEN
    RETURN FALSE;
  END IF;
  
  -- Check file extension
  IF NOT (file_ext = ANY(allowed_extensions)) THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add validation to storage policies (enhanced)
CREATE POLICY "Validate submission media uploads" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'submission-media' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND validate_file_upload(bucket_id, name, COALESCE(metadata->>'size', '0')::bigint)
);

-- Create storage usage tracking table
CREATE TABLE IF NOT EXISTS storage_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  bucket_name VARCHAR(100) NOT NULL,
  file_count INTEGER DEFAULT 0,
  total_size BIGINT DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint
ALTER TABLE storage_usage ADD CONSTRAINT unique_user_bucket UNIQUE (user_id, bucket_name);

-- Function to update storage usage
CREATE OR REPLACE FUNCTION update_storage_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO storage_usage (user_id, bucket_name, file_count, total_size)
    VALUES (
      NEW.owner::uuid,
      NEW.bucket_id,
      1,
      COALESCE((NEW.metadata->>'size')::bigint, 0)
    )
    ON CONFLICT (user_id, bucket_name)
    DO UPDATE SET
      file_count = storage_usage.file_count + 1,
      total_size = storage_usage.total_size + COALESCE((NEW.metadata->>'size')::bigint, 0),
      updated_at = NOW();
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE storage_usage
    SET
      file_count = GREATEST(file_count - 1, 0),
      total_size = GREATEST(total_size - COALESCE((OLD.metadata->>'size')::bigint, 0), 0),
      updated_at = NOW()
    WHERE user_id = OLD.owner::uuid AND bucket_name = OLD.bucket_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for storage usage tracking
CREATE TRIGGER storage_usage_trigger
  AFTER INSERT OR DELETE ON storage.objects
  FOR EACH ROW EXECUTE FUNCTION update_storage_usage();

-- Enable RLS on storage_usage
ALTER TABLE storage_usage ENABLE ROW LEVEL SECURITY;

-- Policy for storage usage
CREATE POLICY "Users can view their own storage usage" ON storage_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all storage usage" ON storage_usage
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );