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
      <Card className="w-full">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="w-5 h-5 text-orange-600" />
            Shipping Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Delivery Address Form */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 text-sm">Delivery Address</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipient_name" className="text-sm font-medium">Recipient Name</Label>
                <Input
                  id="recipient_name"
                  value={deliveryAddress.recipient_name}
                  onChange={(e) => setDeliveryAddress(prev => ({ ...prev, recipient_name: e.target.value }))}
                  placeholder="Full name"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                <Input
                  id="phone"
                  value={deliveryAddress.phone}
                  onChange={(e) => setDeliveryAddress(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+234..."
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="street" className="text-sm font-medium">Street Address</Label>
              <Input
                id="street"
                value={deliveryAddress.street}
                onChange={(e) => setDeliveryAddress(prev => ({ ...prev, street: e.target.value }))}
                placeholder="Enter full street address"
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-medium">City</Label>
                <Input
                  id="city"
                  value={deliveryAddress.city}
                  onChange={(e) => setDeliveryAddress(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="City"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state" className="text-sm font-medium">State</Label>
                <Select onValueChange={(value) => setDeliveryAddress(prev => ({ ...prev, state: value }))}>
                  <SelectTrigger className="w-full">
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
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Getting Quotes...
                </>
              ) : (
                <>
                  <Truck className="w-4 h-4 mr-2" />
                  Get Shipping Quotes
                </>
              )}
            </Button>
          </div>

          {/* Shipping Options */}
          {quotes.length > 0 && (
            <div className="space-y-4 border-t pt-6">
              <h3 className="font-medium text-gray-900 text-sm flex items-center gap-2">
                <Truck className="w-4 h-4 text-orange-600" />
                Available Shipping Options
              </h3>
              
              <div className="space-y-3">
                {quotes.map((quote, index) => (
                  <div
                    key={index}
                    className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedQuote === quote
                        ? 'border-orange-500 bg-orange-50 shadow-sm'
                        : 'border-gray-200 hover:border-orange-300 hover:shadow-sm'
                    }`}
                    onClick={() => handleQuoteSelect(quote)}
                  >
                    {selectedQuote === quote && (
                      <div className="absolute top-2 right-2">
                        <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      </div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900 text-sm">{quote.provider}</h4>
                          <Badge variant="secondary" className="text-xs px-2 py-1">
                            {quote.service_type}
                          </Badge>
                          {quote.tracking_available && (
                            <Badge variant="outline" className="text-xs px-2 py-1">
                              <Package className="w-3 h-3 mr-1" />
                              Tracking
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{quote.estimated_delivery_days} day{quote.estimated_delivery_days !== 1 ? 's' : ''}</span>
                          </div>
                          {itemValue > 50000 && (
                            <div className="flex items-center gap-1">
                              <Shield className="w-4 h-4" />
                              <span>Insurance included</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right sm:text-right">
                        <div className="text-lg font-bold text-gray-900">
                          ₦{quote.price.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          Shipping fee
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
            <div className="border-t pt-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-orange-900 text-sm mb-1">
                      Selected Shipping Option
                    </h4>
                    <p className="text-orange-700 text-sm">
                      {selectedQuote.provider} - {selectedQuote.service_type}
                    </p>
                  </div>
                  <div className="text-right sm:text-right">
                    <div className="text-lg font-bold text-orange-900">
                      ₦{selectedQuote.price.toLocaleString()}
                    </div>
                    <div className="text-sm text-orange-700">
                      Delivery in {selectedQuote.estimated_delivery_days} day{selectedQuote.estimated_delivery_days !== 1 ? 's' : ''}
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