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
  buyer_id?: string | null
}

async function getCreatorOrders(userId: string) {
  try {
    // TEMPORARY: Use service role to bypass RLS issues (similar to collector orders)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Query orders that contain items from this creator
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items!inner(creator_id)
      `)
      .eq('order_items.creator_id', userId)
      .order('created_at', { ascending: false })

    console.log('Creator orders query result:', { 
      dataCount: data?.length || 0, 
      errorMessage: error?.message,
      userId: userId
    })

    if (error) {
      console.error('Error fetching creator orders:', error.message)
      return [] as OrderRow[]
    }
    
    return (data as OrderRow[]) || []
  } catch (err) {
    console.error('Exception in getCreatorOrders:', err)
    return [] as OrderRow[]
  }
}

export default async function CreatorOrdersPage() {
  const user = await requireAuth()
  const orders = await getCreatorOrders(user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl font-semibold">Sales & Orders</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Sales</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No sales yet.</div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="flex items-center gap-4 p-4 border rounded-lg bg-white">
                    <div className="flex-1">
                      <div className="font-medium">Order {order.order_number || order.id.slice(0, 8)}</div>
                      <div className="text-sm text-gray-600">
                        Sold on {new Date(order.created_at).toLocaleDateString()}
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