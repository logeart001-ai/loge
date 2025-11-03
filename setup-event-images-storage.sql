-- Setup Event Images Storage Bucket
-- Run this in your Supabase SQL Editor to create the event-images bucket and policies

-- 1. Create the event-images bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-images',
  'event-images', 
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create storage policies for event images

-- Allow authenticated users to upload event images
CREATE POLICY "Authenticated users can upload event images" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'event-images' 
  AND auth.role() = 'authenticated'
);

-- Allow public read access to event images
CREATE POLICY "Public read access for event images" ON storage.objects 
FOR SELECT USING (bucket_id = 'event-images');

-- Allow admins and event creators to update their event images
CREATE POLICY "Users can update their own event images" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'event-images' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  )
);

-- Allow admins and event creators to delete their event images
CREATE POLICY "Users can delete their own event images" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'event-images' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  )
);

-- 3. Update events table to include new fields (if they don't exist)
DO $$ 
BEGIN
  -- Add image_url column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'image_url') THEN
    ALTER TABLE events ADD COLUMN image_url TEXT;
  END IF;
  
  -- Add venue_name column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'venue_name') THEN
    ALTER TABLE events ADD COLUMN venue_name VARCHAR(255);
  END IF;
  
  -- Add address column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'address') THEN
    ALTER TABLE events ADD COLUMN address TEXT;
  END IF;
  
  -- Add capacity column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'capacity') THEN
    ALTER TABLE events ADD COLUMN capacity INTEGER;
  END IF;
  
  -- Add registration_url column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'registration_url') THEN
    ALTER TABLE events ADD COLUMN registration_url TEXT;
  END IF;
END $$;

-- 4. Verify the setup
SELECT 
  'Event Images Storage Setup Complete!' as status,
  (SELECT COUNT(*) FROM storage.buckets WHERE name = 'event-images') as bucket_exists,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%event%') as policies_created;