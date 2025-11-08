import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try using the RPC function first
    let orders = []
    
    try {
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_creator_orders', { creator_uuid: user.id })

      if (!rpcError && rpcData) {
        orders = rpcData
      }
    } catch (rpcErr) {
      console.log('RPC function not available, using direct query')
    }

    // Fallback: Query orders table directly where user is the seller
    if (orders.length === 0) {
      const { data: directData, error: directError } = await supabase
        .from('orders')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })

      if (!directError && directData) {
        orders = directData
      }
    }
    
    // Get order items for each order
    if (orders && orders.length > 0) {
      const orderIds = orders.map((order: any) => order.id)
      
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds)
        .eq('creator_id', user.id)
      
      if (!itemsError && itemsData) {
        // Attach items to orders
        orders = orders.map((order: any) => ({
          ...order,
          order_items: itemsData.filter((item: any) => item.order_id === order.id)
        }))
      }
    }

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Error fetching sales:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sales' },
      { status: 500 }
    )
  }
}
