const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testWithUser() {
  try {
    console.log('Testing orders query with actual user authentication...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Attempt to sign in as our test collector
    const testEmail = 'collector-test-1758240637887@example.com'
    const testPassword = 'TestPassword123!'
    
    console.log(`Attempting to sign in as: ${testEmail}`)
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    })
    
    if (authError) {
      console.log('Auth error:', authError.message)
      return
    }
    
    console.log('Signed in successfully:', authData.user.id)
    
    // Now test the orders query
    console.log('\nTesting orders query with authenticated user...')
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, buyer_id, total_amount')
      .eq('buyer_id', authData.user.id)
    
    console.log('Orders query result:', {
      dataCount: orders?.length || 0,
      error: ordersError?.message,
      errorDetails: ordersError?.details,
      errorHint: ordersError?.hint,
      errorCode: ordersError?.code
    })
    
    if (orders && orders.length > 0) {
      console.log('Sample order:', orders[0])
    }
    
  } catch (error) {
    console.error('Test failed:', error.message)
  }
}

testWithUser()