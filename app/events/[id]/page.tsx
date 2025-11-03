import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EventShareButton } from '@/components/ui/share-button'
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Ticket, 
  ArrowLeft,
  Star,
  Globe,
  Video
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface Event {
  id: string
  title: string
  description?: string | null
  event_type: string
  event_date?: string | null
  start_date?: string | null
  end_date?: string | null
  city?: string | null
  country?: string | null
  venue_name?: string | null
  address?: string | null
  capacity?: number | null
  registration_url?: string | null
  is_free: boolean
  ticket_price?: number | null
  is_featured: boolean
  is_published: boolean
  image_url?: string | null
  created_at: string
  organizer?: {
    full_name: string
    email: string
  }
}

async function getEvent(id: string): Promise<Event | null> {
  const supabase = await createServerClient()
  
  try {
    // Try to get event with organizer info
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        organizer:user_profiles!organizer_id(full_name, email)
      `)
      .eq('id', id)
      .eq('is_published', true)
      .single()

    if (error) {
      // Fallback: try without organizer relationship
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .eq('is_published', true)
        .single()

      if (fallbackError) {
        return null
      }

      return fallbackData
    }

    return data
  } catch (error) {
    console.error('Error fetching event:', error)
    return null
  }
}

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const event = await getEvent(id)

  if (!event) {
    notFound()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const eventLocation = [event.venue_name, event.city, event.country].filter(Boolean).join(', ')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/events">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Events
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Image */}
            {event.image_url && (
              <div className="relative aspect-video overflow-hidden rounded-lg">
                <Image
                  src={event.image_url}
                  alt={event.title}
                  fill
                  className="object-cover"
                />
                {event.is_featured && (
                  <Badge className="absolute top-4 left-4 bg-orange-500 text-white">
                    <Star className="w-3 h-3 mr-1" />
                    Featured Event
                  </Badge>
                )}
              </div>
            )}

            {/* Event Details */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {event.title}
                    </h1>
                    <p className="text-gray-600">
                      Organized by {event.organizer?.full_name || 'Unknown Organizer'}
                    </p>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {event.event_type.replace('_', ' ')}
                  </Badge>
                </div>

                {event.description && (
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Event Info Card */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Event Information</h3>
                
                <div className="space-y-4">
                  {/* Date & Time */}
                  {event.event_date && (
                    <div className="flex items-start space-x-3">
                      <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {formatDate(event.event_date)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatTime(event.event_date)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Location */}
                  {eventLocation && (
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {event.venue_name || 'Venue'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {event.address || `${event.city}, ${event.country}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Capacity */}
                  {event.capacity && (
                    <div className="flex items-center space-x-3">
                      <Users className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">
                          Capacity: {event.capacity.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Event Type Indicator */}
                  {event.venue_name?.toLowerCase().includes('virtual') && (
                    <div className="flex items-center space-x-3">
                      <Video className="w-5 h-5 text-blue-500" />
                      <p className="font-medium text-blue-600">Virtual Event</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pricing & Registration */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Registration</h3>
                
                {/* Price */}
                <div className="mb-4">
                  {event.is_free ? (
                    <p className="text-2xl font-bold text-green-600">
                      Free Event
                    </p>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">
                      ₦{(event.ticket_price || 0).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button 
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    onClick={() => {
                      if (event.registration_url) {
                        window.open(event.registration_url, '_blank')
                      }
                    }}
                  >
                    <Ticket className="w-4 h-4 mr-2" />
                    {event.registration_url ? 'Register Now' : 'Get Ticket'}
                  </Button>

                  <EventShareButton 
                    event={event}
                    variant="outline"
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Additional Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Need Help?</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Have questions about this event? Contact the organizer or our support team.
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// Generate metadata for better SEO and social sharing
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const event = await getEvent(id)

  if (!event) {
    return {
      title: 'Event Not Found',
      description: 'The requested event could not be found.'
    }
  }

  const eventDate = event.event_date ? new Date(event.event_date).toLocaleDateString() : ''
  const location = [event.city, event.country].filter(Boolean).join(', ')

  return {
    title: `${event.title} - African Cultural Events`,
    description: event.description || `Join us for ${event.title}${eventDate ? ` on ${eventDate}` : ''}${location ? ` in ${location}` : ''}`,
    openGraph: {
      title: event.title,
      description: event.description || `Join us for ${event.title}`,
      images: event.image_url ? [event.image_url] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description: event.description || `Join us for ${event.title}`,
      images: event.image_url ? [event.image_url] : [],
    }
  }
}