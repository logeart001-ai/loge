import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { paystackService, toKobo } from '@/lib/paystack-service'

export async function POST(request: NextRequest) {
  try {
    console.log('🔥 Payment initialization started')
    const supabase = await createRouteHandlerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('🔥 Auth error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🔥 User authenticated:', user.email)

    const body = await request.json()
    const { cart_id, email, shipping } = body
    console.log('🔥 Request body:', { cart_id, email, hasShipping: !!shipping })

    if (!cart_id || !email) {
      console.log('🔥 Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields: cart_id, email' },
        { status: 400 }
      )
    }

    if (!shipping) {
      console.log('🔥 Missing shipping information')
      return NextResponse.json(
        { error: 'Please select a shipping option' },
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
      console.log('🔥 Cart error:', cartError)
      console.log('🔥 Cart data:', cart)
      return NextResponse.json(
        { error: 'Cart not found or already processed' },
        { status: 404 }
      )
    }

    console.log('🔥 Cart found:', { id: cart.id, itemCount: cart.cart_items?.length || 0 })

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

    // Calculate subtotal
    const subtotal = cartItems.reduce((sum, item) => {
      const price = typeof item.unit_price === 'string' 
        ? parseFloat(item.unit_price) 
        : item.unit_price
      return sum + (price * item.quantity)
    }, 0)

    // Add shipping cost
    const shippingCost = shipping.price || 0
    const totalAmount = subtotal + shippingCost
    
    console.log('🔥 Order totals:', { subtotal, shippingCost, totalAmount })

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`

    // For now, create a single order for the first item (simplified approach)
    const firstItem = cartItems[0]
    
    // Safely get seller_id - verify the creator exists
    let sellerId = null
    if (firstItem.artworks?.creator_id) {
      try {
        // Check if the creator exists in profiles table (which should have valid user references)
        const { data: creatorProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id, user_type')
          .eq('id', firstItem.artworks.creator_id)
          .single()
        
        if (creatorProfile && !profileError) {
          sellerId = firstItem.artworks.creator_id
          console.log('🔥 Valid creator found:', sellerId, 'type:', creatorProfile.user_type)
        } else {
          console.warn('🔥 Creator profile not found for artwork:', firstItem.artwork_id, 'creator_id:', firstItem.artworks.creator_id, 'error:', profileError?.message)
        }
      } catch (error) {
        console.error('🔥 Error checking creator:', error)
      }
    }
    
    // If no valid seller found, the order can still be created with seller_id = null
    // This allows the payment to proceed, and the seller can be updated later
    if (!sellerId) {
      console.log('🔥 Creating order without seller_id - will need manual assignment later')
    }
    
    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        buyer_id: user.id,
        seller_id: sellerId,
        item_id: firstItem.artwork_id,
        item_type: 'artwork',
        quantity: firstItem.quantity,
        unit_price: typeof firstItem.unit_price === 'string' 
          ? parseFloat(firstItem.unit_price) 
          : firstItem.unit_price,
        total_amount: totalAmount,
        subtotal: subtotal,
        shipping_cost: shippingCost,
        status: 'pending',
        payment_status: 'pending',
        shipping_address: {
          provider: shipping.provider,
          service_type: shipping.service_type,
          estimated_delivery_days: shipping.estimated_delivery_days,
          tracking_available: shipping.tracking_available
        },
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('🔥 Order creation error:', orderError)
      console.error('🔥 Order creation details:', {
        orderNumber,
        buyer_id: user.id,
        totalAmount,
        error: orderError
      })
      return NextResponse.json(
        { error: `Failed to create order: ${orderError?.message || 'Unknown error'}` },
        { status: 500 }
      )
    }

    console.log('🔥 Order created successfully:', order.id)

    // Create order_items entries for each cart item
    // This allows creators to see their sales in the dashboard
    try {
      const orderItemsToInsert = cartItems.map(item => ({
        order_id: order.id,
        artwork_id: item.artwork_id,
        creator_id: item.artworks?.creator_id || sellerId,
        artwork_title: item.artworks?.title || 'Untitled',
        quantity: item.quantity,
        price_at_purchase: typeof item.unit_price === 'string' 
          ? parseFloat(item.unit_price) 
          : item.unit_price,
        total_price: (typeof item.unit_price === 'string' 
          ? parseFloat(item.unit_price) 
          : item.unit_price) * item.quantity,
        creator_commission_rate: 0.85,
        platform_fee_rate: 0.15,
        creator_earnings: (typeof item.unit_price === 'string' 
          ? parseFloat(item.unit_price) 
          : item.unit_price) * item.quantity * 0.85,
        platform_earnings: (typeof item.unit_price === 'string' 
          ? parseFloat(item.unit_price) 
          : item.unit_price) * item.quantity * 0.15,
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsToInsert)

      if (itemsError) {
        console.error('🔥 Error creating order items:', itemsError)
        // Don't fail the order creation, just log the error
      } else {
        console.log('🔥 Created', orderItemsToInsert.length, 'order items')
      }
    } catch (itemsErr) {
      console.error('🔥 Exception creating order items:', itemsErr)
      // Continue with payment initialization even if order_items creation fails
    }

    console.log('🔥 Order created for', cartItems.length, 'item(s)')

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
