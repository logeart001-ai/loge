'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Truck, Package, Clock, Shield } from 'lucide-react'

export interface ShippingQuote {
  provider: string
  service_type: string
  price: number
  estimated_delivery_days: number
  tracking_available: boolean
}

export interface ShippingCalculatorProps {
  itemType: 'art' | 'book' | 'fashion'
  itemValue: number
  itemWeight?: number
  itemDimensions?: {
    length: number
    width: number
    height: number
  }
  onQuoteSelect?: (quote: ShippingQuote) => void
}

const nigerianStates = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
  'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
  'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
  'Yobe', 'Zamfara'
]

export function ShippingCalculator({ 
  itemType, 
  itemValue, 
  itemWeight = 1, 
  itemDimensions = { length: 30, width: 20, height: 10 },
  onQuoteSelect 
}: ShippingCalculatorProps) {
  const [quotes, setQuotes] = useState<ShippingQuote[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<ShippingQuote | null>(null)
  
  const [deliveryAddress, setDeliveryAddress] = useState({
    city: '',
    state: '',
    recipient_name: '',
    phone: '',
    street: ''
  })

  const getQuotes = async () => {
    if (!deliveryAddress.city || !deliveryAddress.state) {
      alert('Please fill in delivery city and state')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/shipping/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pickup_address: {
            street: 'Creator Address', // This would come from the seller's profile
            city: 'Lagos', // Default pickup location
            state: 'Lagos',
            country: 'Nigeria',
            recipient_name: 'Loge Arts',
            phone: '+234000000000'
          },
          delivery_address: {
            street: deliveryAddress.street,
            city: deliveryAddress.city,
            state: deliveryAddress.state,
            country: 'Nigeria',
            recipient_name: deliveryAddress.recipient_name,
            phone: deliveryAddress.phone
          },
          package_details: {
            weight: itemWeight,
            length: itemDimensions.length,
            width: itemDimensions.width,
            height: itemDimensions.height,
            value: itemValue,
            description: `${itemType} item`,
            fragile: itemType === 'art',
            category: itemType
          }
        })
      })

      const data = await response.json()
      if (data.quotes) {
        setQuotes(data.quotes)
      }
    } catch (error) {
      console.error('Error getting quotes:', error)
      alert('Failed to get shipping quotes')
    } finally {
      setLoading(false)
    }
  }

  const handleQuoteSelect = (quote: ShippingQuote) => {
    setSelectedQuote(quote)
    onQuoteSelect?.(quote)
  }

  return (
    <div className="w-full max-w-none">
      <Card className="w-full border-orange-200">
        <CardHeader className="pb-3 bg-linear-to-r from-orange-50 to-red-50">
          <CardTitle className="flex items-center gap-2 text-base">
            <Truck className="w-5 h-5 text-orange-600" />
            Calculate Shipping Cost
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">Enter your delivery address to see available shipping options</p>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {/* Delivery Address Form */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900 text-sm flex items-center gap-2">
              <Package className="w-4 h-4 text-orange-600" />
              Delivery Information
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="recipient_name" className="text-xs font-medium text-gray-700">Recipient Name *</Label>
                <Input
                  id="recipient_name"
                  value={deliveryAddress.recipient_name}
                  onChange={(e) => setDeliveryAddress(prev => ({ ...prev, recipient_name: e.target.value }))}
                  placeholder="Full name"
                  className="w-full h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-medium text-gray-700">Phone Number *</Label>
                <Input
                  id="phone"
                  value={deliveryAddress.phone}
                  onChange={(e) => setDeliveryAddress(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+234..."
                  className="w-full h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="street" className="text-xs font-medium text-gray-700">Street Address *</Label>
              <Input
                id="street"
                value={deliveryAddress.street}
                onChange={(e) => setDeliveryAddress(prev => ({ ...prev, street: e.target.value }))}
                placeholder="Enter full street address"
                className="w-full h-9 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-xs font-medium text-gray-700">City *</Label>
                <Input
                  id="city"
                  value={deliveryAddress.city}
                  onChange={(e) => setDeliveryAddress(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="e.g., Ikeja"
                  className="w-full h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="state" className="text-xs font-medium text-gray-700">State *</Label>
                <Select onValueChange={(value) => setDeliveryAddress(prev => ({ ...prev, state: value }))}>
                  <SelectTrigger className="w-full h-9 text-sm">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {nigerianStates.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={getQuotes} 
              disabled={loading || !deliveryAddress.city || !deliveryAddress.state}
              className="w-full bg-orange-600 hover:bg-orange-700 h-10 text-sm font-medium shadow-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Calculating...
                </>
              ) : (
                <>
                  <Truck className="w-4 h-4 mr-2" />
                  Calculate Shipping Cost
                </>
              )}
            </Button>
          </div>

          {/* Shipping Options */}
          {quotes.length > 0 && (
            <div className="space-y-3 border-t pt-4">
              <h3 className="font-medium text-gray-900 text-sm flex items-center gap-2">
                <Truck className="w-4 h-4 text-orange-600" />
                Choose Shipping Method ({quotes.length} option{quotes.length !== 1 ? 's' : ''})
              </h3>
              
              <div className="space-y-2">
                {quotes.map((quote, index) => (
                  <div
                    key={index}
                    className={`relative p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedQuote === quote
                        ? 'border-orange-500 bg-orange-50 shadow-md ring-2 ring-orange-200'
                        : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleQuoteSelect(quote)}
                  >
                    {selectedQuote === quote && (
                      <div className="absolute top-2 right-2">
                        <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center shadow-sm">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pr-8">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <h4 className="font-semibold text-gray-900 text-sm">{quote.provider}</h4>
                          <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-gray-100">
                            {quote.service_type}
                          </Badge>
                          {quote.tracking_available && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0.5 border-green-300 text-green-700">
                              <Package className="w-3 h-3 mr-0.5" />
                              Tracking
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{quote.estimated_delivery_days} day{quote.estimated_delivery_days !== 1 ? 's' : ''} delivery</span>
                          </div>
                          {itemValue > 50000 && (
                            <div className="flex items-center gap-1 text-green-600">
                              <Shield className="w-3.5 h-3.5" />
                              <span>Insured</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-left sm:text-right">
                        <div className="text-lg font-bold text-gray-900">
                          ₦{quote.price.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          shipping fee
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Quote Summary */}
          {selectedQuote && (
            <div className="border-t pt-4">
              <div className="bg-linear-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-lg p-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-sm">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-orange-900 text-sm mb-0.5">
                      Shipping Method Selected
                    </h4>
                    <p className="text-orange-800 text-sm font-medium">
                      {selectedQuote.provider} - {selectedQuote.service_type}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-orange-700">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Estimated delivery: {selectedQuote.estimated_delivery_days} day{selectedQuote.estimated_delivery_days !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xl font-bold text-orange-900">
                      ₦{selectedQuote.price.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}