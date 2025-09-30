import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentWebhook {
  event: string
  data: {
    reference: string
    amount: number
    currency: string
    status: string
    customer: {
      email: string
    }
    metadata?: any
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify Paystack webhook signature
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')
    const signature = req.headers.get('x-paystack-signature')
    
    if (!signature || !paystackSecretKey) {
      return new Response('Unauthorized', { status: 401 })
    }

    const body = await req.text()
    const hash = await crypto.subtle.digest(
      'SHA-512',
      new TextEncoder().encode(paystackSecretKey + body)
    )
    const expectedSignature = Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    if (signature !== expectedSignature) {
      return new Response('Invalid signature', { status: 401 })
    }

    const webhook: PaymentWebhook = JSON.parse(body)

    // Handle successful payment
    if (webhook.event === 'charge.success' && webhook.data.status === 'success') {
      const { reference, amount, currency, customer, metadata } = webhook.data

      // Find the order by payment reference
      const { data: order, error: orderError } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('payment_reference', reference)
        .single()

      if (orderError || !order) {
        console.error('Order not found for reference:', reference)
        return new Response('Order not found', { status: 404 })
      }

      // Update order status
      await supabaseClient
        .from('orders')
        .update({
          payment_status: 'completed',
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id)

      // Process creator payout (85% to creator)
      const creatorEarnings = (amount / 100) * 0.85 // Convert from kobo and take 85%
      
      await supabaseClient.rpc('update_creator_earnings', {
        creator_id: order.seller_id,
        amount: creatorEarnings
      })

      // Create shipment if needed
      if (metadata?.create_shipment) {
        // This would integrate with your logistics system
        console.log('Creating shipment for order:', order.id)
      }

      // Send confirmation emails
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: customer.email,
          subject: 'Payment Confirmed - Your Order is Being Processed',
          html: `
            <h2>Payment Confirmed!</h2>
            <p>Thank you for your purchase. Your order #${order.id} has been confirmed.</p>
            <p>Amount: ${currency} ${(amount / 100).toLocaleString()}</p>
            <p>We'll notify you once your item ships.</p>
          `,
          type: 'payment_confirmation',
          metadata: { orderId: order.id, reference }
        })
      })

      return new Response(
        JSON.stringify({ success: true, message: 'Payment processed successfully' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Handle failed payment
    if (webhook.event === 'charge.failed') {
      console.log('Payment failed:', webhook.data.reference)
      
      // Update order status if exists
      await supabaseClient
        .from('orders')
        .update({
          payment_status: 'failed',
          status: 'cancelled'
        })
        .eq('payment_reference', webhook.data.reference)
    }

    return new Response('OK', { status: 200 })

  } catch (error) {
    console.error('Payment webhook error:', error)
    return new Response('Internal server error', { status: 500 })
  }
})

/* To deploy:
supabase functions deploy process-payment
supabase secrets set PAYSTACK_SECRET_KEY=your_secret_key
*/