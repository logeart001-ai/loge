const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function fixOrdersRLS() {
  try {
    console.log('Fixing Orders RLS policies...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase configuration')
    }
    
    const supabase = createClient(supabaseUrl, serviceRoleKey)
    
    // Step 1: Check current policies
    console.log('\n1. Checking current policies:')
    const { data: policies, error: policyError } = await supabase
      .rpc('sql', { 
        query: `SELECT policyname, cmd FROM pg_policies WHERE tablename = 'orders' ORDER BY policyname;` 
      })
    
    if (policyError) {
      console.log('Could not query policies directly:', policyError.message)
    } else {
      console.log('Current orders policies:', policies)
    }
    
    // Step 2: Drop problematic policies
    console.log('\n2. Dropping problematic SELECT policies...')
    
    const dropPolicies = [
      `DROP POLICY IF EXISTS "Creators can view orders for their items" ON orders;`,
      `DROP POLICY IF EXISTS "Users can view own orders as buyer" ON orders;`
    ]
    
    for (const sql of dropPolicies) {
      const { error } = await supabase.rpc('sql', { query: sql })
      if (error) {
        console.log('Error dropping policy:', error.message)
      } else {
        console.log('Successfully dropped policy')
      }
    }
    
    // Step 3: Create simple policy
    console.log('\n3. Creating simple SELECT policy...')
    const createPolicy = `
      CREATE POLICY "Users can view own orders" ON orders
          FOR SELECT USING (auth.uid() = buyer_id);
    `
    
    const { error: createError } = await supabase.rpc('sql', { query: createPolicy })
    if (createError) {
      console.log('Error creating policy:', createError.message)
    } else {
      console.log('Successfully created simple policy')
    }
    
    // Step 4: Test the query
    console.log('\n4. Testing orders query...')
    const { data: testData, error: testError } = await supabase
      .from('orders')
      .select('id, buyer_id')
      .limit(1)
    
    console.log('Test query result:', { 
      dataCount: testData?.length || 0, 
      error: testError?.message 
    })
    
  } catch (error) {
    console.error('Fix failed:', error.message)
  }
}

fixOrdersRLS()