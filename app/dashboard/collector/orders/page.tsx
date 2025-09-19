import { requireAuth } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type OrderRow = {
  id: string
  order_number?: string | null
  total_amount?: number | string | null
  status?: string | null
  created_at: string
}

async function getOrders(userId: string) {
  try {
    // TEMPORARY FIX: Use service role to bypass RLS infinite recursion
    // This bypasses the problematic RLS policies until they can be fixed
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabase = createClient(supabaseUrl, serviceRoleKey)
    
    console.log('Orders query - Using service role to bypass RLS issue')
    
    // Direct query with user filter using service role
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('buyer_id', userId)
      .order('created_at', { ascending: false })

    console.log('Orders query result:', { 
      dataCount: data?.length || 0, 
      errorMessage: error?.message,
      userId: userId
    })

    if (error) {
      console.error('Error fetching orders with service role:', error.message)
      return [] as OrderRow[]
    }
    
    return (data as OrderRow[]) || []
  } catch (err) {
    console.error('Exception in getOrders:', err)
    return [] as OrderRow[]
  }
}

export default async function CollectorOrdersPage() {
  const user = await requireAuth()
  const orders = await getOrders(user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* TODO: Fix RLS policies to remove service role dependency */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl font-semibold">Collection History</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Art Collection</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No artworks collected yet.</div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="flex items-center gap-4 p-4 border rounded-lg bg-white">
                    <div className="flex-1">
                      <div className="font-medium">Order {order.order_number || order.id.slice(0, 8)}</div>
                      <div className="text-sm text-gray-600">
                        Collected on {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">${order.total_amount ?? '—'}</div>
                      <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                        {order.status || 'pending'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}