'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, MapPin, Clock, Users, Search, Filter, Grid, List, Star, Ticket, Video, Globe } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import Image from 'next/image'

export default function EventsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedLocation, setSelectedLocation] = useState('all')
  const [selectedDate, setSelectedDate] = useState('all')
  const [sortBy, setSortBy] = useState('date')

  const events = [
    {
      id: 1,
      title: 'African Art Exhibition: Contemporary Voices',
      organizer: 'Lagos Art Gallery',
      date: '2024-02-15',
      time: '10:00 AM - 6:00 PM',
      location: 'Lagos, Nigeria',
      venue: 'National Theatre Lagos',
      price: 5000,
      originalPrice: 7500,
      image: '/image/Art Exhibition Image.png',
      category: 'Art Exhibition',
      type: 'In-Person',
      capacity: 200,
      registered: 156,
      rating: 4.8,
      reviews: 24,
      isLiked: false,
      featured: true,
      description: 'Explore contemporary African art from emerging and established artists across the continent.',
      tags: ['art', 'contemporary', 'exhibition', 'lagos']
    },
    {
      id: 2,
      title: 'Fashion Week Accra 2024',
      organizer: 'Ghana Fashion Council',
      date: '2024-03-20',
      time: '7:00 PM - 11:00 PM',
      location: 'Accra, Ghana',
      venue: 'Accra International Conference Centre',
      price: 25000,
      image: '/image/Fashion Week Image.png',
      category: 'Fashion Show',
      type: 'In-Person',
      capacity: 500,
      registered: 387,
      rating: 4.9,
      reviews: 45,
      isLiked: true,
      featured: true,
      description: 'The premier fashion event showcasing the best of Ghanaian and African fashion designers.',
      tags: ['fashion', 'runway', 'designers', 'accra']
    },
    {
      id: 3,
      title: 'African Literature Festival',
      organizer: 'Chimamanda Adichie Foundation',
      date: '2024-02-28',
      time: '9:00 AM - 5:00 PM',
      location: 'Virtual Event',
      venue: 'Online Platform',
      price: 3000,
      image: '/image/Literature Festival Image.png',
      category: 'Literary Event',
      type: 'Virtual',
      capacity: 1000,
      registered: 678,
      rating: 4.7,
      reviews: 89,
      isLiked: false,
      featured: false,
      description: 'Celebrating African storytelling with renowned authors, poets, and literary critics.',
      tags: ['literature', 'authors', 'storytelling', 'virtual']
    },
    {
      id: 4,
      title: 'Traditional Music & Dance Workshop',
      organizer: 'Cultural Heritage Institute',
      date: '2024-03-05',
      time: '2:00 PM - 6:00 PM',
      location: 'Nairobi, Kenya',
      venue: 'Kenya National Theatre',
      price: 8000,
      image: '/image/Music Workshop Image.png',
      category: 'Workshop',
      type: 'In-Person',
      capacity: 50,
      registered: 32,
      rating: 4.6,
      reviews: 18,
      isLiked: false,
      featured: false,
      description: 'Learn traditional African music and dance from master practitioners.',
      tags: ['music', 'dance', 'traditional', 'workshop']
    },
    {
      id: 5,
      title: 'Digital Art & NFT Symposium',
      organizer: 'Africa Tech Creative Hub',
      date: '2024-03-12',
      time: '10:00 AM - 4:00 PM',
      location: 'Cape Town, South Africa',
      venue: 'Cape Town Convention Centre',
      price: 12000,
      image: '/placeholder.svg?height=300&width=400&text=Digital+Art+NFT',
      category: 'Technology',
      type: 'Hybrid',
      capacity: 300,
      registered: 245,
      rating: 4.5,
      reviews: 67,
      isLiked: true,
      featured: false,
      description: 'Exploring the intersection of African art and blockchain technology.',
      tags: ['digital-art', 'nft', 'blockchain', 'technology']
    },
    {
      id: 6,
      title: 'Pan-African Film Festival',
      organizer: 'African Cinema Collective',
      date: '2024-04-10',
      time: '6:00 PM - 10:00 PM',
      location: 'Dakar, Senegal',
      venue: 'Dakar Arts Village',
      price: 6500,
      image: '/placeholder.svg?height=300&width=400&text=Film+Festival',
      category: 'Film Festival',
      type: 'In-Person',
      capacity: 400,
      registered: 298,
      rating: 4.8,
      reviews: 52,
      isLiked: false,
      featured: true,
      description: 'Showcasing the best of contemporary African cinema and documentaries.',
      tags: ['film', 'cinema', 'documentary', 'pan-african']
    }
  ]

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'art-exhibition', label: 'Art Exhibitions' },
    { value: 'fashion-show', label: 'Fashion Shows' },
    { value: 'literary-event', label: 'Literary Events' },
    { value: 'workshop', label: 'Workshops' },
    { value: 'technology', label: 'Technology' },
    { value: 'film-festival', label: 'Film Festivals' },
    { value: 'music-concert', label: 'Music Concerts' }
  ]

  const locations = [
    { value: 'all', label: 'All Locations' },
    { value: 'virtual', label: 'Virtual Events' },
    { value: 'lagos-nigeria', label: 'Lagos, Nigeria' },
    { value: 'accra-ghana', label: 'Accra, Ghana' },
    { value: 'nairobi-kenya', label: 'Nairobi, Kenya' },
    { value: 'cape-town-south-africa', label: 'Cape Town, South Africa' },
    { value: 'dakar-senegal', label: 'Dakar, Senegal' }
  ]

  const dateFilters = [
    { value: 'all', label: 'All Dates' },
    { value: 'today', label: 'Today' },
    { value: 'tomorrow', label: 'Tomorrow' },
    { value: 'this-week', label: 'This Week' },
    { value: 'this-month', label: 'This Month' },
    { value: 'next-month', label: 'Next Month' }
  ]

  const sortOptions = [
    { value: 'date', label: 'Date (Earliest First)' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'popular', label: 'Most Popular' }
  ]

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.organizer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || 
                           event.category.toLowerCase().replace(' ', '-') === selectedCategory
    
    const matchesLocation = selectedLocation === 'all' || 
                           event.location.toLowerCase().replace(/[^a-z0-9]/g, '-') === selectedLocation ||
                           (selectedLocation === 'virtual' && event.type === 'Virtual')
    
    return matchesSearch && matchesCategory && matchesLocation
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-linear-to-r from-orange-500 to-red-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              African Cultural Events
            </h1>
            <p className="text-xl mb-8 text-orange-100 max-w-2xl mx-auto">
              Discover exhibitions, workshops, festivals, and cultural experiences across Africa
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="relative max-w-md mx-auto sm:mx-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search events, organizers, or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full text-gray-900"
                />
              </div>
              <Button variant="secondary" className="bg-white text-orange-600 hover:bg-orange-50">
                <Filter className="w-4 h-4 mr-2" />
                Advanced Filters
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="lg:w-64 space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Filters</h3>
                
                {/* Category Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Location Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.value} value={location.value}>
                          {location.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <Select value={selectedDate} onValueChange={setSelectedDate}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dateFilters.map((date) => (
                        <SelectItem key={date.value} value={date.value}>
                          {date.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Event Type Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Type
                  </label>
                  <div className="space-y-2">
                    {['In-Person', 'Virtual', 'Hybrid'].map((type) => (
                      <label key={type} className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                        <span className="ml-2 text-sm text-gray-700">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price
                  </label>
                  <div className="space-y-2">
                    {['Free', 'Under ₦5,000', '₦5,000 - ₦15,000', 'Over ₦15,000'].map((price) => (
                      <label key={price} className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                        <span className="ml-2 text-sm text-gray-700">{price}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Sort and View Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Events ({filteredEvents.length})
                </h2>
                <p className="text-gray-600">Discover cultural events and experiences</p>
              </div>
              
              <div className="flex items-center gap-4">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="flex border rounded-lg">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Events Grid/List */}
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' 
              : 'space-y-6'
            }>
              {filteredEvents.map((event) => (
                <Card key={event.id} className="group cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <CardContent className="p-0">
                    <div className="relative overflow-hidden">
                      <Image
                        src={event.image || "/placeholder.svg"}
                        alt={event.title}
                        width={400}
                        height={300}
                        className={`w-full object-cover group-hover:scale-110 transition-transform duration-500 ${
                          viewMode === 'grid' ? 'h-48' : 'h-40'
                        }`}
                      />
                      {event.featured && (
                        <Badge className="absolute top-4 left-4 bg-orange-500 text-white">
                          Featured
                        </Badge>
                      )}
                      {event.originalPrice && (
                        <Badge className="absolute top-4 right-4 bg-red-500 text-white">
                          Sale
                        </Badge>
                      )}
                      <div className="absolute bottom-4 right-4">
                        {event.type === 'Virtual' && (
                          <Badge className="bg-brand-orange text-white">
                            <Video className="w-3 h-3 mr-1" />
                            Virtual
                          </Badge>
                        )}
                        {event.type === 'Hybrid' && (
                          <Badge className="bg-brand-red text-white">
                            <Globe className="w-3 h-3 mr-1" />
                            Hybrid
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-6 overflow-hidden">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2 wrap-break-word">
                            {event.title}
                          </h3>
                          <p className="text-gray-600 text-sm mt-1 truncate">
                            by {event.organizer}
                          </p>
                        </div>
                        <Badge variant="secondary" className="shrink-0">{event.category}</Badge>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2 shrink-0" />
                          <span className="truncate">{formatDate(event.date)}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="w-4 h-4 mr-2 shrink-0" />
                          <span className="truncate">{event.time}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2 shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="w-4 h-4 mr-2 shrink-0" />
                          {event.registered}/{event.capacity} registered
                        </div>
                      </div>
                      
                      <div className="flex items-center mb-4">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(event.rating)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-sm text-gray-600">
                            {event.rating} ({event.reviews} reviews)
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {event.description}
                      </p>
                      
                      <div className="flex flex-col gap-3">
                        {/* Price Display - Current price first, original price below */}
                        <div className="flex flex-col gap-1">
                          <span className="text-lg font-bold text-gray-900">
                            ₦{event.price.toLocaleString()}
                          </span>
                          {event.originalPrice && (
                            <span className="text-xs text-gray-500 line-through">
                              ₦{event.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                        
                        {/* Get Ticket Button */}
                        <Button size="sm" className="bg-orange-600 hover:bg-orange-700 w-full">
                          <Ticket className="w-4 h-4 mr-2" />
                          Get Ticket
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More Button */}
            <div className="text-center mt-12">
              <Button variant="outline" size="lg">
                Load More Events
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
