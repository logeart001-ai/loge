import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { paystackService, toKobo } from '@/lib/paystack-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { cart_id, email } = body

    if (!cart_id || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: cart_id, email' },
        { status: 400 }
      )
    }

    // Get cart and calculate total
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select(`
        id,
        user_id,
        cart_items (
          id,
          artwork_id,
          quantity,
          unit_price,
          artworks (
            id,
            title,
            price,
            creator_id
          )
        )
      `)
      .eq('id', cart_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (cartError || !cart) {
      return NextResponse.json(
        { error: 'Cart not found or already processed' },
        { status: 404 }
      )
    }

    const cartItems = (cart.cart_items || []) as unknown as Array<{
      id: string
      artwork_id: string
      quantity: number
      unit_price: string | number
      artworks: {
        id: string
        title: string
        price: string | number
        creator_id: string
      } | null
    }>

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      )
    }

    // Calculate total amount
    const totalAmount = cartItems.reduce((sum, item) => {
      const price = typeof item.unit_price === 'string' 
        ? parseFloat(item.unit_price) 
        : item.unit_price
      return sum + (price * item.quantity)
    }, 0)

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        buyer_id: user.id,
        total_amount: totalAmount,
        subtotal: totalAmount,
        order_status: 'pending',
        payment_status: 'pending',
        shipping_address: {}, // TODO: Add shipping address collection
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Order creation error:', orderError)
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }

    // Create order items
    const orderItems = cartItems.map(item => ({
      order_id: order.id,
      artwork_id: item.artwork_id,
      quantity: item.quantity,
      unit_price: typeof item.unit_price === 'string' 
        ? parseFloat(item.unit_price) 
        : item.unit_price,
      creator_id: item.artworks?.creator_id || null,
    }))

    const { error: orderItemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (orderItemsError) {
      console.error('Order items error:', orderItemsError)
      // Rollback order
      await supabase.from('orders').delete().eq('id', order.id)
      return NextResponse.json(
        { error: 'Failed to create order items' },
        { status: 500 }
      )
    }

    // Initialize Paystack transaction
    const reference = `ORDER_${order.id}_${Date.now()}`
    const paystackResponse = await paystackService.instance.initializeTransaction({
      email,
      amount: toKobo(totalAmount),
      reference,
      metadata: {
        order_id: order.id,
        user_id: user.id,
        cart_id,
        custom_fields: [
          {
            display_name: 'Order ID',
            variable_name: 'order_id',
            value: order.id,
          },
        ],
      },
    })

    // Update order with payment reference
    await supabase
      .from('orders')
      .update({
        payment_reference: reference,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)

    return NextResponse.json({
      success: true,
      data: {
        authorization_url: paystackResponse.data.authorization_url,
        access_code: paystackResponse.data.access_code,
        reference,
        order_id: order.id,
      },
    })
  } catch (error) {
    console.error('Payment initialization error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to initialize payment'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
