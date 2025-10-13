'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Filter, 
  X, 
  ChevronDown,
  DollarSign,
  Grid3X3,
  MapPin,
  CheckCircle2
} from 'lucide-react'

interface FilterOptions {
  categories: string[]
  minPrice: string
  maxPrice: string
  availability: 'all' | 'available' | 'sold'
  sortBy: 'relevance' | 'price-low' | 'price-high' | 'newest' | 'popular'
  searchType: 'all' | 'artworks' | 'creators'
}

interface SearchFiltersProps {
  onFilterChange: (filters: FilterOptions) => void
  initialFilters: FilterOptions
}

const CATEGORIES = [
  { value: 'art', label: 'Art' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'books', label: 'Books' },
  { value: 'events', label: 'Events' }
]

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
  { value: 'popular', label: 'Most Popular' }
]

const SEARCH_TYPES = [
  { value: 'all', label: 'All' },
  { value: 'artworks', label: 'Artworks' },
  { value: 'creators', label: 'Creators' }
]

export function SearchFilters({ onFilterChange, initialFilters }: SearchFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>(initialFilters)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    onFilterChange(filters)
  }, [filters, onFilterChange])

  const updateFilter = <K extends keyof FilterOptions>(
    key: K,
    value: FilterOptions[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const toggleCategory = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }))
  }

  const clearFilters = () => {
    const defaultFilters: FilterOptions = {
      categories: [],
      minPrice: '',
      maxPrice: '',
      availability: 'all',
      sortBy: 'relevance',
      searchType: 'all'
    }
    setFilters(defaultFilters)
    
    // Keep only the search query
    const query = searchParams.get('q')
    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  const hasActiveFilters = 
    filters.categories.length > 0 ||
    filters.minPrice !== '' ||
    filters.maxPrice !== '' ||
    filters.availability !== 'all' ||
    filters.searchType !== 'all'

  return (
    <div className="space-y-4">
      {/* Top Bar with Search Type and Sort */}
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-2">
          {/* Search Type Selector */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            {SEARCH_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => updateFilter('searchType', type.value as FilterOptions['searchType'])}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  filters.searchType === type.value
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Filter Toggle Button */}
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0">
                {filters.categories.length + 
                  (filters.minPrice ? 1 : 0) + 
                  (filters.maxPrice ? 1 : 0) + 
                  (filters.availability !== 'all' ? 1 : 0)}
              </Badge>
            )}
          </Button>
        </div>

        {/* Sort By */}
        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-sm text-gray-600">Sort by:</label>
          <select
            id="sort-select"
            value={filters.sortBy}
            onChange={(e) => updateFilter('sortBy', e.target.value as FilterOptions['sortBy'])}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter Options
            </h3>
            {hasActiveFilters && (
              <Button
                onClick={clearFilters}
                variant="ghost"
                size="sm"
                className="text-orange-600 hover:text-orange-700"
              >
                <X className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Categories */}
            {filters.searchType !== 'creators' && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Grid3X3 className="w-4 h-4" />
                  Categories
                </label>
                <div className="space-y-2">
                  {CATEGORIES.map((category) => (
                    <label
                      key={category.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(category.value)}
                        onChange={() => toggleCategory(category.value)}
                        className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700">{category.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Price Range */}
            {filters.searchType !== 'creators' && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Price Range (₦)
                </label>
                <div className="space-y-2">
                  <input
                    type="number"
                    placeholder="Min price"
                    value={filters.minPrice}
                    onChange={(e) => updateFilter('minPrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <input
                    type="number"
                    placeholder="Max price"
                    value={filters.maxPrice}
                    onChange={(e) => updateFilter('maxPrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            )}

            {/* Availability */}
            {filters.searchType !== 'creators' && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Availability
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'All Artworks' },
                    { value: 'available', label: 'Available Only' },
                    { value: 'sold', label: 'Sold Items' }
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="availability"
                        value={option.value}
                        checked={filters.availability === option.value}
                        onChange={(e) => updateFilter('availability', e.target.value as FilterOptions['availability'])}
                        className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="pt-4 border-t">
              <div className="flex flex-wrap gap-2">
                {filters.categories.map((cat) => (
                  <Badge key={cat} variant="secondary" className="gap-1">
                    {CATEGORIES.find(c => c.value === cat)?.label}
                    <button
                      onClick={() => toggleCategory(cat)}
                      className="ml-1 hover:text-orange-600"
                      aria-label={`Remove ${cat} filter`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                {filters.minPrice && (
                  <Badge variant="secondary" className="gap-1">
                    Min: ₦{filters.minPrice}
                    <button
                      onClick={() => updateFilter('minPrice', '')}
                      className="ml-1 hover:text-orange-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filters.maxPrice && (
                  <Badge variant="secondary" className="gap-1">
                    Max: ₦{filters.maxPrice}
                    <button
                      onClick={() => updateFilter('maxPrice', '')}
                      className="ml-1 hover:text-orange-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filters.availability !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    {filters.availability === 'available' ? 'Available' : 'Sold'}
                    <button
                      onClick={() => updateFilter('availability', 'all')}
                      className="ml-1 hover:text-orange-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
