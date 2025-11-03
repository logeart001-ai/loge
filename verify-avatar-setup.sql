-- Verify Avatar Upload Setup
-- Run this to check if everything is ready for avatar uploads

-- 1. Check if profile-images bucket exists
SELECT 
  name,
  id,
  created_at,
  updated_at,
  public
FROM storage.buckets 
WHERE name = 'profile-images';

-- 2. Check storage policies for profile-images
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%profile%';

-- 3. Check user_profiles table has avatar_url column
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND column_name = 'avatar_url';

-- 4. Check current users with avatars
SELECT 
  up.id,
  up.full_name,
  up.role,
  up.avatar_url,
  CASE 
    WHEN up.avatar_url IS NOT NULL THEN 'Has Avatar'
    ELSE 'No Avatar'
  END as avatar_status
FROM user_profiles up
ORDER BY up.created_at DESC
LIMIT 10;

-- 5. Test avatar URL format (should be Supabase storage URLs)
SELECT 
  up.full_name,
  up.avatar_url,
  CASE 
    WHEN up.avatar_url LIKE '%supabase.co%' THEN 'Valid Supabase URL'
    WHEN up.avatar_url IS NULL THEN 'No Avatar'
    ELSE 'External URL'
  END as url_type
FROM user_profiles up
WHERE up.avatar_url IS NOT NULL;

-- 6. Check storage usage for profile images
SELECT 
  bucket_id,
  COUNT(*) as file_count,
  COALESCE(
    SUM(
      CASE 
        WHEN metadata ? 'size' AND metadata->>'size' ~ '^[0-9]+$' 
        THEN (metadata->>'size')::bigint 
        ELSE 0 
      END
    ), 0
  ) as total_size_bytes,
  ROUND(
    COALESCE(
      SUM(
        CASE 
          WHEN metadata ? 'size' AND metadata->>'size' ~ '^[0-9]+$' 
          THEN (metadata->>'size')::bigint 
          ELSE 0 
        END
      ), 0
    ) / 1024.0 / 1024.0, 2
  ) as total_size_mb
FROM storage.objects 
WHERE bucket_id = 'profile-images'
GROUP BY bucket_id;

-- 7. List recent profile image uploads
SELECT 
  name,
  created_at,
  updated_at,
  CASE 
    WHEN metadata ? 'size' AND metadata->>'size' ~ '^[0-9]+$' 
    THEN ROUND((metadata->>'size')::bigint / 1024.0, 2) || ' KB'
    ELSE 'Size unknown'
  END as file_size,
  metadata->>'mimetype' as file_type
FROM storage.objects 
WHERE bucket_id = 'profile-images'
ORDER BY created_at DESC
LIMIT 10;