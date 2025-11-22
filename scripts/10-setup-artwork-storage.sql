-- Setup Supabase Storage for Artworks
-- Run this in your Supabase SQL Editor

-- 1. Create storage bucket for artworks (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'artworks', 
  'artworks', 
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[];

-- 2. Set RLS policies for storage bucket

-- Allow anyone to view artwork images
DROP POLICY IF EXISTS "Anyone can view artwork images" ON storage.objects;
CREATE POLICY "Anyone can view artwork images"
ON storage.objects FOR SELECT
USING (bucket_id = 'artworks');

-- Allow authenticated creators to upload their artwork images
DROP POLICY IF EXISTS "Creators can upload their artwork images" ON storage.objects;
CREATE POLICY "Creators can upload their artwork images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'artworks' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow creators to update their own artwork images
DROP POLICY IF EXISTS "Creators can update their artwork images" ON storage.objects;
CREATE POLICY "Creators can update their artwork images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'artworks' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow creators to delete their own artwork images
DROP POLICY IF EXISTS "Creators can delete their artwork images" ON storage.objects;
CREATE POLICY "Creators can delete their artwork images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'artworks' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Verify setup
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'artworks';

-- 4. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;
