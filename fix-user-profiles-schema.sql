-- Fix User Profiles Table Schema
-- Run this in your Supabase SQL Editor to add missing columns

-- 1. Check current user_profiles table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Add missing columns to user_profiles table
DO $$ 
BEGIN
  -- Add social_links column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'social_links') THEN
    ALTER TABLE user_profiles ADD COLUMN social_links JSONB DEFAULT '{}';
  END IF;
  
  -- Add bio column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'bio') THEN
    ALTER TABLE user_profiles ADD COLUMN bio TEXT;
  END IF;
  
  -- Add location column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'location') THEN
    ALTER TABLE user_profiles ADD COLUMN location VARCHAR(255);
  END IF;
  
  -- Add discipline column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'discipline') THEN
    ALTER TABLE user_profiles ADD COLUMN discipline VARCHAR(255);
  END IF;
  
  -- Add rating column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'rating') THEN
    ALTER TABLE user_profiles ADD COLUMN rating DECIMAL(3,2) DEFAULT 0.0;
  END IF;
  
  -- Add is_verified column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'is_verified') THEN
    ALTER TABLE user_profiles ADD COLUMN is_verified BOOLEAN DEFAULT false;
  END IF;
  
  -- Add avatar_url column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'avatar_url') THEN
    ALTER TABLE user_profiles ADD COLUMN avatar_url TEXT;
  END IF;
  
  -- Add phone column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'phone') THEN
    ALTER TABLE user_profiles ADD COLUMN phone VARCHAR(20);
  END IF;
  
  -- Add website column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'website') THEN
    ALTER TABLE user_profiles ADD COLUMN website TEXT;
  END IF;
  
  -- Add date_of_birth column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'date_of_birth') THEN
    ALTER TABLE user_profiles ADD COLUMN date_of_birth DATE;
  END IF;
  
  -- Add preferences column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'preferences') THEN
    ALTER TABLE user_profiles ADD COLUMN preferences JSONB DEFAULT '{}';
  END IF;
  
  -- Add last_active column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'last_active') THEN
    ALTER TABLE user_profiles ADD COLUMN last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- 3. Update existing records to have default social_links if null
UPDATE user_profiles 
SET social_links = '{}' 
WHERE social_links IS NULL;

-- 4. Verify the updated table structure
SELECT 
  'User Profiles Schema Updated!' as status,
  COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND table_schema = 'public';

-- 5. Show the complete table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;