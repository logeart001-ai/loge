import { requireAuth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type OrderRow = {
  id: string
  order_number?: string | null
  total_amount?: number | string | null
  status?: string | null
  created_at: string
  buyer_id?: string | null
  order_items?: OrderItemRow[]
}

type OrderItemRow = {
  id: string
  order_id: string
  artwork_id: string
  artwork_title?: string | null
  quantity: number
  price_at_purchase: number
  creator_id: string
}

async function getCreatorOrders(userId: string) {
  try {
    const supabase = await createServerClient()

    // Use the helper function from SQL migration to get creator's orders
    // This function uses SECURITY DEFINER to safely bypass RLS
    const { data, error } = await supabase
      .rpc('get_creator_orders', { creator_uuid: userId })

    if (error) {
      console.error('Error fetching creator orders:', error.message)
      return []
    }
    
    // Now get the order items for each order
    if (data && data.length > 0) {
      const orderIds = data.map((order: OrderRow) => order.id)
      
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds)
        .eq('creator_id', userId)
      
      if (!itemsError && itemsData) {
        // Attach items to orders
        return data.map((order: OrderRow) => ({
          ...order,
          order_items: itemsData.filter((item: OrderItemRow) => item.order_id === order.id)
        }))
      }
    }
    
    return data || []
  } catch (err) {
    console.error('Exception in getCreatorOrders:', err)
    return []
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
                {orders.map((order: OrderRow) => (
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