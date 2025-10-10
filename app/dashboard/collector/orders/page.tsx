import { requireAuth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Order = {
  id: string
  order_number?: string | null
  total_amount?: number | string | null
  status?: string | null
  created_at: string
  order_items?: OrderItem[]
}

type OrderItem = {
  id: string
  artwork_id: string
  artwork_title?: string | null
  quantity: number
  price_at_purchase: number
}

async function getOrders(userId: string): Promise<Order[]> {
  try {
    const supabase = await createServerClient()
    
    // Now using proper RLS - buyers can see their own orders
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          artwork_id,
          artwork_title,
          quantity,
          price_at_purchase
        )
      `)
      .eq('buyer_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching orders:', error.message)
      return []
    }
    
    return data || []
  } catch (err) {
    console.error('Exception in getOrders:', err)
    return []
  }
}

export default async function CollectorOrdersPage() {
  const user = await requireAuth()
  const orders = await getOrders(user.id)

  return (
    <div className="min-h-screen bg-gray-50">
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
                {orders.map((order: Order) => (
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