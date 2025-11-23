'use client'

import { Suspense, useEffect, useState, Component, ReactNode } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react'
import { useCart } from '@/components/cart-provider'

// Error Boundary to catch runtime errors
class PaymentErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Payment page error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center text-2xl text-red-600">Payment Page Error</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-center space-y-4">
                <AlertTriangle className="h-16 w-16 text-red-500" />
                <p className="text-center text-gray-700">
                  An unexpected error occurred while processing your payment.
                </p>
                <p className="text-sm text-gray-600 text-center">
                  Your payment may have been successful. Please check your email or contact support.
                </p>
                <div className="w-full space-y-2">
                  <Button 
                    onClick={() => window.location.href = '/dashboard/collector/orders'}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                  >
                    View My Orders
                  </Button>
                  <Button 
                    onClick={() => window.location.href = '/cart'}
                    variant="outline"
                    className="w-full"
                  >
                    Return to Cart
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

function PaymentCallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { refresh: refreshCart } = useCart()
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'timeout'>('loading')
  const [message, setMessage] = useState('')
  const [debugInfo, setDebugInfo] = useState<string>('')
  const [orderData, setOrderData] = useState<{
    order_id: string
    amount: number
    reference: string
  } | null>(null)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    let isMounted = true

    const verifyPayment = async () => {
      try {
        console.log('🔥 Payment callback page loaded')
        console.log('🔥 Current URL:', window.location.href)
        
        const reference = searchParams.get('reference')
        console.log('🔥 Payment reference from URL:', reference)
        
        if (!reference) {
          console.error('🔥 ERROR: No payment reference found in URL')
          if (isMounted) {
            setStatus('failed')
            setMessage('No payment reference found in the URL. Your payment may have been completed - please check your orders.')
            setDebugInfo('Missing reference parameter')
          }
          return
        }

        // Set timeout for API call (30 seconds)
        timeoutId = setTimeout(() => {
          if (isMounted && status === 'loading') {
            console.error('🔥 ERROR: Payment verification timed out')
            setStatus('timeout')
            setMessage('Payment verification is taking longer than expected')
            setDebugInfo('API timeout after 30s')
          }
        }, 30000)

        console.log('🔥 About to call verification API:', `/api/payments/verify?reference=${reference}`)
        
        const response = await fetch(`/api/payments/verify?reference=${reference}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        console.log('🔥 Verification API response status:', response.status)
        console.log('🔥 Verification API response ok:', response.ok)

        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`)
        }

        const data = await response.json()
        console.log('🔥 Verification API response data:', JSON.stringify(data, null, 2))

        if (!isMounted) return // Component unmounted, don't update state

        if (data.success) {
          console.log('🔥 ✅ Payment verification successful')
          setStatus('success')
          setMessage('Payment successful!')
          
          if (data.data) {
            setOrderData(data.data)
          }
          
          // Refresh cart to clear purchased items
          try {
            console.log('🔥 Attempting to refresh cart after successful payment')
            await refreshCart()
            console.log('🔥 ✅ Cart refreshed successfully')
          } catch (cartError) {
            // Don't fail the whole flow if cart refresh fails
            console.error('🔥 ⚠️ Cart refresh failed (non-critical):', cartError)
          }
        } else {
          console.error('🔥 ❌ Payment verification returned success=false')
          setStatus('failed')
          setMessage(data.message || data.error || 'Payment verification failed')
          setDebugInfo(JSON.stringify(data))
        }
      } catch (error) {
        console.error('🔥 ❌ CRITICAL ERROR in payment verification:', error)
        console.error('🔥 Error details:', error instanceof Error ? error.message : String(error))
        
        if (isMounted) {
          setStatus('failed')
          setMessage('An error occurred while verifying your payment. Please check your orders or contact support.')
          setDebugInfo(error instanceof Error ? error.message : 'Unknown error')
        }
      } finally {
        clearTimeout(timeoutId)
      }
    }

    verifyPayment()

    // Cleanup function
    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [searchParams, refreshCart, status])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-orange-50 to-red-50">
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

            {(status === 'failed' || status === 'timeout') && (
              <>
                {status === 'timeout' ? (
                  <AlertTriangle className="h-16 w-16 text-yellow-500" />
                ) : (
                  <XCircle className="h-16 w-16 text-red-500" />
                )}
                <div className="text-center space-y-2">
                  <p className="text-xl font-semibold text-red-600">
                    {status === 'timeout' ? 'Verification Timeout' : 'Payment Failed'}
                  </p>
                  <p className="text-sm text-gray-600">{message}</p>
                  {debugInfo && process.env.NODE_ENV !== 'production' && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer">Debug Info</summary>
                      <pre className="text-xs text-left bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-32">
                        {debugInfo}
                      </pre>
                    </details>
                  )}
                </div>
                <div className="w-full space-y-2">
                  {status === 'timeout' && (
                    <Button 
                      onClick={() => router.push('/dashboard/collector/orders')}
                      className="w-full bg-blue-500 hover:bg-blue-600"
                    >
                      Check My Orders
                    </Button>
                  )}
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
    <PaymentErrorBoundary>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
          <div className="text-center">
            <Loader2 className="h-16 w-16 animate-spin text-orange-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading payment status...</p>
          </div>
        </div>
      }>
        <PaymentCallbackContent />
      </Suspense>
    </PaymentErrorBoundary>
  )
}
