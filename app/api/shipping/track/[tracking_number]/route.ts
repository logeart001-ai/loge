import { NextRequest, NextResponse } from 'next/server'
import { LogisticsService } from '@/lib/logistics/logistics-service'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { tracking_number: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tracking_number } = params

    // Get shipment from database to verify user access and get provider
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select(`
        *,
        orders!inner(buyer_id, seller_id)
      `)
      .eq('tracking_number', tracking_number)
      .single()

    if (shipmentError || !shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 })
    }

    // Check if user has access to this shipment
    const hasAccess = shipment.orders.buyer_id === user.id || shipment.orders.seller_id === user.id
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const logisticsService = new LogisticsService()
    
    try {
      const trackingInfo = await logisticsService.trackShipment(
        tracking_number,
        shipment.provider
      )

      // Update shipment status in database
      await supabase
        .from('shipments')
        .update({
          status: trackingInfo.status,
          current_location: trackingInfo.current_location,
          estimated_delivery_date: trackingInfo.estimated_delivery,
          actual_delivery_date: trackingInfo.status === 'delivered' ? new Date().toISOString() : null
        })
        .eq('tracking_number', tracking_number)

      // Store tracking events
      if (trackingInfo.history && trackingInfo.history.length > 0) {
        const eventsToInsert = trackingInfo.history.map(event => ({
          shipment_id: shipment.id,
          timestamp: event.timestamp,
          status: event.status,
          location: event.location,
          description: event.description
        }))

        // Only insert new events (check if they don't already exist)
        const { data: existingEvents } = await supabase
          .from('tracking_events')
          .select('timestamp, status')
          .eq('shipment_id', shipment.id)

        const existingEventKeys = new Set(
          existingEvents?.map(e => `${e.timestamp}-${e.status}`) || []
        )

        const newEvents = eventsToInsert.filter(
          event => !existingEventKeys.has(`${event.timestamp}-${event.status}`)
        )

        if (newEvents.length > 0) {
          await supabase
            .from('tracking_events')
            .insert(newEvents)
        }
      }

      return NextResponse.json({
        tracking_info: trackingInfo,
        shipment: {
          id: shipment.id,
          order_id: shipment.order_id,
          provider: shipment.provider,
          status: trackingInfo.status,
          shipping_cost: shipment.shipping_cost,
          created_at: shipment.created_at
        }
      })
    } catch (providerError) {
      console.error('Provider tracking error:', providerError)
      
      // Return cached data from database if provider fails
      const { data: cachedEvents } = await supabase
        .from('tracking_events')
        .select('*')
        .eq('shipment_id', shipment.id)
        .order('timestamp', { ascending: true })

      return NextResponse.json({
        tracking_info: {
          tracking_number,
          status: shipment.status,
          current_location: shipment.current_location,
          estimated_delivery: shipment.estimated_delivery_date,
          history: cachedEvents || []
        },
        shipment: {
          id: shipment.id,
          order_id: shipment.order_id,
          provider: shipment.provider,
          status: shipment.status,
          shipping_cost: shipment.shipping_cost,
          created_at: shipment.created_at
        },
        note: 'Showing cached tracking data'
      })
    }
  } catch (error) {
    console.error('Track shipment error:', error)
    return NextResponse.json(
      { error: 'Failed to track shipment' },
      { status: 500 }
    )
  }
}