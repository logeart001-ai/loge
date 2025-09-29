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
    const { pickup_address, delivery_address, package_details } = body

    // Validate required fields
    if (!pickup_address || !delivery_address || !package_details) {
      return NextResponse.json(
        { error: 'Missing required fields: pickup_address, delivery_address, package_details' },
        { status: 400 }
      )
    }

    const logisticsService = new LogisticsService()
    
    const quotes = await logisticsService.getShippingQuotes({
      pickup_address,
      delivery_address,
      package_details
    })

    // Store quotes in database for reference
    const quotesToStore = quotes.map(quote => ({
      user_id: user.id,
      provider: quote.provider,
      service_type: quote.service_type,
      price: quote.price,
      estimated_delivery_days: quote.estimated_delivery_days,
      pickup_address,
      delivery_address,
      package_details
    }))

    if (quotesToStore.length > 0) {
      await supabase
        .from('shipping_quotes')
        .insert(quotesToStore)
    }

    return NextResponse.json({ quotes })
  } catch (error) {
    console.error('Shipping quote error:', error)
    return NextResponse.json(
      { error: 'Failed to get shipping quotes' },
      { status: 500 }
    )
  }
}