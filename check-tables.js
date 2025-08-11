// Check what tables exist
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkTables() {
  console.log('🔍 Checking existing tables...\n')
  
  const tablesToCheck = ['user_profiles', 'artworks', 'events', 'blog_posts']
  
  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
      } else {
        console.log(`✅ ${table}: Table exists (${data.length} sample records)`)
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`)
    }
  }
  
  // Try to create a simple table to test permissions
  console.log('\n🧪 Testing table creation permissions...')
  try {
    const { error } = await supabase.rpc('exec_sql', { 
      sql: 'CREATE TABLE IF NOT EXISTS test_table (id SERIAL PRIMARY KEY, name TEXT);' 
    })
    
    if (error) {
      console.log('❌ Cannot create tables:', error.message)
      console.log('💡 This suggests you need to run the SQL script in the Supabase dashboard')
    } else {
      console.log('✅ Table creation works')
    }
  } catch (err) {
    console.log('❌ RPC not available:', err.message)
    console.log('💡 You need to run the SQL script manually in Supabase dashboard')
  }
}

checkTables()