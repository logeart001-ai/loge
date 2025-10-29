const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sfwopulinzmpupmgaqyw.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmd29wdWxpbnptcHVwbWdhcXl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQ5MDMwOCwiZXhwIjoyMDcwMDY2MzA4fQ.YYqX5Ownfixgvi87wQew_t3DJrd05FfWrpQo4ZF_CsE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('Running migration: Add account_status column...')
  
  const sqlFile = path.join(__dirname, 'scripts', '10-add-account-status.sql')
  const sql = fs.readFileSync(sqlFile, 'utf8')
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      console.error('Migration failed:', error)
      process.exit(1)
    }
    
    console.log('✅ Migration completed successfully!')
    console.log('account_status column added to user_profiles table')
  } catch (err) {
    console.error('Error running migration:', err)
    process.exit(1)
  }
}

runMigration()
