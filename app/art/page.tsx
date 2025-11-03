'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Heart, Search, Filter, Grid, List, Star } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { AddToCartButton } from '@/components/cart/add-to-cart-button'
import Image from 'next/image'

export default function ArtPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [priceRange, setPriceRange] = useState([0, 500000])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('newest')

  const artworks = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      title: 'Sunset Over Lagos',
      artist: 'Adunni Olorisha',
      price: 75000,
      originalPrice: 85000,
      image: '/image/Sunset Over Lagos.png',
      category: 'Painting',
      medium: 'Oil on Canvas',
      size: '60x80 cm',
      rating: 4.8,
      reviews: 24,
      isLiked: false,
      tags: ['landscape', 'sunset', 'lagos', 'contemporary']
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      title: 'Mother Earth',
      artist: 'Kwame Asante',
      price: 120000,
      image: '/image/Mother Earth.jpg',
      category: 'Sculpture',
      medium: 'Bronze',
      size: '45x30x25 cm',
      rating: 4.9,
      reviews: 18,
      isLiked: true,
      tags: ['sculpture', 'bronze', 'mother', 'earth', 'traditional']
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      title: 'Urban Dreams',
      artist: 'Zara Mthembu',
      price: 45000,
      image: '/image/Urban Dreams.png',
      category: 'Digital Art',
      medium: 'Digital Print',
      size: '50x70 cm',
      rating: 4.7,
      reviews: 31,
      isLiked: false,
      tags: ['digital', 'urban', 'contemporary', 'dreams']
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440004',
      title: 'Ancestral Wisdom',
      artist: 'Chinua Okoro',
      price: 95000,
      image: '/image/Ancestral Wisdom.png',
      category: 'Mixed Media',
      medium: 'Mixed Media on Wood',
      size: '80x60 cm',
      rating: 4.6,
      reviews: 15,
      isLiked: false,
      tags: ['mixed-media', 'ancestral', 'wisdom', 'wood']
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440005',
      title: 'Rhythms of the Sahel',
      artist: 'Fatima Al-Zahra',
      price: 65000,
      image: '/image/Rhythms of the Sahel.png',
      category: 'Painting',
      medium: 'Acrylic on Canvas',
      size: '70x50 cm',
      rating: 4.8,
      reviews: 22,
      isLiked: true,
      tags: ['painting', 'sahel', 'rhythms', 'acrylic']
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440006',
      title: 'Golden Threads',
      artist: 'Amara Kone',
      price: 180000,
      image: '/image/placeholder.svg',
      category: 'Textile Art',
      medium: 'Woven Textile',
      size: '100x150 cm',
      rating: 4.9,
      reviews: 18,
      isLiked: false,
      tags: ['textile', 'golden', 'threads', 'woven']
    },
    {
      id: 5,
      title: 'Rhythms of the Sahel',
      artist: 'Fatima Al-Zahra',
      price: 65000,
      image: '/image/Rhythms of the Sahel.png',
      category: 'Painting',
      medium: 'Acrylic on Canvas',
      size: '70x50 cm',
      rating: 4.8,
      reviews: 22,
      isLiked: true,
      tags: ['painting', 'sahel', 'rhythms', 'acrylic']
    },
    {
      id: 6,
      title: 'Golden Threads',
      artist: 'Amara Kone',
      price: 180000,
  image: '/image/placeholder.svg',
      category: 'Textile Art',
      medium: 'Gold Thread on Silk',
      size: '100x80 cm',
      rating: 4.9,
      reviews: 12,
      isLiked: false,
      tags: ['textile', 'gold', 'threads', 'silk', 'luxury']
    }
  ]

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'painting', label: 'Paintings' },
    { value: 'sculpture', label: 'Sculptures' },
    { value: 'digital-art', label: 'Digital Art' },
    { value: 'mixed-media', label: 'Mixed Media' },
    { value: 'textile-art', label: 'Textile Art' },
    { value: 'photography', label: 'Photography' }
  ]

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'popular', label: 'Most Popular' }
  ]

  const filteredArtworks = artworks.filter(artwork => {
    const matchesSearch = artwork.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         artwork.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         artwork.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || 
                           artwork.category.toLowerCase().replace(' ', '-') === selectedCategory
    
    const matchesPrice = artwork.price >= priceRange[0] && artwork.price <= priceRange[1]
    
    return matchesSearch && matchesCategory && matchesPrice
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-linear-to-r from-orange-500 to-red-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              African Art Gallery
            </h1>
            <p className="text-xl mb-8 text-orange-100 max-w-2xl mx-auto">
              Discover authentic African artworks from talented creators across the continent
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="relative max-w-md mx-auto sm:mx-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search artworks, artists, or styles..."
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

                {/* Price Range Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range (₦)
                  </label>
                  <div className="px-2">
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={500000}
                      min={0}
                      step={5000}
                      className="mb-2"
                    />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>₦{priceRange[0].toLocaleString()}</span>
                      <span>₦{priceRange[1].toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Medium Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medium
                  </label>
                  <div className="space-y-2">
                    {['Oil on Canvas', 'Acrylic', 'Digital', 'Mixed Media', 'Sculpture', 'Photography'].map((medium) => (
                      <label key={medium} className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                        <span className="ml-2 text-sm text-gray-700">{medium}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Size Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Size
                  </label>
                  <div className="space-y-2">
                    {['Small (< 50cm)', 'Medium (50-100cm)', 'Large (> 100cm)'].map((size) => (
                      <label key={size} className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                        <span className="ml-2 text-sm text-gray-700">{size}</span>
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
                  Artworks ({filteredArtworks.length})
                </h2>
                <p className="text-gray-600">Discover unique pieces from African artists</p>
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

            {/* Artworks Grid/List */}
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' 
              : 'space-y-6'
            }>
              {filteredArtworks.map((artwork) => (
                <Card key={artwork.id} className="group cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <CardContent className="p-0">
                    <div className="relative overflow-hidden">
                      <Image
                        src={artwork.image || "/image/placeholder.svg"}
                        alt={artwork.title}
                        width={300}
                        height={300}
                        className={`w-full object-cover group-hover:scale-110 transition-transform duration-500 ${
                          viewMode === 'grid' ? 'h-64' : 'h-48'
                        }`}
                      />
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button size="sm" variant="secondary" className="rounded-full w-10 h-10 p-0">
                          <Heart className={`w-4 h-4 ${artwork.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                        </Button>
                      </div>
                      {artwork.originalPrice && (
                        <Badge className="absolute top-4 left-4 bg-red-500 text-white">
                          Sale
                        </Badge>
                      )}
                    </div>
                    
                    <div className="p-6 overflow-hidden">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-gray-900 group-hover:text-orange-600 transition-colors wrap-break-words line-clamp-2">
                            {artwork.title}
                          </h3>
                          <p className="text-gray-600 text-sm truncate">by {artwork.artist}</p>
                        </div>
                        <Badge variant="secondary" className="shrink-0">{artwork.category}</Badge>
                      </div>
                      
                      <div className="flex items-center mb-3">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(artwork.rating)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-sm text-gray-600">
                            {artwork.rating} ({artwork.reviews} reviews)
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-4">
                        <p className="truncate">{artwork.medium} • {artwork.size}</p>
                      </div>
                      
                      <div className="flex flex-col gap-3">
                        {/* Price Display - Current price first, original price below */}
                        <div className="flex flex-col gap-1">
                          <span className="text-lg font-bold text-gray-900">
                            ₦{artwork.price.toLocaleString()}
                          </span>
                          {artwork.originalPrice && (
                            <span className="text-xs text-gray-500 line-through">
                              ₦{artwork.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                        
                        {/* Add to Cart Button */}
                        <AddToCartButton artworkId={String(artwork.id)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More Button */}
            <div className="text-center mt-12">
              <Button variant="outline" size="lg">
                Load More Artworks
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
