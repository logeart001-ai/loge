-- ============================================
-- FIX CREATOR ONBOARDING TABLE CONSTRAINT
-- This adds the missing unique constraint on creator_id
-- ============================================

-- Step 1: Check if the table exists
SELECT 
  'Checking creator_onboarding table...' as status,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'creator_onboarding'
  ) as table_exists;

-- Step 2: Add unique constraint on creator_id if it doesn't exist
DO $$ 
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'creator_onboarding_creator_id_key'
    AND conrelid = 'creator_onboarding'::regclass
  ) THEN
    -- Add unique constraint
    ALTER TABLE creator_onboarding 
    ADD CONSTRAINT creator_onboarding_creator_id_key 
    UNIQUE (creator_id);
    
    RAISE NOTICE '✅ Unique constraint added to creator_onboarding.creator_id';
  ELSE
    RAISE NOTICE 'ℹ️  Unique constraint already exists';
  END IF;
END $$;

-- Step 3: Verify the constraint was added
SELECT 
  '✅ Constraint Verification:' as status,
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'creator_onboarding'::regclass
  AND contype = 'u'; -- u = unique constraint

-- Step 4: Show table structure
SELECT 
  'Table Structure:' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'creator_onboarding'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 5: Test the constraint works
-- This should succeed (insert new record)
INSERT INTO creator_onboarding (creator_id, current_step)
VALUES (gen_random_uuid(), 'test_step')
ON CONFLICT (creator_id) DO NOTHING
RETURNING id, creator_id, current_step, '✅ Test insert successful' as status;

-- Clean up test record
DELETE FROM creator_onboarding WHERE current_step = 'test_step';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT 
  '🎉 FIX COMPLETE!' as message,
  'The creator_onboarding table now has a unique constraint on creator_id' as details,
  'You can now change users to creators without errors' as next_step;
