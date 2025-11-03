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
  const [priceRange, setPriceRange] = useState([0, 500000])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('newest')

  // Filter and sort artworks
  const filteredArtworks = initialArtworks
    .filter((art) => {
      const matchesSearch = art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesCategory = selectedCategory === 'all' || art.category === selectedCategory
      const matchesPrice = art.price >= priceRange[0] && art.price <= priceRange[1]
      return matchesSearch && matchesCategory && matchesPrice
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
          return 0 // Already sorted by created_at desc from server
      }
    })

  // Get unique categories from artworks
  const categories = ['all', ...new Set(initialArtworks.map(art => art.category).filter(Boolean))]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 mt-20">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Discover African Art</h1>
          <p className="text-gray-600">Explore unique artworks from talented African artists</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Search by title, artist, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>

            {/* Price Range */}
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm text-gray-600 mb-2 block">
                Price Range: ₦{priceRange[0].toLocaleString()} - ₦{priceRange[1].toLocaleString()}
              </label>
              <Slider
                value={priceRange}
                onValueChange={setPriceRange}
                min={0}
                max={500000}
                step={10000}
                className="w-full"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2 ml-auto">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid size={20} />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List size={20} />
              </Button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-gray-600">
            Showing {filteredArtworks.length} of {initialArtworks.length} artworks
          </p>
        </div>

        {/* Artworks Grid/List */}
        {filteredArtworks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No artworks found matching your criteria</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
          }>
            {filteredArtworks.map((artwork) => (
              <Card key={artwork.id} className={viewMode === 'list' ? 'flex' : ''}>
                <div className={viewMode === 'list' ? 'w-48 relative' : 'relative aspect-square'}>
                  <Image
                    src={artwork.image}
                    alt={artwork.title}
                    fill
                    className="object-cover rounded-t-lg"
                    sizes={viewMode === 'grid' ? '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw' : '192px'}
                  />
                  <button 
                    className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
                    aria-label={artwork.isLiked ? 'Remove from favorites' : 'Add to favorites'}
                    title={artwork.isLiked ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart size={20} className={artwork.isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'} />
                  </button>
                  {artwork.category && (
                    <Badge className="absolute bottom-2 left-2">{artwork.category}</Badge>
                  )}
                </div>
                
                <CardContent className={viewMode === 'list' ? 'flex-1 p-4' : 'p-4'}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-1">{artwork.title}</h3>
                      <p className="text-sm text-gray-600">{artwork.artist}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 mb-2">
                    <Star size={16} className="fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{artwork.rating}</span>
                    <span className="text-sm text-gray-500">({artwork.reviews})</span>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm text-gray-600">{artwork.medium}</p>
                    <p className="text-sm text-gray-600">{artwork.size}</p>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <p className="text-xl font-bold text-green-600">
                      ₦{artwork.price.toLocaleString()}
                    </p>
                    <AddToCartButton artworkId={artwork.id} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}