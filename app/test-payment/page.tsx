'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Navbar } from '@/components/navbar'
import { useCart } from '@/components/cart-provider'
import { useUser } from '@/lib/use-user'
import { ShoppingCart, CreditCard, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function TestPaymentPage() {
  const { cart, addItem, loading: cartLoading } = useCart()
  const { user } = useUser()
  const [testEmail, setTestEmail] = useState('test@example.com')
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const [checkingOut, setCheckingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Test artworks for payment testing
  const testArtworks = [
    {
      id: 'test-artwork-1',
      title: 'Test Artwork 1',
      artist: 'Test Artist',
      price: 50000, // ₦500
      image: '/image/placeholder.svg',
      description: 'A test artwork for payment integration testing'
    },
    {
      id: 'test-artwork-2',
      title: 'Test Artwork 2',
      artist: 'Another Artist',
      price: 75000, // ₦750
      image: '/image/placeholder.svg',
      description: 'Another test artwork for payment testing'
    },
    {
      id: 'test-artwork-3',
      title: 'Premium Test Art',
      artist: 'Premium Artist',
      price: 120000, // ₦1,200
      image: '/image/placeholder.svg',
      description: 'A premium test artwork for higher value testing'
    }
  ]

  const handleAddToCart = async (artworkId: string) => {
    if (!user) {
      setError('Please sign in to add items to cart')
      return
    }

    setAddingToCart(artworkId)
    setError(null)
    
    try {
      await addItem(artworkId, 1)
      setSuccess(`Added artwork to cart!`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to cart')
    } finally {
      setAddingToCart(null)
    }
  }

  const handleCheckout = async () => {
    if (!cart || !user?.email) {
      setError('Please sign in and add items to cart first')
      return
    }

    setCheckingOut(true)
    setError(null)

    try {
      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cart_id: cart.id,
          email: testEmail || user.email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize payment')
      }

      // Redirect to Paystack payment page
      if (data.data?.authorization_url) {
        window.location.href = data.data.authorization_url
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setError(err instanceof Error ? err.message : 'Failed to proceed to checkout')
      setCheckingOut(false)
    }
  }

  const testPaystackDirectly = async () => {
    try {
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testEmail,
          amount: 50000, // ₦500 in kobo
          reference: `DIRECT_TEST_${Date.now()}`,
          callback_url: `${window.location.origin}/payment/callback`
        })
      })

      const data = await response.json()
      
      if (data.status && data.data?.authorization_url) {
        window.open(data.data.authorization_url, '_blank')
      } else {
        setError('Failed to create direct Paystack transaction')
      }
    } catch (error) {
      console.error('Direct Paystack test error:', error)
      setError('Failed to test Paystack directly')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Integration Test</h1>
          <p className="text-gray-600">
            Test the complete payment flow from adding items to cart through Paystack checkout.
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center text-red-700">
                <AlertCircle className="w-5 h-5 mr-2" />
                {error}
              </div>
            </CardContent>
          </Card>
        )}

        {success && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center text-green-700">
                <CheckCircle2 className="w-5 h-5 mr-2" />
                {success}
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Test Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User Status
                </label>
                <Badge variant={user ? 'default' : 'destructive'}>
                  {user ? `Signed in as ${user.email}` : 'Not signed in'}
                </Badge>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Email for Payment
                </label>
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                />
              </div>
            </div>
            
            {!user && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <p className="text-yellow-800 text-sm">
                  You need to sign in to test the full payment flow. 
                  <Link href="/auth/signin" className="ml-1 underline hover:text-yellow-900">
                    Sign in here
                  </Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Test Artworks */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Step 1: Add Test Artworks to Cart</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {testArtworks.map((artwork) => (
                    <Card key={artwork.id} className="border">
                      <CardContent className="p-4">
                        <div className="relative w-full h-32 mb-3">
                          <Image
                            src={artwork.image}
                            alt={artwork.title}
                            fill
                            className="object-cover rounded-md"
                            sizes="(min-width: 768px) 50vw, 100vw"
                          />
                        </div>
                        <h3 className="font-semibold text-lg mb-1">{artwork.title}</h3>
                        <p className="text-gray-600 text-sm mb-2">by {artwork.artist}</p>
                        <p className="text-lg font-bold text-orange-600 mb-3">
                          ₦{artwork.price.toLocaleString()}
                        </p>
                        <Button
                          onClick={() => handleAddToCart(artwork.id)}
                          disabled={!user || addingToCart === artwork.id}
                          className="w-full bg-orange-600 hover:bg-orange-700"
                          size="sm"
                        >
                          {addingToCart === artwork.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Add to Cart
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cart & Checkout */}
          <div className="space-y-6">
            {/* Current Cart */}
            <Card>
              <CardHeader>
                <CardTitle>Step 2: Review Cart</CardTitle>
              </CardHeader>
              <CardContent>
                {cartLoading ? (
                  <div className="text-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Loading cart...</p>
                  </div>
                ) : !cart || cart.items.length === 0 ? (
                  <p className="text-gray-600 text-center py-4">Cart is empty</p>
                ) : (
                  <div className="space-y-3">
                    {cart.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center py-2 border-b">
                        <div>
                          <p className="font-medium text-sm">{item.title || 'Artwork'}</p>
                          <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-semibold">₦{Number(item.unit_price).toLocaleString()}</p>
                      </div>
                    ))}
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center font-bold">
                        <span>Total:</span>
                        <span className="text-orange-600">₦{cart.subtotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Checkout Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Step 3: Test Checkout</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleCheckout}
                  disabled={!user || !cart || cart.items.length === 0 || checkingOut}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {checkingOut ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Proceed to Paystack
                    </>
                  )}
                </Button>

                <Button
                  onClick={testPaystackDirectly}
                  variant="outline"
                  className="w-full"
                >
                  Test Paystack Directly
                </Button>

                <div className="text-xs text-gray-600 space-y-1">
                  <p><strong>Test Card Numbers:</strong></p>
                  <p>Success: 4084084084084081</p>
                  <p>Decline: 5060666666666666666</p>
                  <p>CVV: Any 3 digits</p>
                  <p>Expiry: Any future date</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/cart" className="block">
                  <Button variant="outline" className="w-full" size="sm">
                    View Full Cart
                  </Button>
                </Link>
                <Link href="/payment/callback?reference=TEST_REF" className="block">
                  <Button variant="outline" className="w-full" size="sm">
                    Test Callback Page
                  </Button>
                </Link>
                <Link href="/dashboard/collector/orders" className="block">
                  <Button variant="outline" className="w-full" size="sm">
                    View Orders
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}