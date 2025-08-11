// Node.js script to set up the database
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupDatabase() {
  console.log('🚀 Setting up L\'oge Arts database...')
  
  try {
    // Step 1: Create essential tables
    console.log('📋 Step 1: Creating essential tables...')
    const essentialTablesSQL = fs.readFileSync(
      path.join(__dirname, 'scripts/03-essential-tables-only.sql'), 
      'utf8'
    )
    
    // Split the SQL into individual statements
    const statements = essentialTablesSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        if (error) {
          console.error('Error executing statement:', error)
          // Continue with other statements
        }
      }
    }
    
    console.log('✅ Essential tables created successfully')
    
    // Step 2: Add sample data
    console.log('📊 Step 2: Adding sample data...')
    const sampleDataSQL = fs.readFileSync(
      path.join(__dirname, 'scripts/04-sample-data.sql'), 
      'utf8'
    )
    
    const dataStatements = sampleDataSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    for (const statement of dataStatements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        if (error) {
          console.error('Error executing data statement:', error)
          // Continue with other statements
        }
      }
    }
    
    console.log('✅ Sample data added successfully')
    
    // Step 3: Verify the setup
    console.log('🔍 Step 3: Verifying setup...')
    
    const { data: artworks, error: artworkError } = await supabase
      .from('artworks')
      .select('count')
      .single()
    
    const { data: creators, error: creatorError } = await supabase
      .from('user_profiles')
      .select('count')
      .eq('role', 'creator')
      .single()
    
    const { data: events, error: eventError } = await supabase
      .from('events')
      .select('count')
      .single()
    
    if (!artworkError && !creatorError && !eventError) {
      console.log('✅ Database setup completed successfully!')
      console.log(`📊 Created ${artworks?.count || 0} artworks`)
      console.log(`👨‍🎨 Created ${creators?.count || 0} creators`)
      console.log(`📅 Created ${events?.count || 0} events`)
      console.log('🎉 You can now restart your development server!')
    } else {
      console.log('⚠️  Setup completed with some issues. Check the logs above.')
    }
    
  } catch (error) {
    console.error('❌ Error setting up database:', error)
    process.exit(1)
  }
}

setupDatabase()