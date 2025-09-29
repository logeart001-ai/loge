'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Package, MapPin, Clock, CheckCircle, Truck, AlertCircle } from 'lucide-react'

interface TrackingEvent {
  timestamp: string
  status: string
  location: string
  description: string
}

interface TrackingInfo {
  tracking_number: string
  status: 'pending' | 'picked_up' | 'in_transit' | 'delivered' | 'failed'
  current_location?: string
  estimated_delivery?: string
  history: TrackingEvent[]
}

interface TrackingDisplayProps {
  trackingNumber: string
  autoRefresh?: boolean
}

const statusConfig = {
  pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'Pending Pickup' },
  picked_up: { icon: Package, color: 'bg-blue-100 text-blue-800', label: 'Picked Up' },
  in_transit: { icon: Truck, color: 'bg-purple-100 text-purple-800', label: 'In Transit' },
  delivered: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Delivered' },
  failed: { icon: AlertCircle, color: 'bg-red-100 text-red-800', label: 'Delivery Failed' }
}

export function TrackingDisplay({ trackingNumber, autoRefresh = true }: TrackingDisplayProps) {
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTrackingInfo = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/shipping/track/${trackingNumber}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tracking info')
      }
      
      setTrackingInfo(data.tracking_info)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrackingInfo()
    
    if (autoRefresh && trackingInfo?.status !== 'delivered' && trackingInfo?.status !== 'failed') {
      const interval = setInterval(fetchTrackingInfo, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [trackingNumber, autoRefresh])

  if (loading && !trackingInfo) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <span className="ml-2">Loading tracking information...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tracking Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchTrackingInfo} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!trackingInfo) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tracking Information</h3>
            <p className="text-gray-600">Unable to find tracking information for this shipment.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const StatusIcon = statusConfig[trackingInfo.status]?.icon || Package
  const statusColor = statusConfig[trackingInfo.status]?.color || 'bg-gray-100 text-gray-800'
  const statusLabel = statusConfig[trackingInfo.status]?.label || trackingInfo.status

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Shipment Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Tracking Number</h3>
              <p className="text-gray-600 font-mono">{trackingInfo.tracking_number}</p>
            </div>
            <Badge className={statusColor}>
              <StatusIcon className="w-4 h-4 mr-1" />
              {statusLabel}
            </Badge>
          </div>

          {trackingInfo.current_location && (
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                Current Location: {trackingInfo.current_location}
              </span>
            </div>
          )}

          {trackingInfo.estimated_delivery && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                Estimated Delivery: {new Date(trackingInfo.estimated_delivery).toLocaleDateString()}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tracking History */}
      {trackingInfo.history && trackingInfo.history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tracking History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trackingInfo.history
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((event, index) => (
                  <div key={index} className="flex gap-4 pb-4 border-b border-gray-100 last:border-b-0">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-semibold text-gray-900">
                          {event.status}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {event.location && (
                        <p className="text-sm text-gray-600 mb-1">
                          <MapPin className="w-3 h-3 inline mr-1" />
                          {event.location}
                        </p>
                      )}
                      {event.description && (
                        <p className="text-sm text-gray-600">{event.description}</p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Refresh Button */}
      <div className="text-center">
        <Button 
          onClick={fetchTrackingInfo} 
          disabled={loading}
          variant="outline"
          className="flex items-center gap-2"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
          ) : (
            <Package className="w-4 h-4" />
          )}
          Refresh Tracking
        </Button>
      </div>
    </div>
  )
}