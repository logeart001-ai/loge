import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { processOrderCompletion } from '@/lib/order-processing'

// Use service role key for webhook (server-side only)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

/**
 * Paystack Webhook Handler
 * Handles payment events from Paystack for redundancy and real-time updates
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    const signature = request.headers.get('x-paystack-signature')
    const body = await request.text()

    if (!signature) {
      console.error('Missing Paystack signature')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    // Validate signature
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
      .update(body)
      .digest('hex')

    if (hash !== signature) {
      console.error('Invalid Paystack signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const event = JSON.parse(body)
    console.log('Paystack webhook event:', event.event)

    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        await handleSuccessfulPayment(event.data)
        break

      case 'charge.failed':
        await handleFailedPayment(event.data)
        break

      case 'transfer.success':
        await handleSuccessfulTransfer(event.data)
        break

      case 'transfer.failed':
        await handleFailedTransfer(event.data)
        break

      default:
        console.log('Unhandled webhook event:', event.event)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle successful payment
 */
async function handleSuccessfulPayment(data: {
  reference: string
  amount: number
  status: string
  customer: {
    email: string
  }
  metadata?: {
    order_id?: string
    cart_id?: string
  }
}) {
  try {
    const { reference, metadata } = data

    // Find order by payment reference
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('payment_reference', reference)
      .single()

    if (orderError || !order) {
      console.error('Order not found for reference:', reference)
      return
    }

    // Check if already processed
    if (order.payment_status === 'completed') {
      console.log('Payment already processed for order:', order.id)
      return
    }

    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'completed',
        order_status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)

    if (updateError) {
      console.error('Error updating order:', updateError)
      return
    }

    console.log('Order updated successfully:', order.id)

    // Get order items
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id)

    if (itemsError || !orderItems) {
      console.error('Error fetching order items:', itemsError)
      return
    }

    // Process order completion (wallet, notifications, cart)
    await processOrderCompletion(supabase, order, orderItems, metadata?.cart_id)

    console.log('Payment processing completed for order:', order.id)
  } catch (error) {
    console.error('Error handling successful payment:', error)
  }
}

/**
 * Handle failed payment
 */
async function handleFailedPayment(data: {
  reference: string
  status: string
}) {
  try {
    const { reference } = data

    // Find order by payment reference
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('payment_reference', reference)
      .single()

    if (orderError || !order) {
      console.error('Order not found for reference:', reference)
      return
    }

    // Update order status
    await supabase
      .from('orders')
      .update({
        payment_status: 'failed',
        order_status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)

    // Notify buyer
    await supabase.rpc('create_notification', {
      p_user_id: order.buyer_id,
      p_type: 'payment',
      p_title: 'Payment Failed',
      p_message: `Payment for order #${order.order_number || order.id.substring(0, 8)} failed. Please try again.`,
      p_data: { order_id: order.id, reference },
    } as never)

    console.log('Failed payment processed for order:', order.id)
  } catch (error) {
    console.error('Error handling failed payment:', error)
  }
}

/**
 * Handle successful transfer (creator payout)
 */
async function handleSuccessfulTransfer(data: {
  reference: string
  amount: number
  recipient: {
    name: string
    email: string
  }
}) {
  console.log('Transfer successful:', data.reference)
  // Update wallet transaction status if needed
}

/**
 * Handle failed transfer
 */
async function handleFailedTransfer(data: {
  reference: string
}) {
  console.log('Transfer failed:', data.reference)
  // Update wallet transaction status and notify admin
}
