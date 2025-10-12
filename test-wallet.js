/**
 * Test Wallet System
 * Verify wallet functionality and create test transactions
 */

require('dotenv').config({ path: '.env.local' })

async function testWallet() {
  const { createClient } = require('@supabase/supabase-js')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials')
    process.exit(1)
  }

  console.log('🔄 Connecting to Supabase...\n')
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // Test 1: Check if wallet_transactions table exists
    console.log('📊 Test 1: Checking wallet_transactions table...')
    const { data: transactions, error: transError } = await supabase
      .from('wallet_transactions')
      .select('*')
      .limit(5)

    if (transError) {
      console.log(`   ❌ Error: ${transError.message}`)
    } else {
      console.log(`   ✅ Table exists! Found ${transactions.length} transactions`)
      if (transactions.length > 0) {
        console.log('   📝 Sample transaction:', transactions[0])
      }
    }

    // Test 2: Check wallet_balances view
    console.log('\n📊 Test 2: Checking wallet_balances view...')
    const { data: balances, error: balError } = await supabase
      .from('wallet_balances')
      .select('*')
      .limit(5)

    if (balError) {
      console.log(`   ❌ Error: ${balError.message}`)
    } else {
      console.log(`   ✅ View exists! Found ${balances.length} balances`)
      if (balances.length > 0) {
        balances.forEach(balance => {
          console.log(`   💰 User: ${balance.user_id.slice(0, 8)}... Balance: ₦${balance.balance}`)
        })
      }
    }

    // Test 3: Get a creator user to test with
    console.log('\n📊 Test 3: Finding a creator user...')
    const { data: users, error: userError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, role')
      .eq('role', 'creator')
      .limit(1)

    if (userError || !users || users.length === 0) {
      console.log('   ⚠️  No creator users found. Skipping test transaction creation.')
      console.log('   💡 Create a creator account first to test wallet functionality')
    } else {
      const creator = users[0]
      console.log(`   ✅ Found creator: ${creator.full_name} (${creator.email})`)
      
      // Test 4: Create a test transaction
      console.log('\n📊 Test 4: Creating test credit transaction...')
      const testAmount = 15000 // ₦15,000
      const { data: newTransaction, error: insertError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: creator.id,
          amount: testAmount,
          transaction_type: 'credit',
          status: 'completed',
          description: 'Test sale - Sample artwork purchase',
          reference: `TEST_${Date.now()}`,
          metadata: {
            test: true,
            order_id: 'test-order-123'
          }
        })
        .select()
        .single()

      if (insertError) {
        console.log(`   ❌ Error creating transaction: ${insertError.message}`)
      } else {
        console.log('   ✅ Test transaction created successfully!')
        console.log(`   💰 Amount: ₦${testAmount.toLocaleString()}`)
        console.log(`   📝 Reference: ${newTransaction.reference}`)
      }

      // Test 5: Check updated balance
      console.log('\n📊 Test 5: Checking updated balance...')
      const { data: updatedBalance, error: balanceError } = await supabase
        .from('wallet_balances')
        .select('*')
        .eq('user_id', creator.id)
        .single()

      if (balanceError) {
        console.log(`   ⚠️  Balance check: ${balanceError.message}`)
      } else if (updatedBalance) {
        console.log('   ✅ Balance updated!')
        console.log(`   💰 Current Balance: ₦${parseFloat(updatedBalance.balance).toLocaleString()}`)
        console.log(`   📊 Total Earnings: ₦${parseFloat(updatedBalance.total_credits || 0).toLocaleString()}`)
        console.log(`   📤 Total Withdrawals: ₦${parseFloat(updatedBalance.total_debits || 0).toLocaleString()}`)
        console.log(`   🔢 Total Transactions: ${updatedBalance.total_transactions}`)
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('✨ Wallet System Test Complete!')
    console.log('='.repeat(60))
    console.log('\n📝 Next Steps:')
    console.log('   1. Start your development server: npm run dev')
    console.log('   2. Login as a creator user')
    console.log('   3. Visit: http://localhost:3000/dashboard/creator/wallet')
    console.log('   4. You should see your test transaction!')
    console.log('\n💡 Wallet Dashboard Features:')
    console.log('   ✅ View current balance')
    console.log('   ✅ View transaction history')
    console.log('   ✅ Request withdrawals')
    console.log('   ✅ Track earnings over time')

  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.log('\n💡 Troubleshooting:')
    console.log('   1. Make sure your Supabase database is running')
    console.log('   2. Check your .env.local file has correct credentials')
    console.log('   3. Verify the wallet_transactions table exists in Supabase')
    process.exit(1)
  }
}

// Run the test
testWallet().catch(console.error)
