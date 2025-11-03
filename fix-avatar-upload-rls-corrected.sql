-- Fix Avatar Upload RLS Policy Violations
-- Run this in your Supabase SQL Editor to resolve avatar upload issues

-- 1. Create the profile-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images', 
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can upload profile images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile images" ON storage.objects;

-- 3. Create comprehensive storage policies for profile images

-- Allow authenticated users to upload profile images to their own folder
CREATE POLICY "Authenticated users can upload profile images" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'profile-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to profile images
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

-- 4. Ensure user_profiles table has proper RLS policies for avatar updates

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;

-- Create update policy
CREATE POLICY "Users can update their own profile" ON user_profiles 
FOR UPDATE USING (auth.uid() = id);

-- Create view policy  
CREATE POLICY "Users can view all profiles" ON user_profiles 
FOR SELECT USING (true);

-- 5. Test the setup with a sample query
SELECT 
  'Avatar Upload Setup Complete!' as status,
  (SELECT COUNT(*) FROM storage.buckets WHERE name = 'profile-images') as bucket_exists,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%profile%') as storage_policies,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'user_profiles') as profile_policies;

-- 6. Show current user for debugging (will be null when run as admin)
SELECT 
  'Current User Info:' as info,
  auth.uid() as user_id,
  auth.role() as user_role,
  (SELECT email FROM auth.users WHERE id = auth.uid()) as user_email;