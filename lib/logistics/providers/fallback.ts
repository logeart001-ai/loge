// Fallback logistics provider for testing when external APIs aren't available
import { LogisticsProvider, ShipmentRequest, ShippingQuote, TrackingInfo } from '../types'

export class FallbackProvider implements LogisticsProvider {
  name = 'Local Delivery'

  async getQuote(request: ShipmentRequest): Promise<ShippingQuote[]> {
    const { package_details, delivery_address } = request
    
    // Calculate base price based on weight and value
    const basePrice = Math.max(1000, package_details.weight * 500) // Minimum ₦1000
    const valueInsurance = package_details.value > 50000 ? package_details.value * 0.02 : 0
    
    // Different pricing for different states
    const isLagos = delivery_address.state.toLowerCase() === 'lagos'
    const isNearbyState = ['ogun', 'oyo', 'osun'].includes(delivery_address.state.toLowerCase())
    
    const quotes: ShippingQuote[] = []
    
    if (isLagos) {
      // Lagos same-day and next-day options
      quotes.push({
        provider: this.name,
        service_type: 'Same Day Delivery',
        price: Math.round(basePrice * 1.5 + valueInsurance),
        estimated_delivery_days: 1,
        tracking_available: true
      })
      
      quotes.push({
        provider: this.name,
        service_type: 'Standard Delivery',
        price: Math.round(basePrice + valueInsurance),
        estimated_delivery_days: 2,
        tracking_available: true
      })
    } else if (isNearbyState) {
      // Nearby states
      quotes.push({
        provider: this.name,
        service_type: 'Express Delivery',
        price: Math.round(basePrice * 1.8 + valueInsurance),
        estimated_delivery_days: 2,
        tracking_available: true
      })
      
      quotes.push({
        provider: this.name,
        service_type: 'Standard Delivery',
        price: Math.round(basePrice * 1.3 + valueInsurance),
        estimated_delivery_days: 4,
        tracking_available: true
      })
    } else {
      // Other states
      quotes.push({
        provider: this.name,
        service_type: 'Express Delivery',
        price: Math.round(basePrice * 2.5 + valueInsurance),
        estimated_delivery_days: 3,
        tracking_available: true
      })
      
      quotes.push({
        provider: this.name,
        service_type: 'Standard Delivery',
        price: Math.round(basePrice * 1.8 + valueInsurance),
        estimated_delivery_days: 6,
        tracking_available: true
      })
      
      quotes.push({
        provider: this.name,
        service_type: 'Economy Delivery',
        price: Math.round(basePrice * 1.2 + valueInsurance),
        estimated_delivery_days: 10,
        tracking_available: false
      })
    }
    
    // Add fragile handling fee for art items
    if (package_details.fragile) {
      quotes.forEach(quote => {
        quote.price += 500 // ₦500 fragile handling fee
      })
    }
    
    return quotes
  }

  async createShipment(request: ShipmentRequest): Promise<{ tracking_number: string; label_url?: string }> {
    // Generate a mock tracking number
    const tracking_number = `LGE${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`
    
    return {
      tracking_number,
      label_url: undefined // No label for fallback provider
    }
  }

  async trackShipment(tracking_number: string): Promise<TrackingInfo> {
    // Mock tracking info
    return {
      tracking_number,
      status: 'in_transit',
      current_location: 'Lagos Distribution Center',
      estimated_delivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      history: [
        {
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          status: 'picked_up',
          location: 'Lagos Pickup Center',
          description: 'Package picked up from sender'
        },
        {
          timestamp: new Date().toISOString(),
          status: 'in_transit',
          location: 'Lagos Distribution Center',
          description: 'Package in transit to destination'
        }
      ]
    }
  }

  async cancelShipment(tracking_number: string): Promise<boolean> {
    // Mock cancellation - always successful for testing
    return true
  }
}