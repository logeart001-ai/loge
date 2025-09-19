import { requireAuth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'

async function testDatabaseConnection() {
  try {
    const supabase = await createServerClient()
    
    // Test 1: Get current user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Test Auth:', { 
      user: user?.id, 
      authError: authError?.message 
    })
    
    // Test 2: Simple query to test basic connection
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, role')
      .limit(1)
    
    console.log('Test Profiles Query:', { 
      profilesCount: profiles?.length || 0,
      profileError: profileError?.message
    })
    
    // Test 3: Orders query without user filter
    const { data: allOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id, buyer_id')
      .limit(1)
    
    console.log('Test Orders Query (no filter):', { 
      ordersCount: allOrders?.length || 0,
      ordersError: ordersError?.message
    })
    
    if (user?.id) {
      // Test 4: Orders query with user filter
      const { data: userOrders, error: userOrdersError } = await supabase
        .from('orders')
        .select('id, buyer_id')
        .eq('buyer_id', user.id)
      
      console.log('Test Orders Query (user filtered):', { 
        userOrdersCount: userOrders?.length || 0,
        userOrdersError: userOrdersError?.message,
        userId: user.id
      })
    }
    
    return {
      auth: { user: user?.id, error: authError?.message },
      profiles: { count: profiles?.length || 0, error: profileError?.message },
      orders: { count: allOrders?.length || 0, error: ordersError?.message }
    }
  } catch (error) {
    console.error('Test connection error:', error)
    return { error: 'Connection failed' }
  }
}

export default async function TestAuthPage() {
  const user = await requireAuth()
  const testResults = await testDatabaseConnection()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Auth & Database Connection Test</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="font-semibold">RequireAuth Result:</h2>
          <pre className="bg-gray-100 p-2 rounded mt-2">
            {JSON.stringify({ userId: user.id, email: user.email }, null, 2)}
          </pre>
        </div>
        
        <div className="p-4 border rounded">
          <h2 className="font-semibold">Database Test Results:</h2>
          <pre className="bg-gray-100 p-2 rounded mt-2">
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        Check the console for detailed logs.
      </div>
    </div>
  )
}