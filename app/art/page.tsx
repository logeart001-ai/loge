import { createServerClient } from '@/lib/supabase'
import { ArtPageClient } from './art-page-client'

interface ArtworkData {
  id: string
  title: string | null
  price: number | null
  thumbnail_url: string | null
  description: string | null
  medium: string | null
  dimensions: string | null
  is_available: boolean
  category: string | null
  user_profiles: {
    full_name: string | null
    username: string | null
  } | null
}

export default async function ArtPage() {
  // Fetch real artworks from the database
  const supabase = await createServerClient()
  
  const { data: artworks, error } = await supabase
    .from('artworks')
    .select(`
      id,
      title,
      price,
      thumbnail_url,
      description,
      medium,
      dimensions,
      is_available,
      category,
      user_profiles!creator_id (
        full_name,
        username
      )
    `)
    .eq('is_available', true)
    .order('created_at', { ascending: false })
    .limit(50)

  // Debug logging
  console.log('Artworks query result:', { 
    artworksCount: artworks?.length || 0, 
    error: error?.message,
    sampleArtwork: artworks?.[0] 
  })

  // Transform the data to match the expected format
  const transformedArtworks = (artworks || []).map((art) => {
    // Handle both single object and array responses from Supabase
    const profile = Array.isArray(art.user_profiles) ? art.user_profiles[0] : art.user_profiles
    
    return {
      id: art.id,
      title: art.title || 'Untitled',
      artist: profile?.full_name || profile?.username || 'Unknown Artist',
      price: art.price || 0,
      image: art.thumbnail_url || '/image/placeholder.svg',
      category: art.category || 'Uncategorized',
      medium: art.medium || 'Mixed Media',
      size: art.dimensions || 'Various',
      rating: 4.5, // Default rating since we don't have reviews yet
      reviews: 0,
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
      category: 'Painting',
      medium: 'Acrylic on Canvas',
      size: '60cm x 80cm',
      rating: 4.8,
      reviews: 12,
      isLiked: false,
      tags: ['painting', 'heritage', 'contemporary']
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
