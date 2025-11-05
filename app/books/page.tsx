import { createServerClient } from '@/lib/supabase'
import { BooksPageClient } from './books-page-client'

export default async function BooksPage() {
  // Fetch real books from the database
  const supabase = await createServerClient()
  
  const { data: artworks } = await supabase
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
    .eq('category', 'Books')
    .order('created_at', { ascending: false })
    .limit(50)

  // Transform the data to match the expected format
  const transformedBooks = (artworks || []).map((art) => {
    const profile = Array.isArray(art.user_profiles) ? art.user_profiles[0] : art.user_profiles
    
    return {
      id: art.id,
      title: art.title || 'Untitled',
      author: profile?.full_name || profile?.username || 'Unknown Author',
      price: art.price || 0,
      originalPrice: undefined,
      image: art.thumbnail_url || '/image/placeholder.svg',
      genre: art.medium || 'Fiction',
      format: 'Paperback',
      pages: 300,
      language: 'English',
      publishYear: new Date().getFullYear(),
      rating: 4.5,
      reviews: 0,
      isLiked: false,
      inStock: true,
      description: art.description || 'No description available',
      tags: ['books', art.medium?.toLowerCase() || 'fiction']
    }
  })

  return <BooksPageClient initialBooks={transformedBooks} />
}
