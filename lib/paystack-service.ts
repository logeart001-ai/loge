'use server'

interface PaystackInitializeResponse {
  status: boolean
  message: string
  data: {
    authorization_url: string
    access_code: string
    reference: string
  }
}

interface PaystackVerifyResponse {
  status: boolean
  message: string
  data: {
    id: number
    status: 'success' | 'failed' | 'abandoned'
    reference: string
    amount: number
    currency: string
    customer: {
      email: string
    }
    metadata?: Record<string, unknown>
  }
}

export class PaystackService {
  private secretKey: string
  private baseUrl = 'https://api.paystack.co'

  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY || ''
    if (!this.secretKey) {
      throw new Error('PAYSTACK_SECRET_KEY is not configured')
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    body?: Record<string, unknown>
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Paystack API request failed')
    }

    return response.json()
  }

  /**
   * Initialize a payment transaction
   */
  async initializeTransaction(params: {
    email: string
    amount: number // in kobo (100 = ₦1)
    reference?: string
    metadata?: Record<string, unknown>
    callback_url?: string
  }): Promise<PaystackInitializeResponse> {
    const reference = params.reference || `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return this.makeRequest<PaystackInitializeResponse>('/transaction/initialize', 'POST', {
      email: params.email,
      amount: params.amount,
      reference,
      metadata: params.metadata,
      callback_url: params.callback_url || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/callback`,
    })
  }

  /**
   * Verify a payment transaction
   */
  async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
    return this.makeRequest<PaystackVerifyResponse>(`/transaction/verify/${reference}`)
  }

  /**
   * Create a transfer recipient (for payouts to creators)
   */
  async createTransferRecipient(params: {
    type: 'nuban' | 'mobile_money' | 'basa'
    name: string
    account_number: string
    bank_code: string
    currency?: string
  }) {
    return this.makeRequest('/transferrecipient', 'POST', {
      type: params.type,
      name: params.name,
      account_number: params.account_number,
      bank_code: params.bank_code,
      currency: params.currency || 'NGN',
    })
  }

  /**
   * Initiate a transfer (payout to creator)
   */
  async initiateTransfer(params: {
    amount: number // in kobo
    recipient: string // recipient code from createTransferRecipient
    reason?: string
    reference?: string
  }) {
    const reference = params.reference || `PAYOUT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return this.makeRequest('/transfer', 'POST', {
      source: 'balance',
      amount: params.amount,
      recipient: params.recipient,
      reason: params.reason || 'Creator payout',
      reference,
    })
  }

  /**
   * Get list of banks
   */
  async getBanks(country: string = 'nigeria') {
    return this.makeRequest(`/bank?country=${country}`)
  }

  /**
   * Verify account number
   */
  async verifyAccountNumber(params: {
    account_number: string
    bank_code: string
  }) {
    return this.makeRequest(
      `/bank/resolve?account_number=${params.account_number}&bank_code=${params.bank_code}`
    )
  }
}

// Export singleton instance
export const paystackService = new PaystackService()

/**
 * Helper function to convert amount to kobo
 */
export function toKobo(amount: number): number {
  return Math.round(amount * 100)
}

/**
 * Helper function to convert kobo to naira
 */
export function fromKobo(kobo: number): number {
  return kobo / 100
}
