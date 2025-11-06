-- Simple avatar storage setup (for testing)
-- Run this in your Supabase SQL editor

-- 1. Create the avatars bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop all existing policies
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Avatar uploads are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload an avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update an avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatar public read" ON storage.objects;
DROP POLICY IF EXISTS "Avatar authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Avatar authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "Avatar authenticated delete" ON storage.objects;

-- 3. Create very permissive policies (for testing)
CREATE POLICY "Allow all avatar operations" ON storage.objects
FOR ALL USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- 4. Verify setup
SELECT 
  id, 
  name, 
  public,
  created_at
FROM storage.buckets 
WHERE id = 'avatars';

-- 5. List current policies
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects' 
AND policyname LIKE '%avatar%';