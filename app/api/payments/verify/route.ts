import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { paystackService, fromKobo } from '@/lib/paystack-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const reference = searchParams.get('reference')

    if (!reference) {
      return NextResponse.json(
        { error: 'Payment reference is required' },
        { status: 400 }
      )
    }

    // Verify payment with Paystack
    const verification = await paystackService.instance.verifyTransaction(reference)

    if (!verification.status) {
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      )
    }

    const paymentData = verification.data

    // Only process successful payments
    if (paymentData.status !== 'success') {
      return NextResponse.json({
        success: false,
        status: paymentData.status,
        message: 'Payment was not successful',
      })
    }

    const supabase = await createServerClient()

    // Find the order by payment reference
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('payment_reference', reference)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check if already processed
    if (order.payment_status === 'completed') {
      return NextResponse.json({
        success: true,
        data: {
          order_id: order.id,
          amount: fromKobo(paymentData.amount),
          status: 'already_processed',
          reference: paymentData.reference,
        },
      })
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
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      )
    }

    // Get order items to create wallet transactions for creators
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*, artworks(creator_id, title)')
      .eq('order_id', order.id)

    if (!itemsError && orderItems) {
      // Group by creator and create wallet transactions
      const creatorTotals = new Map<string, number>()
      
      for (const item of orderItems) {
        const creatorId = (item.artworks as { creator_id: string } | null)?.creator_id
        if (creatorId) {
          const currentTotal = creatorTotals.get(creatorId) || 0
          const itemPrice = typeof item.unit_price === 'string' 
            ? parseFloat(item.unit_price) 
            : item.unit_price
          creatorTotals.set(creatorId, currentTotal + (itemPrice * item.quantity))
        }
      }

      // Create wallet transactions for each creator
      for (const [creatorId, amount] of creatorTotals) {
        await supabase
          .from('wallet_transactions')
          .insert({
            user_id: creatorId,
            amount,
            transaction_type: 'credit',
            status: 'completed',
            description: `Payment for order #${order.id}`,
            reference: `ORDER_${order.id}`,
          })
      }
    }

    // Mark cart as completed
    const metadata = paymentData.metadata as { cart_id?: string } | undefined
    if (metadata?.cart_id) {
      await supabase
        .from('carts')
        .update({ status: 'completed' })
        .eq('id', metadata.cart_id)
    }

    return NextResponse.json({
      success: true,
      data: {
        order_id: order.id,
        amount: fromKobo(paymentData.amount),
        status: paymentData.status,
        reference: paymentData.reference,
      },
    })
  } catch (error) {
    console.error('Payment verification error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Payment verification failed'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
