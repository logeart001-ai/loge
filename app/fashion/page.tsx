import { createServerClient } from '@/lib/supabase'
import { FashionPageClient } from './fashion-page-client'

export default async function FashionPage() {
  // Fetch real fashion items from the database
  const supabase = await createServerClient()
  
  const { data: artworks, error } = await supabase
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
    .eq('category', 'fashion')
    .order('created_at', { ascending: false })
    .limit(50)

  // Get creator information separately
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
  const transformedItems = artworksWithCreators.map((art: any) => ({
    id: art.id,
    title: art.title || 'Untitled',
    designer: art.creator?.full_name || art.creator?.username || 'Unknown Designer',
    price: art.price || 0,
    image: art.thumbnail_url || '/image/placeholder.svg',
    category: 'Fashion',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Various'],
    rating: 4.5,
    reviews: Math.floor(Math.random() * 50) + 10,
    isLiked: false,
    inStock: true,
    fastShipping: Math.random() > 0.5,
    tags: ['fashion', 'african']
  }))

  // If no fashion items found, provide sample data matching original design
  const finalItems = transformedItems.length > 0 ? transformedItems : [
    {
      id: 'sample-1',
      title: 'Ankara Print Dress',
      designer: 'Mimi Fashion House',
      price: 45000,
      image: '/image/placeholder.svg',
      category: 'Dresses',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Red', 'Blue', 'Green'],
      rating: 4.6,
      reviews: 32,
      isLiked: false,
      inStock: true,
      fastShipping: true,
      tags: ['ankara', 'dress', 'traditional']
    },
    {
      id: 'sample-2',
      title: 'Kente Blazer',
      designer: 'Accra Couture',
      price: 72000,
      image: '/image/placeholder.svg',
      category: 'Blazers',
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: ['Gold', 'Black', 'Red'],
      rating: 4.5,
      reviews: 18,
      isLiked: false,
      inStock: true,
      fastShipping: false,
      tags: ['kente', 'blazer', 'formal', 'traditional']
    },
    {
      id: 'sample-3',
      title: 'Dashiki Shirt',
      designer: 'Lagos Style Co.',
      price: 28000,
      image: '/image/placeholder.svg',
      category: 'Shirts',
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
      id: 'sample-4',
      title: 'Adire Maxi Skirt',
      designer: 'Ibadan Textiles',
      price: 35000,
      image: '/image/placeholder.svg',
      category: 'Skirts',
      sizes: ['XS', 'S', 'M', 'L'],
      colors: ['Indigo', 'White', 'Navy'],
      rating: 4.7,
      reviews: 28,
      isLiked: false,
      inStock: false,
      fastShipping: false,
      tags: ['adire', 'maxi', 'skirt', 'indigo']
    },
    {
      id: 'sample-5',
      title: 'Bogolan Jacket',
      designer: 'Mali Heritage',
      price: 85000,
      image: '/image/placeholder.svg',
      category: 'Jackets',
      sizes: ['M', 'L', 'XL'],
      colors: ['Brown', 'Beige', 'Black'],
      rating: 4.8,
      reviews: 15,
      isLiked: true,
      inStock: true,
      fastShipping: false,
      tags: ['bogolan', 'jacket', 'mudcloth', 'traditional']
    },
    {
      id: 'sample-6',
      title: 'Wax Print Jumpsuit',
      designer: 'Dakar Designs',
      price: 58000,
      image: '/image/placeholder.svg',
      category: 'Jumpsuits',
      sizes: ['S', 'M', 'L'],
      colors: ['Yellow', 'Orange', 'Green'],
      rating: 4.5,
      reviews: 22,
      isLiked: false,
      inStock: true,
      fastShipping: true,
      tags: ['wax-print', 'jumpsuit', 'contemporary', 'bold']
    }
  ]

  return <FashionPageClient initialItems={finalItems} />
}