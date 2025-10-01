'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

function PaymentCallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')
  const [message, setMessage] = useState('')
  const [orderData, setOrderData] = useState<{
    order_id: string
    amount: number
    reference: string
  } | null>(null)

  useEffect(() => {
    const verifyPayment = async () => {
      const reference = searchParams.get('reference')
      
      if (!reference) {
        setStatus('failed')
        setMessage('No payment reference found')
        return
      }

      try {
        const response = await fetch(`/api/payments/verify?reference=${reference}`)
        const data = await response.json()

        if (data.success) {
          setStatus('success')
          setMessage('Payment successful!')
          setOrderData(data.data)
        } else {
          setStatus('failed')
          setMessage(data.message || 'Payment verification failed')
        }
      } catch {
        setStatus('failed')
        setMessage('An error occurred while verifying your payment')
      }
    }

    verifyPayment()
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-orange-50 to-red-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Payment Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            {status === 'loading' && (
              <>
                <Loader2 className="h-16 w-16 animate-spin text-orange-500" />
                <p className="text-lg text-gray-700">Verifying your payment...</p>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle2 className="h-16 w-16 text-green-500" />
                <div className="text-center space-y-2">
                  <p className="text-xl font-semibold text-green-600">{message}</p>
                  <p className="text-sm text-gray-600">Thank you for your purchase!</p>
                </div>
                {orderData && (
                  <div className="w-full bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order ID:</span>
                      <span className="font-medium">{orderData.order_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-medium">₦{orderData.amount?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reference:</span>
                      <span className="font-mono text-xs">{orderData.reference}</span>
                    </div>
                  </div>
                )}
                <div className="w-full space-y-2">
                  <Button 
                    onClick={() => router.push('/dashboard/collector/orders')}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                  >
                    View My Orders
                  </Button>
                  <Button 
                    onClick={() => router.push('/art')}
                    variant="outline"
                    className="w-full"
                  >
                    Continue Shopping
                  </Button>
                </div>
              </>
            )}

            {status === 'failed' && (
              <>
                <XCircle className="h-16 w-16 text-red-500" />
                <div className="text-center space-y-2">
                  <p className="text-xl font-semibold text-red-600">Payment Failed</p>
                  <p className="text-sm text-gray-600">{message}</p>
                </div>
                <div className="w-full space-y-2">
                  <Button 
                    onClick={() => router.push('/cart')}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                  >
                    Return to Cart
                  </Button>
                  <Button 
                    onClick={() => router.push('/art')}
                    variant="outline"
                    className="w-full"
                  >
                    Continue Shopping
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-orange-500" />
      </div>
    }>
      <PaymentCallbackContent />
    </Suspense>
  )
}
