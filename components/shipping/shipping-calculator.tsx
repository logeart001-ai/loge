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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Shipping Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="recipient_name">Recipient Name</Label>
              <Input
                id="recipient_name"
                value={deliveryAddress.recipient_name}
                onChange={(e) => setDeliveryAddress(prev => ({ ...prev, recipient_name: e.target.value }))}
                placeholder="Full name"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={deliveryAddress.phone}
                onChange={(e) => setDeliveryAddress(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+234..."
              />
            </div>
          </div>

          <div>
            <Label htmlFor="street">Street Address</Label>
            <Input
              id="street"
              value={deliveryAddress.street}
              onChange={(e) => setDeliveryAddress(prev => ({ ...prev, street: e.target.value }))}
              placeholder="Street address"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={deliveryAddress.city}
                onChange={(e) => setDeliveryAddress(prev => ({ ...prev, city: e.target.value }))}
                placeholder="City"
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Select onValueChange={(value) => setDeliveryAddress(prev => ({ ...prev, state: value }))}>
                <SelectTrigger>
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
            className="w-full"
          >
            {loading ? 'Getting Quotes...' : 'Get Shipping Quotes'}
          </Button>
        </CardContent>
      </Card>

      {quotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Available Shipping Options
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quotes.map((quote, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedQuote === quote
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleQuoteSelect(quote)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{quote.provider}</h4>
                        <Badge variant="secondary">{quote.service_type}</Badge>
                        {quote.tracking_available && (
                          <Badge variant="outline" className="text-xs">
                            <Package className="w-3 h-3 mr-1" />
                            Tracking
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {quote.estimated_delivery_days} days
                        </div>
                        {itemValue > 50000 && (
                          <div className="flex items-center gap-1">
                            <Shield className="w-4 h-4" />
                            Insurance included
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
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
          </CardContent>
        </Card>
      )}

      {selectedQuote && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-orange-900">Selected Shipping Option</h4>
                <p className="text-orange-700">
                  {selectedQuote.provider} - {selectedQuote.service_type}
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-orange-900">
                  ₦{selectedQuote.price.toLocaleString()}
                </div>
                <div className="text-sm text-orange-700">
                  Delivery in {selectedQuote.estimated_delivery_days} days
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}