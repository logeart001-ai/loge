// GIG Logistics API integration
import { LogisticsProvider, ShipmentRequest, ShippingQuote, TrackingInfo, DeliveryAddress, PackageDetails } from '../types'

export class GIGProvider implements LogisticsProvider {
  name = 'GIG Logistics'
  private apiKey: string
  private baseUrl = 'https://api.giglogistics.com/v1'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async getQuote(request: ShipmentRequest): Promise<ShippingQuote[]> {
    try {
      const response = await fetch(`${this.baseUrl}/rates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pickup_location: {
            state: request.pickup_address.state,
            city: request.pickup_address.city
          },
          delivery_location: {
            state: request.delivery_address.state,
            city: request.delivery_address.city
          },
          package: {
            weight: request.package_details.weight,
            value: request.package_details.value,
            category: request.package_details.fragile ? 'fragile' : 'standard'
          }
        })
      })

      const data = await response.json()
      
      return data.rates?.map((rate: any) => ({
        provider: 'GIG Logistics',
        service_type: rate.service_type,
        price: rate.amount,
        estimated_delivery_days: rate.delivery_days,
        tracking_available: true
      })) || []
    } catch (error) {
      console.error('GIG quote error:', error)
      return []
    }
  }

  async createShipment(request: ShipmentRequest): Promise<{ tracking_number: string; label_url?: string }> {
    const response = await fetch(`${this.baseUrl}/shipments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pickup_details: {
          contact_name: request.pickup_address.recipient_name,
          contact_phone: request.pickup_address.phone,
          address: request.pickup_address.street,
          city: request.pickup_address.city,
          state: request.pickup_address.state
        },
        delivery_details: {
          contact_name: request.delivery_address.recipient_name,
          contact_phone: request.delivery_address.phone,
          address: request.delivery_address.street,
          city: request.delivery_address.city,
          state: request.delivery_address.state
        },
        package_details: {
          weight: request.package_details.weight,
          dimensions: {
            length: request.package_details.length,
            width: request.package_details.width,
            height: request.package_details.height
          },
          value: request.package_details.value,
          description: request.package_details.description,
          fragile: request.package_details.fragile
        }
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create GIG shipment')
    }

    return {
      tracking_number: data.waybill_number,
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
      status: this.mapGIGStatus(data.status),
      current_location: data.current_location,
      estimated_delivery: data.estimated_delivery_date,
      history: data.tracking_events?.map((event: any) => ({
        timestamp: event.date_time,
        status: event.status,
        location: event.location,
        description: event.remarks
      })) || []
    }
  }

  async cancelShipment(tracking_number: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/shipments/${tracking_number}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    })

    return response.ok
  }

  private mapGIGStatus(status: string): TrackingInfo['status'] {
    const statusMap: Record<string, TrackingInfo['status']> = {
      'booked': 'pending',
      'picked_up': 'picked_up',
      'in_transit': 'in_transit',
      'delivered': 'delivered',
      'failed_delivery': 'failed'
    }
    return statusMap[status.toLowerCase()] || 'pending'
  }
}