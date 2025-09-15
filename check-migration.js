// Check if migration has been run
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkMigration() {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('profile_completed')
      .limit(1)
    
    if (error && error.message.includes('column "profile_completed" does not exist')) {
      console.log('❌ Migration NOT run yet - profile_completed column missing')
      console.log('Please run the migration-enhanced-profiles.sql in your Supabase SQL Editor')
    } else if (error) {
      console.log('❌ Other error:', error.message)
    } else {
      console.log('✅ Migration appears to be run - profile_completed column exists')
    }
  } catch (err) {
    console.error('Error:', err.message)
  }
}

checkMigration()