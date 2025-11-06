-- Setup avatar storage bucket and policies
-- Run this in your Supabase SQL editor

-- 1. Create the avatars bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. First, drop any existing policies that might be conflicting
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Avatar uploads are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload an avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update an avatar" ON storage.objects;

-- 3. Create simple, permissive policies for avatars bucket

-- Allow anyone to view avatars (public read)
CREATE POLICY "Avatar public read" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Allow authenticated users to upload avatars
CREATE POLICY "Avatar authenticated upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update avatars
CREATE POLICY "Avatar authenticated update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete avatars
CREATE POLICY "Avatar authenticated delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- 4. Verify the bucket was created
SELECT * FROM storage.buckets WHERE id = 'avatars';

-- 5. Check if RLS is enabled on storage.objects (should be true)
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';