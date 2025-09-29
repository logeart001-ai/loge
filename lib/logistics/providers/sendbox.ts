// Sendbox API integration
import { LogisticsProvider, ShipmentRequest, ShippingQuote, TrackingInfo, DeliveryAddress, PackageDetails } from '../types'

export class SendboxProvider implements LogisticsProvider {
  name = 'Sendbox'
  private apiKey: string
  private baseUrl = 'https://api.sendbox.co/shipping'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async getQuote(request: ShipmentRequest): Promise<ShippingQuote[]> {
    try {
      const response = await fetch(`${this.baseUrl}/quote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          origin: this.formatAddress(request.pickup_address),
          destination: this.formatAddress(request.delivery_address),
          parcel: this.formatPackage(request.package_details)
        })
      })

      const data = await response.json()
      
      return data.quotes?.map((quote: any) => ({
        provider: 'Sendbox',
        service_type: quote.service_name,
        price: quote.amount,
        estimated_delivery_days: quote.delivery_time,
        tracking_available: true
      })) || []
    } catch (error) {
      console.error('Sendbox quote error:', error)
      return []
    }
  }

  async createShipment(request: ShipmentRequest): Promise<{ tracking_number: string; label_url?: string }> {
    const response = await fetch(`${this.baseUrl}/shipment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        origin: this.formatAddress(request.pickup_address),
        destination: this.formatAddress(request.delivery_address),
        parcel: this.formatPackage(request.package_details),
        insurance: request.insurance_required || false
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create shipment')
    }

    return {
      tracking_number: data.tracking_number,
      label_url: data.label_url
    }
  }

  async trackShipment(tracking_number: string): Promise<TrackingInfo> {
    const response = await fetch(`${this.baseUrl}/track/${tracking_number}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    })

    const data = await response.json()
    
    return {
      tracking_number,
      status: this.mapStatus(data.status),
      current_location: data.current_location,
      estimated_delivery: data.estimated_delivery,
      history: data.tracking_history?.map((event: any) => ({
        timestamp: event.timestamp,
        status: event.status,
        location: event.location,
        description: event.description
      })) || []
    }
  }

  async cancelShipment(tracking_number: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/cancel/${tracking_number}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    })

    return response.ok
  }

  private formatAddress(address: DeliveryAddress) {
    return {
      name: address.recipient_name,
      phone: address.phone,
      email: address.email,
      address: address.street,
      city: address.city,
      state: address.state,
      country: address.country
    }
  }

  private formatPackage(pkg: PackageDetails) {
    return {
      weight: pkg.weight,
      length: pkg.length,
      width: pkg.width,
      height: pkg.height,
      value: pkg.value,
      description: pkg.description,
      category: pkg.category
    }
  }

  private mapStatus(status: string): TrackingInfo['status'] {
    const statusMap: Record<string, TrackingInfo['status']> = {
      'pending': 'pending',
      'picked_up': 'picked_up',
      'in_transit': 'in_transit',
      'delivered': 'delivered',
      'failed': 'failed'
    }
    return statusMap[status.toLowerCase()] || 'pending'
  }
}