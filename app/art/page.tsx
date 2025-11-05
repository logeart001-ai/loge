import { createServerClient } from '@/lib/supabase'
import { ArtPageClient } from './art-page-client'

interface BasicArtworkData {
  id: string
  title: string | null
  price: number | null
  thumbnail_url: string | null
  description: string | null
  is_available: boolean
  category: string | null
  creator_id: string | null
  created_at: string
  medium?: string | null
  dimensions?: string | null
  views_count?: number | null
}

interface ArtworkWithCreator extends BasicArtworkData {
  creator?: {
    id: string
    full_name: string | null
    username: string | null
  } | null
}

export default async function ArtPage() {
  // Fetch real artworks from the database
  const supabase = await createServerClient()
  
  // Try enhanced query first, fall back to basic if columns don't exist
  let artworks: BasicArtworkData[] | null = null
  let error: { message?: string } | null = null

  const enhancedQuery = await supabase
    .from('artworks')
    .select(`
      id,
      title,
      price,
      thumbnail_url,
      description,
      is_available,
      category,
      creator_id,
      created_at,
      medium,
      dimensions,
      views_count
    `)
    .eq('is_available', true)
    .order('created_at', { ascending: false })
    .limit(50)

  artworks = enhancedQuery.data as BasicArtworkData[] | null
  error = enhancedQuery.error

  // If enhanced query fails due to missing columns, try basic query
  if (error && error.message?.includes('does not exist')) {
    console.log('Enhanced query failed, trying basic query:', error.message)
    const basicQuery = await supabase
      .from('artworks')
      .select(`
        id,
        title,
        price,
        thumbnail_url,
        description,
        is_available,
        category,
        creator_id,
        created_at
      `)
      .eq('is_available', true)
      .order('created_at', { ascending: false })
      .limit(50)
    
    artworks = (basicQuery.data as BasicArtworkData[] | null)?.map(art => ({
      ...art,
      medium: null,
      dimensions: null,
      views_count: null
    })) || null
    error = basicQuery.error
  }

  // Get creator information separately to avoid relationship issues
  let artworksWithCreators: ArtworkWithCreator[] = artworks || []
  if (artworks && artworks.length > 0) {
    const creatorIds = [...new Set(artworks.map(art => art.creator_id).filter(Boolean))]
    
    if (creatorIds.length > 0) {
      const { data: creators } = await supabase
        .from('user_profiles')
        .select('id, full_name, username')
        .in('id', creatorIds)
      
      artworksWithCreators = artworks.map(art => ({
        ...art,
        creator: creators?.find(c => c.id === art.creator_id) || null
      }))
    }
  }

  // Debug logging
  console.log('Artworks query result:', { 
    artworksCount: artworks?.length || 0, 
    error: error?.message,
    sampleArtwork: artworks?.[0] 
  })

  // Transform the data to match the expected format
  const transformedArtworks = artworksWithCreators.map((art: ArtworkWithCreator) => {
    return {
      id: art.id,
      title: art.title || 'Untitled',
      artist: art.creator?.full_name || art.creator?.username || 'Unknown Artist',
      price: art.price || 0,
      image: art.thumbnail_url || '/image/placeholder.svg',
      category: art.category || 'Uncategorized',
      medium: art.medium || 'Mixed Media',
      size: art.dimensions || 'Various',
      rating: 4.5, // Default rating since we don't have reviews yet
      reviews: art.views_count || 0,
      isLiked: false,
      tags: [art.category?.toLowerCase() || 'art', art.medium?.toLowerCase() || 'mixed']
    }
  })

  // If no artworks found, provide sample data for demonstration
  const finalArtworks = transformedArtworks.length > 0 ? transformedArtworks : [
    {
      id: 'sample-1',
      title: 'Heritage Tapestry',
      artist: 'Adunni Olorunnisola',
      price: 150000,
      image: '/image/AdunniOlorunnisola.jpg',
      category: 'Art Design',
      medium: 'Mixed Media',
      size: '60cm x 80cm',
      rating: 4.8,
      reviews: 12,
      isLiked: false,
      tags: ['art_design', 'heritage', 'contemporary']
    },
    {
      id: 'sample-2',
      title: 'Resilience Sculpture',
      artist: 'Kwame Asante',
      price: 200000,
      image: '/image/KwameAsante.jpg',
      category: 'Sculpture',
      medium: 'Bronze',
      size: '40cm x 30cm x 50cm',
      rating: 4.6,
      reviews: 8,
      isLiked: false,
      tags: ['sculpture', 'bronze', 'strength']
    },
    {
      id: 'sample-3',
      title: 'Modern Kente Collection',
      artist: 'Amara Diallo',
      price: 75000,
      image: '/image/AmaraDiallo.jpg',
      category: 'Fashion',
      medium: 'Textile',
      size: 'Size M',
      rating: 4.7,
      reviews: 15,
      isLiked: false,
      tags: ['fashion', 'kente', 'modern']
    }
  ]

  console.log('Final artworks for display:', finalArtworks.length)

  return <ArtPageClient initialArtworks={finalArtworks} />
}
