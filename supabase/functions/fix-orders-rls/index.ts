import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Execute the SQL to fix RLS policies
    const fixPoliciesSQL = `
      BEGIN;
      
      -- Drop the problematic policies that cause infinite recursion
      DROP POLICY IF EXISTS "Creators can view orders for their items" ON public.orders;
      DROP POLICY IF EXISTS "Users can view own orders as buyer" ON public.orders;
      
      -- Create a single, simple SELECT policy
      CREATE POLICY "orders_select_policy" ON public.orders
          FOR SELECT USING (auth.uid() = buyer_id);
      
      COMMIT;
    `
    
    // Try to execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql: fixPoliciesSQL })
    
    if (error) {
      console.error('Error executing SQL:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { headers: { 'Content-Type': 'application/json' }, status: 500 }
      )
    }
    
    // Test the fix
    const { data: testResult, error: testError } = await supabase
      .from('orders')
      .select('id')
      .limit(1)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'RLS policies fixed successfully',
        testResult: testError ? { error: testError.message } : { count: testResult?.length || 0 }
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/fix-orders-rls' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
