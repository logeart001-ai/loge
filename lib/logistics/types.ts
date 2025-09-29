// Logistics types and interfaces
export interface DeliveryAddress {
  street: string
  city: string
  state: string
  country: string
  postal_code?: string
  landmark?: string
  phone: string
  email: string
  recipient_name: string
}

export interface PackageDetails {
  weight: number // in kg
  length: number // in cm
  width: number // in cm
  height: number // in cm
  value: number // in naira
  description: string
  fragile: boolean
  category: 'art' | 'book' | 'fashion' | 'other'
}

export interface ShippingQuote {
  provider: string
  service_type: string
  price: number
  estimated_delivery_days: number
  tracking_available: boolean
}

export interface ShipmentRequest {
  pickup_address: DeliveryAddress
  delivery_address: DeliveryAddress
  package_details: PackageDetails
  preferred_provider?: string
  insurance_required?: boolean
}

export interface TrackingInfo {
  tracking_number: string
  status: 'pending' | 'picked_up' | 'in_transit' | 'delivered' | 'failed'
  current_location?: string
  estimated_delivery?: string
  history: TrackingEvent[]
}

export interface TrackingEvent {
  timestamp: string
  status: string
  location: string
  description: string
}

export interface LogisticsProvider {
  name: string
  getQuote(request: ShipmentRequest): Promise<ShippingQuote[]>
  createShipment(request: ShipmentRequest): Promise<{ tracking_number: string; label_url?: string }>
  trackShipment(tracking_number: string): Promise<TrackingInfo>
  cancelShipment(tracking_number: string): Promise<boolean>
}