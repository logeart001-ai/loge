// Debug orders query
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function debugOrders() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  
  // First, check if we can authenticate
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  console.log('Auth check:', { user: user?.id, authError })
  
  if (authError || !user) {
    console.log('Not authenticated - trying with service role key')
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL, 
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    // Try basic query with service role
    const { data, error } = await adminSupabase
      .from('orders')
      .select('*')
      .limit(5)
    
    console.log('Service role query result:', { data, error })
    return
  }
  
  // Test basic query first
  console.log('Testing basic orders query...')
  const { data: basicData, error: basicError } = await supabase
    .from('orders')
    .select('*')
    .limit(5)
  
  console.log('Basic query result:', { data: basicData, error: basicError })
  
  // Test with buyer_id filter
  console.log('Testing buyer_id filter query...')
  const { data: filteredData, error: filteredError } = await supabase
    .from('orders')
    .select('*')
    .eq('buyer_id', user.id)
    .limit(5)
  
  console.log('Filtered query result:', { data: filteredData, error: filteredError })
}

debugOrders().catch(console.error)