const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Test server client configuration
async function testServerClient() {
  try {
    console.log('Testing server client configuration...')
    
    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('Environment variables:')
    console.log('- SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
    console.log('- ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing')  
    console.log('- SERVICE_ROLE_KEY:', serviceRoleKey ? 'Set' : 'Missing')
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing required Supabase environment variables')
    }
    
    // Test 1: Client with anon key (simulating server client)
    const client = createClient(supabaseUrl, supabaseAnonKey)
    
    console.log('\nTesting anon client:')
    const { data: tables, error } = await client
      .from('orders')
      .select('id')
      .limit(1)
    
    console.log('- Orders query result:', { 
      dataCount: tables?.length || 0, 
      error: error?.message 
    })
    
    // Test 2: Client with service role (for comparison)
    if (serviceRoleKey) {
      const serviceClient = createClient(supabaseUrl, serviceRoleKey)
      
      console.log('\nTesting service role client:')
      const { data: serviceData, error: serviceError } = await serviceClient
        .from('orders')
        .select('id')
        .limit(1)
      
      console.log('- Service Orders query result:', { 
        dataCount: serviceData?.length || 0, 
        error: serviceError?.message 
      })
    }
    
  } catch (error) {
    console.error('Test failed:', error.message)
  }
}

testServerClient()