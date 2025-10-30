'use client'

import { ShippingCalculator } from '@/components/shipping/shipping-calculator'

export default function TestShippingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test Shipping Calculator</h1>
        
        <ShippingCalculator
          itemType="art"
          itemValue={50000}
          itemWeight={2}
          itemDimensions={{ length: 40, width: 30, height: 5 }}
          onQuoteSelect={(quote) => {
            console.log('Selected quote:', quote)
            alert(`Selected: ${quote.provider} - ${quote.service_type} for ₦${quote.price.toLocaleString()}`)
          }}
        />
      </div>
    </div>
  )
}