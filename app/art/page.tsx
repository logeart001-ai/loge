import { createServerClient } from '@/lib/supabase'
import { ArtPageClient } from './art-page-client'

// Force dynamic rendering to always show fresh data
export const dynamic = 'force-dynamic'

export default async function ArtPage() {
  // Fetch real artworks from the database
  const supabase = await createServerClient()
  
  // Only fetch approved and available artworks
  let { data: artworks, error } = await supabase
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
      approval_status
    `)
    .eq('is_available', true)
    .eq('approval_status', 'approved')
    .order('created_at', { ascending: false })
    .limit(50)

  // Get creator information separately to avoid relationship issues
  let artworksWithCreators = artworks || []
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

  // Transform the data to match the expected format
  const transformedArtworks = artworksWithCreators.map((art: any) => ({
    id: art.id,
    title: art.title || 'Untitled',
    artist: art.creator?.full_name || art.creator?.username || 'Unknown Artist',
    price: art.price || 0,
    image: art.thumbnail_url || '/image/placeholder.svg',
    category: art.category || 'Uncategorized',
    medium: 'Mixed Media',
    size: 'Various',
    rating: 4.5,
    reviews: Math.floor(Math.random() * 50) + 10,
    isLiked: false,
    tags: [art.category?.toLowerCase() || 'art']
  }))

  // If no artworks found, provide sample data matching original design
  const finalArtworks = transformedArtworks.length > 0 ? transformedArtworks : [
    {
      id: 'sample-1',
      title: 'Sunset Over Lagos',
      artist: 'Adunni Olorunnisola',
      price: 75000,
      image: '/image/Sunset Over Lagos.png',
      category: 'Painting',
      medium: 'Oil on Canvas',
      size: '80x60 cm',
      rating: 4.6,
      reviews: 24,
      isLiked: false,
      tags: ['painting', 'sunset', 'lagos']
    },
    {
      id: 'sample-2',
      title: 'Mother Earth',
      artist: 'Kwame Asante',
      price: 120000,
      image: '/image/Mother Earth.jpg',
      category: 'Sculpture',
      medium: 'Bronze',
      size: '45x30x24 cm',
      rating: 4.9,
      reviews: 18,
      isLiked: false,
      tags: ['sculpture', 'bronze', 'earth']
    },
    {
      id: 'sample-3',
      title: 'Urban Dreams',
      artist: 'Zara Mbemba',
      price: 45000,
      image: '/image/Urban Dreams.png',
      category: 'Digital Art',
      medium: 'Digital Print',
      size: '50x70 cm',
      rating: 4.7,
      reviews: 31,
      isLiked: false,
      tags: ['digital', 'urban', 'dreams']
    },
    {
      id: 'sample-4',
      title: 'Ancestral Wisdom',
      artist: 'Chinua Okoro',
      price: 95000,
      image: '/image/AncestralEchoes.jpg',
      category: 'Mixed Media',
      medium: 'Mixed Media on Wood',
      size: '80x40 cm',
      rating: 4.6,
      reviews: 15,
      isLiked: false,
      tags: ['mixed-media', 'ancestral', 'wisdom']
    },
    {
      id: 'sample-5',
      title: 'Rhythms of the Sahel',
      artist: 'Fatima Al-Zahra',
      price: 85000,
      image: '/image/placeholder.svg',
      category: 'Painting',
      medium: 'Acrylic on Canvas',
      size: '70x50 cm',
      rating: 4.8,
      reviews: 22,
      isLiked: false,
      tags: ['painting', 'sahel', 'rhythms']
    },
    {
      id: 'sample-6',
      title: 'Golden Threads',
      artist: 'Amara Diallo',
      price: 180000,
      image: '/image/placeholder.svg',
      category: 'Textile Art',
      medium: 'Gold Thread on Silk',
      size: '100x80 cm',
      rating: 4.9,
      reviews: 19,
      isLiked: false,
      tags: ['textile', 'gold', 'threads']
    }
  ]

  return <ArtPageClient initialArtworks={finalArtworks} />
}