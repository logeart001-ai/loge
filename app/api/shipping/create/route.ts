import { NextRequest, NextResponse } from 'next/server'
import { LogisticsService } from '@/lib/logistics/logistics-service'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      order_id, 
      pickup_address, 
      delivery_address, 
      package_details, 
      provider_name,
      shipping_cost,
      insurance_cost = 0,
      special_instructions
    } = body

    // Validate required fields
    if (!order_id || !pickup_address || !delivery_address || !package_details || !shipping_cost) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify user owns the order or is the seller
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('buyer_id, seller_id')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.buyer_id !== user.id && order.seller_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const logisticsService = new LogisticsService()
    
    const shipmentResult = await logisticsService.createShipment({
      pickup_address,
      delivery_address,
      package_details
    }, provider_name)

    // Store shipment in database
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .insert({
        order_id,
        tracking_number: shipmentResult.tracking_number,
        provider: shipmentResult.provider,
        pickup_address,
        delivery_address,
        package_details,
        shipping_cost,
        insurance_cost,
        label_url: shipmentResult.label_url,
        special_instructions,
        status: 'pending'
      })
      .select()
      .single()

    if (shipmentError) {
      console.error('Database error:', shipmentError)
      return NextResponse.json(
        { error: 'Failed to save shipment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      shipment,
      tracking_number: shipmentResult.tracking_number,
      label_url: shipmentResult.label_url
    })
  } catch (error) {
    console.error('Create shipment error:', error)
    return NextResponse.json(
      { error: 'Failed to create shipment' },
      { status: 500 }
    )
  }
}