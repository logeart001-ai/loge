-- Fix User Profiles Table Schema (Simple Version)
-- Run this in your Supabase SQL Editor to add missing columns

-- Add missing columns to user_profiles table (using IF NOT EXISTS where supported)

-- Add social_links column
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';

-- Add bio column
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add location column
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS location VARCHAR(255);

-- Add discipline column
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS discipline VARCHAR(255);

-- Add rating column
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0.0;

-- Add is_verified column
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Add avatar_url column
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add phone column
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Add website column
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS website TEXT;

-- Add date_of_birth column
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Add preferences column
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';

-- Add last_active column
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing records to have default social_links if null
UPDATE user_profiles 
SET social_links = '{}' 
WHERE social_links IS NULL;

-- Update existing records to have default preferences if null
UPDATE user_profiles 
SET preferences = '{}' 
WHERE preferences IS NULL;

-- Verify the setup
SELECT 
  'User Profiles Schema Updated!' as status,
  COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND table_schema = 'public';

-- Show current table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;