-- Test Avatar Upload System
-- Run this to verify everything is ready for avatar uploads

-- 1. Check if profile-images bucket exists and is configured
SELECT 
  name as bucket_name,
  id,
  created_at,
  updated_at,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE name = 'profile-images';

-- 2. Verify storage policies exist for profile-images
SELECT 
  policyname,
  cmd as operation,
  permissive,
  roles,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has conditions'
    ELSE 'No conditions'
  END as has_conditions
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND (policyname LIKE '%profile%' OR policyname LIKE '%avatar%')
ORDER BY policyname;

-- 3. Test user profile structure
SELECT 
  up.id,
  up.full_name,
  up.role,
  up.avatar_url,
  up.created_at,
  CASE 
    WHEN up.avatar_url IS NULL THEN '🔴 No Avatar'
    WHEN up.avatar_url LIKE '%supabase%' THEN '🟢 Supabase Avatar'
    ELSE '🟡 External Avatar'
  END as avatar_status
FROM user_profiles up
ORDER BY up.created_at DESC;

-- 4. Check if we can simulate an avatar URL update (DRY RUN)
-- This shows what would happen when a user uploads an avatar
SELECT 
  'UPDATE user_profiles SET avatar_url = ''https://example.com/avatar.jpg'' WHERE id = ''' || id || ''';' as sample_update_query,
  full_name,
  role
FROM user_profiles 
WHERE id = '8b396cf6-6110-45a6-a41a-d0d6fa2ee025'  -- Your admin account
LIMIT 1;

-- 5. Verify the profile-images bucket is accessible
-- Check if we can see the bucket structure
SELECT 
  'profile-images' as bucket_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'profile-images') 
    THEN '✅ Bucket exists and ready for uploads'
    ELSE '❌ Bucket missing - avatar uploads will fail'
  END as status;

-- 6. Show what the avatar upload path would look like for current users
SELECT 
  up.id as user_id,
  up.full_name,
  up.role,
  'profile-images/' || up.id || '/avatar-' || EXTRACT(EPOCH FROM NOW())::bigint || '.jpg' as example_upload_path
FROM user_profiles up
ORDER BY up.created_at DESC
LIMIT 5;