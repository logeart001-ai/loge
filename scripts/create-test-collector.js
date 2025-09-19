// Create a test user with collector role and test orders
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function createTestUser() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  
  const testEmail = `collector-test-${Date.now()}@example.com`
  const testPassword = 'TestPassword123!'
  
  console.log('Creating test collector user:', testEmail)
  
  // Create user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
    user_metadata: {
      full_name: 'Test Collector',
      role: 'collector'
    }
  })
  
  if (authError) {
    console.error('Error creating user:', authError)
    return
  }
  
  console.log('User created:', authData.user.id)
  
  // Check if profile was auto-created by trigger
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single()
  
  console.log('User profile:', { profile, profileError })
  
  // Try to query orders as this user (should return empty array)
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .eq('buyer_id', authData.user.id)
  
  console.log('Orders query for new user:', { orders, ordersError })
  
  // Try to create a test order
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert({
      buyer_id: authData.user.id,
      order_number: `TEST-${Date.now()}`,
      total_amount: 100.00,
      status: 'pending'
    })
    .select()
  
  console.log('Test order creation:', { orderData, orderError })
  
  console.log('Test completed. User email:', testEmail, 'Password:', testPassword)
}

createTestUser().catch(console.error)