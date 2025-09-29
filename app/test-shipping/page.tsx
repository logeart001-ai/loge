'use client'

import { useState } from 'react'
import { ShippingCalculator, ShippingQuote } from '@/components/shipping/shipping-calculator'
import { TrackingDisplay } from '@/components/shipping/tracking-display'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'


export default function TestShippingPage() {
  const [selectedQuote, setSelectedQuote] = useState<ShippingQuote | null>(null)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [showTracking, setShowTracking] = useState(false)

  const handleQuoteSelect = (quote: ShippingQuote) => {
    setSelectedQuote(quote)
    console.log('Selected shipping quote:', quote)
  }

  const testTrackingNumber = () => {
    if (trackingNumber.trim()) {
      setShowTracking(true)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Shipping System Test
          </h1>
          <p className="text-gray-600">
            Test the logistics integration for Loge Arts
          </p>
        </div>

        {/* Shipping Calculator Test */}
        <Card>
          <CardHeader>
            <CardTitle>Test Shipping Calculator</CardTitle>
          </CardHeader>
          <CardContent>
            <ShippingCalculator
              itemType="art"
              itemValue={75000}
              itemWeight={2.5}
              itemDimensions={{ length: 40, width: 30, height: 15 }}
              onQuoteSelect={handleQuoteSelect}
            />
            
            {selectedQuote && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">
                  Quote Selected Successfully! ✅
                </h3>
                <pre className="text-sm text-green-800 overflow-auto">
                  {JSON.stringify(selectedQuote, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tracking Test */}
        <Card>
          <CardHeader>
            <CardTitle>Test Package Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="tracking">Enter Tracking Number</Label>
                <div className="flex gap-2">
                  <Input
                    id="tracking"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number to test"
                  />
                  <Button onClick={testTrackingNumber}>
                    Track Package
                  </Button>
                </div>
              </div>

              {showTracking && trackingNumber && (
                <TrackingDisplay 
                  trackingNumber={trackingNumber}
                  autoRefresh={false}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* API Test */}
        <Card>
          <CardHeader>
            <CardTitle>API Endpoints Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Shipping Quote API:</span>
                <span className="text-blue-600">POST /api/shipping/quote</span>
              </div>
              <div className="flex justify-between">
                <span>Create Shipment API:</span>
                <span className="text-blue-600">POST /api/shipping/create</span>
              </div>
              <div className="flex justify-between">
                <span>Track Shipment API:</span>
                <span className="text-blue-600">GET /api/shipping/track/[tracking_number]</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">1. Get API Keys</h4>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Sendbox: <a href="https://sendbox.co/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">https://sendbox.co/</a></li>
                <li>• GIG Logistics: Contact them directly for API access</li>
                <li>• Kwik Delivery: <a href="https://kwik.delivery/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">https://kwik.delivery/</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">2. Update Environment Variables</h4>
              <p className="text-sm text-gray-600">
                Add your API keys to <code className="bg-gray-100 px-1 rounded">.env.local</code>:
              </p>
              <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
{`SENDBOX_API_KEY=your_sendbox_api_key_here
GIG_API_KEY=your_gig_logistics_api_key_here
KWIK_API_KEY=your_kwik_delivery_api_key_here`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold mb-2">3. Test the System</h4>
              <p className="text-sm text-gray-600">
                Use the shipping calculator above to test quote generation. 
                The system will show mock data until you add real API keys.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}