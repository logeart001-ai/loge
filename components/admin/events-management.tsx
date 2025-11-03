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
import { fileUploadService } from '@/lib/file-upload'

interface Event {
  id: string
  organizer_id: string
  title: string
  description?: string | null
  event_type: 'exhibition' | 'workshop' | 'gallery_opening' | 'art_fair' | 'networking'
  event_date?: string | null
  start_date?: string | null
  end_date?: string | null
  city?: string | null
  country?: string | null
  is_free: boolean
  ticket_price?: number | null
  is_featured: boolean
  is_published: boolean
  image_url?: string | null
  venue_name?: string | null
  address?: string | null
  capacity?: number | null
  registration_url?: string | null
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
  venue_name: string
  address: string
  capacity: string
  registration_url: string
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
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    event_type: 'exhibition',
    event_date: '',
    start_date: '',
    end_date: '',
    city: '',
    country: 'Nigeria',
    venue_name: '',
    address: '',
    capacity: '',
    registration_url: '',
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

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be less than 10MB')
      return
    }

    setImageFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const uploadEventImage = async (eventId: string): Promise<string | null> => {
    if (!imageFile) return null

    setUploadingImage(true)
    try {
      const result = await fileUploadService.uploadFile(
        imageFile,
        'event-images',
        eventId
      )

      if (!result.success) {
        throw new Error(result.error || 'Upload failed')
      }

      return result.url || null
    } catch (error) {
      console.error('Image upload error:', error)
      alert('Failed to upload image: ' + (error instanceof Error ? error.message : 'Unknown error'))
      return null
    } finally {
      setUploadingImage(false)
    }
  }

  const clearImageSelection = () => {
    setImageFile(null)
    setImagePreview(null)
  }

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
      venue_name: '',
      address: '',
      capacity: '',
      registration_url: '',
      is_free: false,
      ticket_price: '',
      is_featured: false,
      is_published: true
    })
    setEditingEvent(null)
    clearImageSelection()
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

      let imageUrl = editingEvent?.image_url || null

      // Handle image upload for new events or when image is changed
      if (imageFile) {
        if (editingEvent) {
          // Upload new image for existing event
          imageUrl = await uploadEventImage(editingEvent.id)
        } else {
          // For new events, we'll upload after creating the event
          // This is handled below
        }
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
        venue_name: formData.venue_name || null,
        address: formData.address || null,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        registration_url: formData.registration_url || null,
        is_free: formData.is_free,
        ticket_price: formData.is_free ? null : parseFloat(formData.ticket_price) || null,
        is_featured: formData.is_featured,
        is_published: formData.is_published,
        image_url: imageUrl,
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
        const { data: newEvent, error } = await supabase
          .from('events')
          .insert([eventData])
          .select('id')
          .single()

        if (error) throw error

        // Upload image for new event if provided
        if (imageFile && newEvent) {
          const uploadedImageUrl = await uploadEventImage(newEvent.id)
          if (uploadedImageUrl) {
            // Update the event with the image URL
            await supabase
              .from('events')
              .update({ image_url: uploadedImageUrl })
              .eq('id', newEvent.id)
          }
        }

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
      title: event.title || '',
      description: event.description || '',
      event_type: event.event_type || '',
      event_date: event.event_date ? event.event_date.split('T')[0] : '',
      start_date: event.start_date ? event.start_date.split('T')[0] : '',
      end_date: event.end_date ? event.end_date.split('T')[0] : '',
      city: event.city || '',
      country: event.country || '',
      venue_name: event.venue_name || '',
      address: event.address || '',
      capacity: event.capacity?.toString() || '',
      registration_url: event.registration_url || '',
      is_free: event.is_free ?? true,
      ticket_price: event.ticket_price?.toString() || '',
      is_featured: event.is_featured ?? false,
      is_published: event.is_published ?? true
    })
    
    // Set current image for preview
    if (event.image_url) {
      setImagePreview(event.image_url)
    } else {
      setImagePreview(null)
    }
    setImageFile(null)
    
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

                {/* Event Image Upload */}
                <div className="md:col-span-2">
                  <Label>Event Image</Label>
                  <div className="mt-2">
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Event preview"
                          className="w-full h-48 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={clearImageSelection}
                          className="absolute top-2 right-2 bg-white"
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                          id="event-image"
                        />
                        <label
                          htmlFor="event-image"
                          className="cursor-pointer flex flex-col items-center"
                        >
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                            <Plus className="w-6 h-6 text-gray-400" />
                          </div>
                          <p className="text-sm text-gray-600">
                            Click to upload event image
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            JPG, PNG up to 10MB
                          </p>
                        </label>
                      </div>
                    )}
                  </div>
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

                <div>
                  <Label htmlFor="venue_name">Venue Name</Label>
                  <Input
                    id="venue_name"
                    value={formData.venue_name}
                    onChange={(e) => handleInputChange('venue_name', e.target.value)}
                    placeholder="e.g., National Theatre Lagos"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Full address of the venue"
                  />
                </div>

                <div>
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => handleInputChange('capacity', e.target.value)}
                    placeholder="Maximum attendees"
                    min="1"
                  />
                </div>

                <div>
                  <Label htmlFor="registration_url">Registration URL</Label>
                  <Input
                    id="registration_url"
                    type="url"
                    value={formData.registration_url}
                    onChange={(e) => handleInputChange('registration_url', e.target.value)}
                    placeholder="https://example.com/register"
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

                    <p className="text-gray-600 mb-3 line-clamp-2">{event.description || 'No description provided'}</p>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {event.event_date ? new Date(event.event_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : 'Date TBD'}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {event.city || 'Location TBD'}, {event.country || 'Country TBD'}
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
