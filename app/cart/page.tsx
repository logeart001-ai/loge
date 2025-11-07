"use client"

import { useState } from 'react'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { useCart } from '@/components/cart-provider'
import { CartRow } from '@/components/cart/cart-row'
import { useUser } from '@/lib/use-user'
import { ShippingCalculator, ShippingQuote } from '@/components/shipping/shipping-calculator'
import { Loader2, Truck } from 'lucide-react'

export default function CartPage() {
  const { cart, loading } = useCart()
  const { user } = useUser()
  const [checkingOut, setCheckingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedShipping, setSelectedShipping] = useState<ShippingQuote | null>(null)
  const [showShipping, setShowShipping] = useState(false)

  const handleCheckout = async () => {
    if (!cart || !user?.email) {
      setError('Please sign in to proceed with checkout')
      return
    }

    if (!selectedShipping) {
      setError('Please select a shipping option')
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
          email: user.email,
          shipping: selectedShipping,
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Your Cart</h1>
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">Loading cart...</CardContent>
          </Card>
        ) : !cart || cart.items.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-600 mb-6">Your cart is empty.</p>
              <Link href="/art">
                <Button className="bg-orange-600 hover:bg-orange-700">Browse Artworks</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 lg:max-w-2xl space-y-4">
              {cart.items.map(item => (
                <CartRow key={item.id} item={{
                  id: item.id,
                  artwork_id: item.artwork_id,
                  unit_price: Number(item.unit_price ?? 0),
                  quantity: item.quantity,
                  title: item.title || 'Artwork',
                  thumbnail_url: item.thumbnail_url || null
                }} />
              ))}
            </div>
            <div className="w-full lg:w-96 lg:shrink-0 space-y-6">
              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span className="font-semibold">₦{cart.subtotal.toLocaleString()}</span>
                  </div>
                  
                  {selectedShipping ? (
                    <div className="bg-green-50 border border-green-200 rounded-md p-3 space-y-1">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-700 font-medium">Shipping</span>
                        <span className="font-semibold text-gray-900">₦{selectedShipping.price.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-600">
                        <span>{selectedShipping.provider} - {selectedShipping.service_type}</span>
                        <button 
                          onClick={() => setShowShipping(true)}
                          className="text-orange-600 hover:text-orange-700 underline"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">Shipping</span>
                        <span className="text-orange-600 font-medium">Not calculated</span>
                      </div>
                    </div>
                  )}
                  
                  <hr />
                  
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>₦{(cart.subtotal + (selectedShipping?.price || 0)).toLocaleString()}</span>
                  </div>
                  
                  {!showShipping && !selectedShipping && (
                    <Button 
                      variant="outline" 
                      className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                      onClick={() => setShowShipping(true)}
                    >
                      <Truck className="mr-2 h-4 w-4" />
                      Calculate Shipping Cost
                    </Button>
                  )}
                  
                  {error && (
                    <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                      {error}
                    </div>
                  )}
                  
                  <Button 
                    className="w-full bg-orange-600 hover:bg-orange-700" 
                    disabled={checkingOut || !selectedShipping}
                    onClick={handleCheckout}
                  >
                    {checkingOut ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Proceed to Checkout'
                    )}
                  </Button>
                  
                  <Link href="/art" className="block text-center text-sm text-gray-600 hover:text-gray-800">
                    Continue shopping
                  </Link>
                </CardContent>
              </Card>
              
              {/* Shipping Calculator */}
              {showShipping && (
                <Card className="w-full">
                  <ShippingCalculator
                    itemType="art"
                    itemValue={cart.subtotal}
                    itemWeight={2} // Default weight, could be calculated from items
                    onQuoteSelect={(quote) => {
                      setSelectedShipping(quote)
                      setError(null)
                      setShowShipping(false) // Collapse after selection
                    }}
                  />
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
// Client row component consumed from ./cart-row.tsx
