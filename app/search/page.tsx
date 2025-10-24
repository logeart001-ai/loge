import { Suspense } from 'react'
import { createServerClient } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import SearchFilters from '@/components/search-filters'
import SearchBar from '@/components/search-bar'
import { 
  Eye, 
  MapPin, 
  BadgeCheck, 
  ShoppingCart,
  Package
} from 'lucide-react'
import Link from 'next/link'

interface SearchParams {
  q?: string
  category?: string
  minPrice?: string
  maxPrice?: string
  type?: 'artworks' | 'creators'
  sort?: 'relevant' | 'price-asc' | 'price-desc' | 'recent' | 'popular'
  discipline?: string
  location?: string
  verified?: string
}

interface Artwork {
  id: string
  title: string
  description: string
  price: number
  currency: string
  category: string
  thumbnail_url: string | null
  image_urls: string[]
  views_count: number
  is_available: boolean
  creator_id: string
  created_at: string
  user_profiles: {
    full_name: string
    avatar_url: string | null
    is_verified: boolean
  }
}

interface Creator {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  bio: string | null
  location: string | null
  discipline: string | null
  is_verified: boolean
  created_at: string
  artworks_count?: number
}

async function searchArtworks(params: SearchParams) {
  const supabase = await createServerClient()
  
  let query = supabase
    .from('artworks')
    .select('*')
    .eq('is_available', true)

  // Search query
  if (params.q) {
    query = query.or(`title.ilike.%${params.q}%,description.ilike.%${params.q}%,tags.cs.{${params.q}}`)
  }

  // Category filter
  if (params.category && params.category !== 'all') {
    query = query.eq('category', params.category)
  }

  // Price range
  if (params.minPrice) {
    query = query.gte('price', parseFloat(params.minPrice))
  }
  if (params.maxPrice) {
    query = query.lte('price', parseFloat(params.maxPrice))
  }

  // Sorting
  switch (params.sort) {
    case 'price-asc':
      query = query.order('price', { ascending: true })
      break
    case 'price-desc':
      query = query.order('price', { ascending: false })
      break
    case 'recent':
      query = query.order('created_at', { ascending: false })
      break
    case 'popular':
      query = query.order('views_count', { ascending: false })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  const { data: artworks, error } = await query.limit(50)

  if (error) {
    console.error('Error searching artworks:', error)
    return []
  }

  if (!artworks || artworks.length === 0) {
    return []
  }

  // Fetch creator information separately
  const creatorIds = [...new Set(artworks.map((a) => a.creator_id).filter(Boolean))]
  const { data: creators, error: creatorsError } = await supabase
    .from('user_profiles')
    .select('id, full_name, avatar_url, is_verified')
    .in('id', creatorIds)

  if (creatorsError) {
    console.error('Error fetching creators:', creatorsError)
    // Return artworks without creator info
    return artworks.map((artwork) => ({
      ...artwork,
      user_profiles: {
        full_name: 'Unknown Artist',
        avatar_url: null,
        is_verified: false
      }
    })) as Artwork[]
  }

  // Map creator info to artworks
  const creatorsMap = new Map(creators?.map(c => [c.id, c]) || [])
  return artworks.map((artwork) => {
    const creator = creatorsMap.get(artwork.creator_id)
    return {
      ...artwork,
      user_profiles: {
        full_name: creator?.full_name || 'Unknown Artist',
        avatar_url: creator?.avatar_url || null,
        is_verified: creator?.is_verified || false
      }
    }
  }) as Artwork[]
}

async function searchCreators(params: SearchParams) {
  const supabase = await createServerClient()
  
  let query = supabase
    .from('user_profiles')
    .select('*')
    .eq('role', 'creator')

  // Search query
  if (params.q) {
    query = query.or(`full_name.ilike.%${params.q}%,bio.ilike.%${params.q}%,discipline.ilike.%${params.q}%`)
  }

  // Discipline filter
  if (params.discipline && params.discipline !== 'all') {
    query = query.eq('discipline', params.discipline)
  }

  // Location filter
  if (params.location) {
    query = query.ilike('location', `%${params.location}%`)
  }

  // Verified filter
  if (params.verified === 'true') {
    query = query.eq('is_verified', true)
  }

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query.limit(50)

  if (error) {
    console.error('Error searching creators:', error)
    return []
  }

  // Get artwork counts for each creator
  const creatorsWithCounts = await Promise.all(
    (data || []).map(async (creator) => {
      const { count } = await supabase
        .from('artworks')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', creator.id)
        .eq('is_available', true)

      return {
        ...creator,
        artworks_count: count || 0
      }
    })
  )

  return creatorsWithCounts as Creator[]
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const searchType = searchParams.type || 'artworks'
  const searchQuery = searchParams.q || ''
  
  const artworks = searchType === 'artworks' ? await searchArtworks(searchParams) : []
  const creators = searchType === 'creators' ? await searchCreators(searchParams) : []

  const formatCurrency = (amount: number, currency: string = 'NGN') => {
    if (currency === 'NGN') {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount)
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              L&apos;oge Arts
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/dashboard/collector">
                <Button variant="outline" size="sm">Dashboard</Button>
              </Link>
            </div>
          </div>
          
          {/* Search Bar */}
          <Suspense fallback={<div className="h-12 bg-gray-100 rounded-lg animate-pulse" />}>
            <SearchBar initialQuery={searchQuery} initialType={searchType} />
          </Suspense>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <Suspense fallback={<div className="h-96 bg-white rounded-lg animate-pulse" />}>
              <SearchFilters searchParams={searchParams} />
            </Suspense>
          </aside>

          {/* Results */}
          <main className="lg:col-span-3">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {searchQuery ? `Results for "${searchQuery}"` : 'Browse All'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {searchType === 'artworks' 
                    ? `${artworks.length} artworks found` 
                    : `${creators.length} creators found`
                  }
                </p>
              </div>
            </div>

            {/* Artworks Results */}
            {searchType === 'artworks' && (
              <div className="space-y-6">
                {artworks.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {artworks.map((artwork) => (
                      <Card key={artwork.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <Link href={`/art/${artwork.id}`}>
                          <div className="relative h-48 bg-gray-200">
                            {artwork.thumbnail_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={artwork.thumbnail_url}
                                alt={artwork.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <Package className="w-12 h-12 text-gray-400" />
                              </div>
                            )}
                            
                            {!artwork.is_available && (
                              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                <Badge variant="secondary">Sold Out</Badge>
                              </div>
                            )}
                          </div>
                        </Link>

                        <CardContent className="p-4">
                          <Link href={`/art/${artwork.id}`}>
                            <h3 className="font-semibold text-lg text-gray-900 hover:text-orange-600 truncate">
                              {artwork.title}
                            </h3>
                          </Link>

                          {/* Creator */}
                          <Link 
                            href={`/creators/${artwork.creator_id}`}
                            className="flex items-center gap-2 mt-2 text-sm text-gray-600 hover:text-gray-900"
                          >
                            {artwork.user_profiles?.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={artwork.user_profiles.avatar_url}
                                alt={artwork.user_profiles.full_name}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gray-300" />
                            )}
                            <span className="truncate">{artwork.user_profiles?.full_name}</span>
                            {artwork.user_profiles?.is_verified && (
                              <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />
                            )}
                          </Link>

                          {/* Price and Stats */}
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-xl font-bold text-gray-900">
                              {formatCurrency(artwork.price, artwork.currency)}
                            </span>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Eye className="w-4 h-4" />
                              {artwork.views_count}
                            </div>
                          </div>

                          {/* Category */}
                          <div className="mt-2">
                            <Badge variant="outline">
                              {artwork.category}
                            </Badge>
                          </div>

                          {/* Add to Cart Button */}
                          {artwork.is_available && (
                            <Link href={`/art/${artwork.id}`}>
                              <Button className="w-full mt-3 bg-orange-500 hover:bg-orange-600">
                                <ShoppingCart className="w-4 h-4 mr-2" />
                                View Details
                              </Button>
                            </Link>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-12 text-center">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No artworks found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Try adjusting your filters or search query
                    </p>
                    <Link href="/search">
                      <Button variant="outline">Clear Filters</Button>
                    </Link>
                  </Card>
                )}
              </div>
            )}

            {/* Creators Results */}
            {searchType === 'creators' && (
              <div className="space-y-6">
                {creators.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {creators.map((creator) => (
                      <Card key={creator.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            {/* Avatar */}
                            <Link href={`/creators/${creator.id}`}>
                              {creator.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={creator.avatar_url}
                                  alt={creator.full_name}
                                  className="w-16 h-16 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-16 h-16 rounded-full bg-linear-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-2xl font-bold">
                                  {creator.full_name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </Link>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <Link href={`/creators/${creator.id}`}>
                                <h3 className="font-semibold text-lg text-gray-900 hover:text-orange-600 flex items-center gap-2">
                                  <span className="truncate">{creator.full_name}</span>
                                  {creator.is_verified && (
                                    <BadgeCheck className="w-5 h-5 text-blue-500 shrink-0" />
                                  )}
                                </h3>
                              </Link>

                              {/* Discipline & Location */}
                              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                                {creator.discipline && (
                                  <Badge variant="secondary">
                                    {creator.discipline}
                                  </Badge>
                                )}
                                {creator.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {creator.location}
                                  </span>
                                )}
                              </div>

                              {/* Bio */}
                              {creator.bio && (
                                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                  {creator.bio}
                                </p>
                              )}

                              {/* Stats */}
                              <div className="flex items-center gap-4 mt-3">
                                <div className="flex items-center gap-1 text-sm">
                                  <Package className="w-4 h-4 text-gray-500" />
                                  <span className="font-medium">{creator.artworks_count || 0}</span>
                                  <span className="text-gray-600">artworks</span>
                                </div>
                              </div>

                              {/* View Profile Button */}
                              <Link href={`/creators/${creator.id}`}>
                                <Button variant="outline" className="w-full mt-4">
                                  View Profile
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-12 text-center">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No creators found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Try adjusting your filters or search query
                    </p>
                    <Link href="/search?type=creators">
                      <Button variant="outline">Clear Filters</Button>
                    </Link>
                  </Card>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
