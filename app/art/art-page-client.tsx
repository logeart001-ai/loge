'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Search, Filter, Grid, List, Heart, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Navbar } from '@/components/navbar'
import { AddToCartButton } from '@/components/cart/add-to-cart-button'

type Artwork = {
  id: string
  title: string
  artist: string
  price: number
  image: string
  category: string
  medium: string
  size: string
  rating: number
  reviews: number
  isLiked: boolean
  tags: string[]
}

type ArtPageClientProps = {
  initialArtworks: Artwork[]
}

export function ArtPageClient({ initialArtworks }: ArtPageClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedMedium, setSelectedMedium] = useState('all')
  const [selectedSize, setSelectedSize] = useState('all')
  const [priceRange, setPriceRange] = useState([0, 500000])
  const [sortBy, setSortBy] = useState('newest')

  // Filter and sort artworks
  const filteredArtworks = initialArtworks
    .filter((art) => {
      const matchesSearch = art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesCategory = selectedCategory === 'all' || art.category.toLowerCase() === selectedCategory.toLowerCase()
      const matchesMedium = selectedMedium === 'all' || art.medium.toLowerCase().includes(selectedMedium.toLowerCase())
      const matchesSize = selectedSize === 'all' || art.size.toLowerCase().includes(selectedSize.toLowerCase())
      const matchesPrice = art.price >= priceRange[0] && art.price <= priceRange[1]
      return matchesSearch && matchesCategory && matchesMedium && matchesSize && matchesPrice
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        case 'popular':
          return b.reviews - a.reviews
        case 'newest':
        default:
          return 0
      }
    })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-linear-to-r from-orange-500 to-red-500 text-white py-16 mt-16">
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
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="painting">Painting</SelectItem>
                      <SelectItem value="sculpture">Sculpture</SelectItem>
                      <SelectItem value="digital art">Digital Art</SelectItem>
                      <SelectItem value="mixed media">Mixed Media</SelectItem>
                      <SelectItem value="textile art">Textile Art</SelectItem>
                      <SelectItem value="photography">Photography</SelectItem>
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
                      step={10000}
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
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMedium(medium.toLowerCase())
                            } else {
                              setSelectedMedium('all')
                            }
                          }}
                        />
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
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSize(size.toLowerCase())
                            } else {
                              setSelectedSize('all')
                            }
                          }}
                        />
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
            {/* Header */}
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
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex border rounded-lg">
                  <Button
                    variant="default"
                    size="sm"
                    className="rounded-r-none"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-l-none"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Artworks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredArtworks.map((artwork) => (
                <Card key={artwork.id} className="group cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="relative aspect-square overflow-hidden">
                      <Image
                        src={artwork.image}
                        alt={artwork.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-red-500 text-white text-xs">Sale</Badge>
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="secondary" className="rounded-full w-8 h-8 p-0">
                          <Heart className={`w-4 h-4 ${artwork.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{artwork.title}</h3>
                          <p className="text-sm text-gray-600">by {artwork.artist}</p>
                        </div>
                        <Badge variant="secondary" className="ml-2">{artwork.category}</Badge>
                      </div>
                      
                      <div className="flex items-center mb-2">
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
                          <span className="ml-1 text-sm text-gray-600">
                            {artwork.rating} ({artwork.reviews} reviews)
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-3">
                        <p>{artwork.medium} • {artwork.size}</p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-lg font-bold text-gray-900">
                            ₦{artwork.price.toLocaleString()}
                          </span>
                        </div>
                        <AddToCartButton artworkId={artwork.id} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More Button */}
            <div className="text-center mt-8">
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