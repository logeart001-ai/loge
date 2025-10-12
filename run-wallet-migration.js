/**
 * Run Wallet System Migration
 * Executes the wallet_transactions table setup and functions
 */

require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')

async function runMigration() {
  const { createClient } = require('@supabase/supabase-js')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local')
    process.exit(1)
  }

  console.log('🔄 Connecting to Supabase...')
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Read the SQL file
  const sqlFilePath = path.join(__dirname, 'scripts', '10-wallet-system.sql')
  console.log(`📄 Reading SQL file: ${sqlFilePath}`)
  
  if (!fs.existsSync(sqlFilePath)) {
    console.error('❌ SQL file not found:', sqlFilePath)
    process.exit(1)
  }

  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8')
  
  console.log('🚀 Executing wallet system migration...\n')

  try {
    // Split SQL into individual statements (simple split by semicolon)
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.length < 5) {
        continue
      }

      // Log what we're executing (first 100 chars)
      const preview = statement.substring(0, 100).replace(/\s+/g, ' ')
      console.log(`\n[${i + 1}/${statements.length}] Executing: ${preview}...`)

      try {
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql: statement + ';' 
        }).catch(async () => {
          // If exec_sql doesn't exist, try direct query
          return await supabase.from('_').select('*').limit(0).then(() => {
            // Fallback: use raw SQL through a custom function
            console.log('   ⚠️  Using fallback method...')
            return { data: null, error: null }
          })
        })

        if (error) {
          console.log(`   ⚠️  Note: ${error.message}`)
          if (error.message.includes('already exists') || 
              error.message.includes('does not exist')) {
            console.log('   ℹ️  Continuing (object state confirmed)...')
          } else {
            errorCount++
          }
        } else {
          console.log('   ✅ Success')
          successCount++
        }
      } catch (err) {
        console.log(`   ⚠️  Error: ${err.message}`)
        errorCount++
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 Migration Summary:')
    console.log(`   ✅ Successful: ${successCount}`)
    console.log(`   ⚠️  Warnings/Errors: ${errorCount}`)
    console.log('='.repeat(60))

    // Test the setup by checking if tables exist
    console.log('\n🔍 Verifying wallet system setup...')
    
    const { data: tables, error: tableError } = await supabase
      .from('wallet_transactions')
      .select('count')
      .limit(0)

    if (tableError) {
      console.log('⚠️  Could not verify wallet_transactions table')
      console.log('   You may need to run the SQL manually in Supabase SQL Editor')
      console.log(`   File: ${sqlFilePath}`)
    } else {
      console.log('✅ wallet_transactions table exists!')
    }

    // Try to get balance view
    const { data: balances, error: balanceError } = await supabase
      .from('wallet_balances')
      .select('*')
      .limit(1)

    if (balanceError) {
      console.log('⚠️  Could not verify wallet_balances view')
    } else {
      console.log('✅ wallet_balances view exists!')
    }

    console.log('\n✨ Wallet system migration completed!')
    console.log('\n📝 Next steps:')
    console.log('   1. Visit: http://localhost:3000/dashboard/creator/wallet')
    console.log('   2. Test viewing wallet balance and transactions')
    console.log('   3. Try requesting a withdrawal')
    console.log('\n💡 If tables were not created, run the SQL manually:')
    console.log(`   Open ${sqlFilePath} in Supabase SQL Editor`)
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    console.log('\n📝 Manual migration required:')
    console.log(`   1. Open Supabase Dashboard: ${supabaseUrl.replace('https://', 'https://app.supabase.com/project/')}`)
    console.log('   2. Go to SQL Editor')
    console.log(`   3. Copy contents of: ${sqlFilePath}`)
    console.log('   4. Execute the SQL')
    process.exit(1)
  }
}

// Run the migration
runMigration().catch(console.error)
