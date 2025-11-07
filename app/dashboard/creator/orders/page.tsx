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

    // Try using the helper function first
    let data: OrderRow[] = []
    
    try {
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_creator_orders', { creator_uuid: userId })

      if (!rpcError && rpcData) {
        data = rpcData
        console.log('Fetched orders using RPC function:', data.length)
      }
    } catch (rpcErr) {
      console.log('RPC function not available, using direct query')
    }

    // Fallback: Query orders table directly where user is the seller
    if (data.length === 0) {
      const { data: directData, error: directError } = await supabase
        .from('orders')
        .select('*')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false })

      if (!directError && directData) {
        data = directData
        console.log('Fetched orders using direct query:', data.length)
      }
    }
    
    // Get order items for each order
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
              <div className="text-center py-12">
                <div className="text-gray-400 mb-2">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg font-medium">No sales yet</p>
                <p className="text-gray-400 text-sm mt-1">Your sales will appear here when customers purchase your artworks</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order: OrderRow) => {
                  const totalAmount = typeof order.total_amount === 'string' 
                    ? parseFloat(order.total_amount) 
                    : (order.total_amount || 0)
                  const itemCount = order.order_items?.length || 1
                  
                  return (
                    <div key={order.id} className="border rounded-lg bg-white overflow-hidden hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4 p-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="font-semibold text-gray-900">
                              Order #{order.order_number || order.id.slice(0, 8).toUpperCase()}
                            </div>
                            <Badge variant={order.status === 'delivered' ? 'default' : order.status === 'confirmed' ? 'secondary' : 'outline'}>
                              {order.status || 'pending'}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            {new Date(order.created_at).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </div>
                          {itemCount > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              {itemCount} item{itemCount !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-gray-900">
                            ₦{totalAmount.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Total amount
                          </div>
                        </div>
                      </div>
                      
                      {/* Show order items if available */}
                      {order.order_items && order.order_items.length > 0 && (
                        <div className="border-t bg-gray-50 px-4 py-3">
                          <div className="text-xs font-medium text-gray-700 mb-2">Items in this order:</div>
                          <div className="space-y-1">
                            {order.order_items.map((item: OrderItemRow) => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span className="text-gray-700">
                                  {item.artwork_title || 'Artwork'} × {item.quantity}
                                </span>
                                <span className="font-medium text-gray-900">
                                  ₦{(item.price_at_purchase * item.quantity)ring()}
                        >
               
            
          
   
    )}         
</div>        
         })}             
     )     
        /div>      <      
               )}              >     </div                iv> </d                   ))}                 </div>           </span       .toLocaleSt
          </CardContent>
        </Card>
      </div>
    </div>
  )
}