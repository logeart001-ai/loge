import { createServerClient } from '@/lib/supabase'
import { FashionPageClient } from './fashion-page-client'

export default async function FashionPage() {
  // Fetch real fashion items from the database
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
    .eq('category', 'Fashion')
    .order('created_at', { ascending: false })
    .limit(50)

  // Transform the data to match the expected format
  const transformedItems = (artworks || []).map((art) => {
    const profile = Array.isArray(art.user_profiles) ? art.user_profiles[0] : art.user_profiles
    
    return {
      id: art.id,
      title: art.title || 'Untitled',
      designer: profile?.full_name || profile?.username || 'Unknown Designer',
      price: art.price || 0,
      originalPrice: undefined,
      image: art.thumbnail_url || '/image/placeholder.svg',
      category: 'Fashion',
      sizes: ['S', 'M', 'L', 'XL'], // Default sizes since we don't have this in DB yet
      colors: ['Various'], // Default colors
      rating: 4.5,
      reviews: 0,
      isLiked: false,
      inStock: true,
      fastShipping: false,
      tags: ['fashion', art.medium?.toLowerCase() || 'clothing']
    }
  })

  // If no fashion items found, provide sample data for demonstration
  const finalItems = transformedItems.length > 0 ? transformedItems : [
    {
      id: 'sample-1',
      title: 'Kente Dreams Dress',
      designer: 'Accra Fashion House',
      price: 85000,
      image: '/image/AmaraDiallo.jpg',
      category: 'Fashion',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Gold', 'Black', 'Red'],
      rating: 4.8,
      reviews: 18,
      isLiked: true,
      inStock: true,
      fastShipping: false,
      tags: ['kente', 'dress', 'formal', 'traditional']
    },
    {
      id: 'sample-2',
      title: 'Dashiki Shirt',
      designer: 'Lagos Style Co.',
      price: 28000,
      image: '/image/placeholder.svg',
      category: 'Fashion',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['White', 'Black', 'Blue', 'Red'],
      rating: 4.6,
      reviews: 45,
      isLiked: false,
      inStock: true,
      fastShipping: true,
      tags: ['dashiki', 'shirt', 'casual', 'embroidered']
    },
    {
      id: 'sample-3',
      title: 'Adire Maxi Skirt',
      designer: 'Ibadan Textiles',
      price: 35000,
      image: '/image/placeholder.svg',
      category: 'Fashion',
      sizes: ['XS', 'S', 'M', 'L'],
      colors: ['Indigo', 'White', 'Navy'],
      rating: 4.7,
      reviews: 28,
      isLiked: false,
      inStock: false,
      fastShipping: false,
      tags: ['adire', 'maxi', 'skirt', 'indigo']
    }
  ]

  return <FashionPageClient initialItems={finalItems} />
}
