'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, SlidersHorizontal } from 'lucide-react'

interface SearchFiltersProps {
  searchParams: {
    q?: string
    category?: string
    minPrice?: string
    maxPrice?: string
    type?: string
    sort?: string
    discipline?: string
    location?: string
    verified?: string
  }
}

export default function SearchFilters({ searchParams }: SearchFiltersProps) {
  const router = useRouter()
  const currentParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const searchType = searchParams.type || 'artworks'

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(currentParams)
    
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    
    startTransition(() => {
      router.push(`/search?${params.toString()}`)
    })
  }

  const clearAllFilters = () => {
    const params = new URLSearchParams()
    params.set('type', searchType)
    if (searchParams.q) {
      params.set('q', searchParams.q)
    }
    
    startTransition(() => {
      router.push(`/search?${params.toString()}`)
    })
  }

  const hasActiveFilters = 
    searchParams.category ||
    searchParams.minPrice ||
    searchParams.maxPrice ||
    searchParams.discipline ||
    searchParams.location ||
    searchParams.verified ||
    searchParams.sort

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <SlidersHorizontal className="w-5 h-5" />
            Filters
          </CardTitle>
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAllFilters}
              disabled={isPending}
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Sort By - Common for both types */}
        <div className="space-y-2">
          <Label>Sort By</Label>
          <Select
            value={searchParams.sort || 'relevant'}
            onValueChange={(value) => updateFilter('sort', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevant">Most Relevant</SelectItem>
              <SelectItem value="recent">Most Recent</SelectItem>
              {searchType === 'artworks' && (
                <>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Artwork Filters */}
        {searchType === 'artworks' && (
          <>
            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={searchParams.category || 'all'}
                onValueChange={(value) => updateFilter('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="painting">Painting</SelectItem>
                  <SelectItem value="sculpture">Sculpture</SelectItem>
                  <SelectItem value="digital_art">Digital Art</SelectItem>
                  <SelectItem value="photography">Photography</SelectItem>
                  <SelectItem value="mixed_media">Mixed Media</SelectItem>
                  <SelectItem value="textile">Textile Art</SelectItem>
                  <SelectItem value="fashion">Fashion</SelectItem>
                  <SelectItem value="art">Art</SelectItem>
                  <SelectItem value="books">Books</SelectItem>
                  <SelectItem value="events">Events</SelectItem>
                </SelectContent>
              </Select>
              {searchParams.category && searchParams.category !== 'all' && (
                <Badge variant="secondary" className="mt-2">
                  {searchParams.category}
                  <button
                    onClick={() => updateFilter('category', null)}
                    className="ml-2 hover:text-red-600"
                    aria-label="Remove category filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
            </div>

            {/* Price Range */}
            <div className="space-y-3">
              <Label>Price Range (₦)</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Input
                    type="number"
                    placeholder="Min"
                    value={searchParams.minPrice || ''}
                    onChange={(e) => updateFilter('minPrice', e.target.value || null)}
                    min="0"
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={searchParams.maxPrice || ''}
                    onChange={(e) => updateFilter('maxPrice', e.target.value || null)}
                    min="0"
                  />
                </div>
              </div>
              
              {/* Quick Price Ranges */}
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    updateFilter('minPrice', '0')
                    updateFilter('maxPrice', '10000')
                  }}
                >
                  Under ₦10k
                </Badge>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    updateFilter('minPrice', '10000')
                    updateFilter('maxPrice', '50000')
                  }}
                >
                  ₦10k - ₦50k
                </Badge>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    updateFilter('minPrice', '50000')
                    updateFilter('maxPrice', '100000')
                  }}
                >
                  ₦50k - ₦100k
                </Badge>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    updateFilter('minPrice', '100000')
                    updateFilter('maxPrice', null)
                  }}
                >
                  Above ₦100k
                </Badge>
              </div>

              {(searchParams.minPrice || searchParams.maxPrice) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => {
                    updateFilter('minPrice', null)
                    updateFilter('maxPrice', null)
                  }}
                >
                  Clear Price Range
                </Button>
              )}
            </div>
          </>
        )}

        {/* Creator Filters */}
        {searchType === 'creators' && (
          <>
            {/* Discipline */}
            <div className="space-y-2">
              <Label>Discipline</Label>
              <Select
                value={searchParams.discipline || 'all'}
                onValueChange={(value) => updateFilter('discipline', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Disciplines" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Disciplines</SelectItem>
                  <SelectItem value="painting">Painting</SelectItem>
                  <SelectItem value="sculpture">Sculpture</SelectItem>
                  <SelectItem value="digital_art">Digital Art</SelectItem>
                  <SelectItem value="photography">Photography</SelectItem>
                  <SelectItem value="mixed_media">Mixed Media</SelectItem>
                  <SelectItem value="textile">Textile Art</SelectItem>
                  <SelectItem value="fashion">Fashion Design</SelectItem>
                  <SelectItem value="illustration">Illustration</SelectItem>
                </SelectContent>
              </Select>
              {searchParams.discipline && searchParams.discipline !== 'all' && (
                <Badge variant="secondary" className="mt-2">
                  {searchParams.discipline}
                  <button
                    onClick={() => updateFilter('discipline', null)}
                    className="ml-2 hover:text-red-600"
                    aria-label="Remove discipline filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                type="text"
                placeholder="e.g., Lagos, Nigeria"
                value={searchParams.location || ''}
                onChange={(e) => updateFilter('location', e.target.value || null)}
              />
              {searchParams.location && (
                <Badge variant="secondary" className="mt-2">
                  {searchParams.location}
                  <button
                    onClick={() => updateFilter('location', null)}
                    className="ml-2 hover:text-red-600"
                    aria-label="Remove location filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
            </div>

            {/* Verified Only */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="verified"
                checked={searchParams.verified === 'true'}
                onChange={(e) => updateFilter('verified', e.target.checked ? 'true' : null)}
                className="w-4 h-4 rounded border-gray-300"
                aria-label="Show only verified creators"
              />
              <Label htmlFor="verified" className="cursor-pointer">
                Verified Creators Only
              </Label>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
