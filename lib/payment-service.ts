import { createClient } from '@/lib/supabase'

export interface PaymentData {
  amount: number
  currency: string
  email: string
  reference: string
  callback_url?: string
  metadata?: any
}

export interface PaymentResult {
  success: boolean
  reference?: string
  authorization_url?: string
  error?: string
}

export class PaymentService {
  private supabase = createClient()
  private paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
  private paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY

  /**
   * Initialize Paystack payment
   */
  async initializePayment(data: PaymentData): Promise<PaymentResult> {
    try {
      if (!this.paystackSecretKey) {
        throw new Error('Paystack secret key not configured')
      }

      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.paystackSecretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: Math.round(data.amount * 100), // Convert to kobo
          currency: data.currency,
          email: data.email,
          reference: data.reference,
          callback_url: data.callback_url,
          metadata: data.metadata
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Payment initialization failed')
      }

      return {
        success: true,
        reference: result.data.reference,
        authorization_url: result.data.authorization_url
      }
    } catch (error) {
      console.error('Payment initialization error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment initialization failed'
      }
    }
  }

  /**
   * Verify Paystack payment
   */
  async verifyPayment(reference: string): Promise<{
    success: boolean
    status?: string
    amount?: number
    currency?: string
    customer?: any
    metadata?: any
    error?: string
  }> {
    try {
      if (!this.paystackSecretKey) {
        throw new Error('Paystack secret key not configured')
      }

      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          'Authorization': `Bearer ${this.paystackSecretKey}`
        }
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Payment verification failed')
      }

      return {
        success: true,
        status: result.data.status,
        amount: result.data.amount / 100, // Convert from kobo
        currency: result.data.currency,
        customer: result.data.customer,
        metadata: result.data.metadata
      }
    } catch (error) {
      console.error('Payment verification error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment verification failed'
      }
    }
  }

  /**
   * Create order after successful payment
   */
  async createOrder(
    buyerId: string,
    sellerId: string,
    itemId: string,
    itemType: 'art' | 'book' | 'fashion',
    paymentData: {
      reference: string
      amount: number
      currency: string
      shippingCost?: number
    }
  ): Promise<{ success: boolean; orderId?: string; error?: string }> {
    try {
      const { data: order, error } = await this.supabase
        .from('orders')
        .insert({
          buyer_id: buyerId,
          seller_id: sellerId,
          item_id: itemId,
          item_type: itemType,
          quantity: 1,
          unit_price: paymentData.amount,
          total_amount: paymentData.amount + (paymentData.shippingCost || 0),
          shipping_cost: paymentData.shippingCost || 0,
          status: 'confirmed',
          payment_status: 'completed',
          payment_reference: paymentData.reference
        })
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        orderId: order.id
      }
    } catch (error) {
      console.error('Order creation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Order creation failed'
      }
    }
  }

  /**
   * Process creator payout (simplified version)
   */
  async processCreatorPayout(
    creatorId: string,
    amount: number,
    orderId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // In a real implementation, you would:
      // 1. Get creator's bank details from their profile
      // 2. Use Paystack Transfer API to send money
      // 3. Handle transfer webhooks for status updates
      // 4. Update creator earnings in database

      // For now, we'll just log the payout and update earnings
      console.log('Creator payout would be processed:', {
        creatorId,
        amount,
        orderId
      })

      // Update creator earnings (simplified)
      const { error } = await this.supabase.rpc('update_creator_earnings', {
        creator_id: creatorId,
        amount: amount * 0.85 // 85% to creator, 15% platform fee
      })

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Payout processing error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payout processing failed'
      }
    }
  }

  /**
   * Generate payment reference
   */
  generatePaymentReference(prefix: string = 'LOGE'): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `${prefix}_${timestamp}_${random}`
  }

  /**
   * Calculate platform fees
   */
  calculateFees(amount: number): {
    platformFee: number
    creatorEarnings: number
    paystackFee: number
    netAmount: number
  } {
    const paystackFee = Math.max(100, amount * 0.015) // 1.5% or ₦100 minimum
    const platformFee = amount * 0.15 // 15% platform fee
    const creatorEarnings = amount - platformFee - paystackFee
    const netAmount = amount - paystackFee

    return {
      platformFee,
      creatorEarnings,
      paystackFee,
      netAmount
    }
  }

  /**
   * Get Paystack public key for frontend
   */
  getPublicKey(): string | undefined {
    return this.paystackPublicKey
  }
}

// Export singleton instance
export const paymentService = new PaymentService()

// SQL function to update creator earnings (run this in Supabase)
/*
CREATE OR REPLACE FUNCTION update_creator_earnings(creator_id UUID, amount DECIMAL)
RETURNS VOID AS $$
BEGIN
  -- Update or insert creator earnings
  INSERT INTO creator_earnings (creator_id, total_earnings, updated_at)
  VALUES (creator_id, amount, NOW())
  ON CONFLICT (creator_id) 
  DO UPDATE SET 
    total_earnings = creator_earnings.total_earnings + amount,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create creator_earnings table if it doesn't exist
CREATE TABLE IF NOT EXISTS creator_earnings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE,
  total_earnings DECIMAL(12,2) DEFAULT 0,
  pending_earnings DECIMAL(12,2) DEFAULT 0,
  withdrawn_earnings DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
*/