'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  MapPin,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Star,
  DollarSign,
  Users
} from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Event {
  id: string
  organizer_id: string
  title: string
  description: string
  event_type: 'exhibition' | 'workshop' | 'gallery_opening' | 'art_fair' | 'networking'
  event_date: string
  start_date: string
  end_date: string
  city: string
  country: string
  is_free: boolean
  ticket_price?: number
  is_featured: boolean
  is_published: boolean
  created_at: string
  updated_at: string
  organizer?: {
    full_name: string
    email: string
  }
}

interface EventFormData {
  title: string
  description: string
  event_type: string
  event_date: string
  start_date: string
  end_date: string
  city: string
  country: string
  is_free: boolean
  ticket_price: string
  is_featured: boolean
  is_published: boolean
}

export function EventsManagement() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    event_type: 'exhibition',
    event_date: '',
    start_date: '',
    end_date: '',
    city: '',
    country: 'Nigeria',
    is_free: false,
    ticket_price: '',
    is_featured: false,
    is_published: true
  })

  const supabase = createClient()

  useEffect(() => {
    fetchEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      
      // Try to fetch events with organizer info, fallback to without if relationship fails
      let data = null

      // First, try with profiles relationship
      const profilesResult = await supabase
        .from('events')
        .select(`
          *,
          organizer:profiles!organizer_id(full_name, email)
        `)
        .order('event_date', { ascending: false })

      if (!profilesResult.error) {
        data = profilesResult.data
      } else {
        // Try with user_profiles table
        const userProfilesResult = await supabase
          .from('events')
          .select(`
            *,
            organizer:user_profiles!organizer_id(full_name, email)
          `)
          .order('event_date', { ascending: false })

        if (!userProfilesResult.error) {
          data = userProfilesResult.data
        } else {
          // Fallback: fetch events without organizer info
          console.warn('Could not fetch organizer info, loading events without it')
          const eventsResult = await supabase
            .from('events')
            .select('*')
            .order('event_date', { ascending: false })

          if (eventsResult.error) {
            throw eventsResult.error
          }
          data = eventsResult.data
        }
      }

      setEvents(data || [])
    } catch (error) {
      console.error('Error fetching events:', error)
      // Show a more helpful error message
      if (error instanceof Error) {
        console.error('Error details:', error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof EventFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      event_type: 'exhibition',
      event_date: '',
      start_date: '',
      end_date: '',
      city: '',
      country: 'Nigeria',
      is_free: false,
      ticket_price: '',
      is_featured: false,
      is_published: true
    })
    setEditingEvent(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('You must be logged in to create events')
        return
      }

      const eventData = {
        title: formData.title,
        description: formData.description,
        event_type: formData.event_type as Event['event_type'],
        event_date: formData.event_date,
        start_date: formData.start_date || formData.event_date,
        end_date: formData.end_date || formData.event_date,
        city: formData.city,
        country: formData.country,
        is_free: formData.is_free,
        ticket_price: formData.is_free ? null : parseFloat(formData.ticket_price) || null,
        is_featured: formData.is_featured,
        is_published: formData.is_published,
        organizer_id: user.id
      }

      if (editingEvent) {
        // Update existing event
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', editingEvent.id)

        if (error) throw error
        alert('Event updated successfully!')
      } else {
        // Create new event
        const { error } = await supabase
          .from('events')
          .insert([eventData])

        if (error) throw error
        alert('Event created successfully!')
      }

      resetForm()
      fetchEvents()
    } catch (error) {
      console.error('Error saving event:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleEdit = (event: Event) => {
    setEditingEvent(event)
    setFormData({
      title: event.title,
      description: event.description,
      event_type: event.event_type,
      event_date: event.event_date.split('T')[0],
      start_date: event.start_date.split('T')[0],
      end_date: event.end_date.split('T')[0],
      city: event.city,
      country: event.country,
      is_free: event.is_free,
      ticket_price: event.ticket_price?.toString() || '',
      is_featured: event.is_featured,
      is_published: event.is_published
    })
    setShowForm(true)
  }

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)

      if (error) throw error
      alert('Event deleted successfully!')
      fetchEvents()
    } catch (error) {
      console.error('Error deleting event:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const togglePublished = async (event: Event) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ is_published: !event.is_published })
        .eq('id', event.id)

      if (error) throw error
      fetchEvents()
    } catch (error) {
      console.error('Error toggling published status:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const toggleFeatured = async (event: Event) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ is_featured: !event.is_featured })
        .eq('id', event.id)

      if (error) throw error
      fetchEvents()
    } catch (error) {
      console.error('Error toggling featured status:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const eventTypeLabels: Record<Event['event_type'], string> = {
    exhibition: 'Exhibition',
    workshop: 'Workshop',
    gallery_opening: 'Gallery Opening',
    art_fair: 'Art Fair',
    networking: 'Networking'
  }

  const eventTypeColors: Record<Event['event_type'], string> = {
    exhibition: 'bg-purple-100 text-purple-800',
    workshop: 'bg-blue-100 text-blue-800',
    gallery_opening: 'bg-green-100 text-green-800',
    art_fair: 'bg-yellow-100 text-yellow-800',
    networking: 'bg-pink-100 text-pink-800'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Events Management</h2>
          <p className="text-gray-600">Create and manage art events, exhibitions, and workshops</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-orange-600 hover:bg-orange-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          {showForm ? 'Cancel' : 'Add Event'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Events</p>
                <p className="text-2xl font-bold">{events.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Published</p>
                <p className="text-2xl font-bold">{events.filter(e => e.is_published).length}</p>
              </div>
              <Eye className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Featured</p>
                <p className="text-2xl font-bold">{events.filter(e => e.is_featured).length}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold">
                  {events.filter(e => new Date(e.event_date) >= new Date()).length}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingEvent ? 'Edit Event' : 'Create New Event'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Lagos Contemporary Art Exhibition"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe the event..."
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="event_type">Event Type *</Label>
                  <Select
                    value={formData.event_type}
                    onValueChange={(value) => handleInputChange('event_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exhibition">Exhibition</SelectItem>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="gallery_opening">Gallery Opening</SelectItem>
                      <SelectItem value="art_fair">Art Fair</SelectItem>
                      <SelectItem value="networking">Networking Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="event_date">Event Date *</Label>
                  <Input
                    id="event_date"
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => handleInputChange('event_date', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="e.g., Lagos"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    placeholder="e.g., Nigeria"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    id="is_free"
                    type="checkbox"
                    checked={formData.is_free}
                    onChange={(e) => handleInputChange('is_free', e.target.checked)}
                    className="rounded border-gray-300"
                    aria-label="Free event checkbox"
                  />
                  <Label htmlFor="is_free" className="cursor-pointer">Free Event</Label>
                </div>

                {!formData.is_free && (
                  <div>
                    <Label htmlFor="ticket_price">Ticket Price (₦)</Label>
                    <Input
                      id="ticket_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.ticket_price}
                      onChange={(e) => handleInputChange('ticket_price', e.target.value)}
                      placeholder="e.g., 5000"
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    id="is_featured"
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => handleInputChange('is_featured', e.target.checked)}
                    className="rounded border-gray-300"
                    aria-label="Featured event checkbox"
                  />
                  <Label htmlFor="is_featured" className="cursor-pointer">Featured Event</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    id="is_published"
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => handleInputChange('is_published', e.target.checked)}
                    className="rounded border-gray-300"
                    aria-label="Published checkbox"
                  />
                  <Label htmlFor="is_published" className="cursor-pointer">Published</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Events List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading events...</p>
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No events yet</h3>
            <p className="text-gray-600 mb-4">Create your first event to get started</p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {events.map((event) => (
            <Card key={event.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge className={eventTypeColors[event.event_type]}>
                            {eventTypeLabels[event.event_type]}
                          </Badge>
                          {event.is_featured && (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Star className="w-3 h-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                          {event.is_published ? (
                            <Badge className="bg-green-100 text-green-800">Published</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">Draft</Badge>
                          )}
                          {event.is_free ? (
                            <Badge className="bg-blue-100 text-blue-800">Free</Badge>
                          ) : (
                            <Badge className="bg-orange-100 text-orange-800">
                              <DollarSign className="w-3 h-3 mr-1" />
                              ₦{event.ticket_price?.toLocaleString()}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-3 line-clamp-2">{event.description}</p>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(event.event_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {event.city}, {event.country}
                      </div>
                    </div>
                  </div>

                  <div className="flex md:flex-col gap-2 mt-4 md:mt-0 md:ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(event)}
                      className="flex-1 md:flex-none"
                    >
                      <Edit className="w-4 h-4 md:mr-2" />
                      <span className="hidden md:inline">Edit</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => togglePublished(event)}
                      className="flex-1 md:flex-none"
                    >
                      {event.is_published ? (
                        <>
                          <EyeOff className="w-4 h-4 md:mr-2" />
                          <span className="hidden md:inline">Unpublish</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 md:mr-2" />
                          <span className="hidden md:inline">Publish</span>
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleFeatured(event)}
                      className="flex-1 md:flex-none"
                    >
                      <Star className={`w-4 h-4 md:mr-2 ${event.is_featured ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                      <span className="hidden md:inline">{event.is_featured ? 'Unfeature' : 'Feature'}</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(event.id)}
                      className="flex-1 md:flex-none text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 md:mr-2" />
                      <span className="hidden md:inline">Delete</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
