-- Fix relationship between blog_comments and user_profiles
-- This is needed for PostgREST to detect the relationship and allow embedding user_profiles in comments query

-- First, drop the existing foreign key constraint if it exists (referencing auth.users)
ALTER TABLE blog_comments
DROP CONSTRAINT IF EXISTS blog_comments_user_id_fkey;

-- Add the new foreign key constraint referencing public.user_profiles
-- This allows: .select('*, user:user_profiles(*)')
ALTER TABLE blog_comments
ADD CONSTRAINT blog_comments_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.user_profiles(id)
ON DELETE CASCADE;

-- Verify the change
SELECT
    tc.table_schema, 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='blog_comments' AND kcu.column_name='user_id';
