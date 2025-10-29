-- Add account_status column to user_profiles table
-- This allows admins to manage user account states (active, suspended, banned)

-- Create account status enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE account_status AS ENUM ('active', 'suspended', 'banned');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add account_status column with default value 'active'
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS account_status account_status DEFAULT 'active';

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_user_profiles_account_status 
ON user_profiles(account_status);

-- Update existing users to have 'active' status
UPDATE user_profiles 
SET account_status = 'active' 
WHERE account_status IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.account_status IS 'Account status: active (normal), suspended (temporary ban), banned (permanent ban)';
