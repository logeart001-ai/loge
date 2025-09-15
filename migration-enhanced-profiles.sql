-- Migration: Enhanced User Profiles
-- Run this in your Supabase SQL Editor

-- Add new columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;

-- Update existing records to mark profiles as completed if they have basic info
UPDATE user_profiles 
SET profile_completed = true 
WHERE bio IS NOT NULL AND bio != '';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_profile_completed ON user_profiles(profile_completed);
CREATE INDEX IF NOT EXISTS idx_user_profiles_specialties ON user_profiles USING GIN(specialties);

-- Create a function to automatically create user profiles when auth users are created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role, profile_completed)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
    CASE 
      WHEN new.raw_user_meta_data->>'user_type' = 'creator' THEN 'creator'::user_role
      ELSE 'buyer'::user_role
    END,
    false
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profiles for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Enable Row Level Security (RLS) on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view all profiles (for browsing creators)
CREATE POLICY "Public profiles are viewable by everyone" ON user_profiles
  FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (handled by trigger, but good to have)
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.user_profiles TO anon, authenticated;

-- Update the user_profiles table structure to match our enhanced schema
-- (This ensures compatibility with the profile completion component)

COMMENT ON COLUMN user_profiles.phone IS 'User phone number (optional)';
COMMENT ON COLUMN user_profiles.website IS 'User website URL (optional)';
COMMENT ON COLUMN user_profiles.social_links IS 'JSON object containing social media links';
COMMENT ON COLUMN user_profiles.specialties IS 'Array of user specialties/skills';
COMMENT ON COLUMN user_profiles.experience_level IS 'User experience level for creators';
COMMENT ON COLUMN user_profiles.portfolio_url IS 'URL to user portfolio (optional)';
COMMENT ON COLUMN user_profiles.profile_completed IS 'Whether user has completed their profile setup';

-- Show success message
SELECT 'Enhanced user profiles migration completed successfully!' as status;