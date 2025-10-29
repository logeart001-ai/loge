'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { OptimizedImage } from '@/components/optimized-image'
import { WishlistButton } from '@/components/wishlist-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { Heart, ShoppingCart } from 'lucide-react'

interface WishlistItem {
  id: string
  created_at: string
  artwork: {
    id: string
    title: string
    description: string
    price: number
    image_url: string
    creator: {
      id: string
      full_name: string
      username: string
    }
  }
}

function normalizeWishlistItem(item: unknown): WishlistItem | null {
  if (!item || typeof item !== 'object') {
    return null
  }

  const { id, created_at, artwork } = item as Record<string, unknown>

  // Normalize artwork (it comes as an array from Supabase)
  const artworkData = Array.isArray(artwork) ? artwork[0] : artwork
  
  if (!artworkData || typeof artworkData !== 'object') {
    return null
  }

  const { 
    id: artworkId, 
    title, 
    description, 
    price, 
    image_url, 
    creator 
  } = artworkData as Record<string, unknown>

  // Normalize creator (it also comes as an array from Supabase)
  const creatorData = Array.isArray(creator) ? creator[0] : creator
  
  if (!creatorData || typeof creatorData !== 'object') {
    return null
  }

  const {
    id: creatorId,
    full_name,
    username
  } = creatorData as Record<string, unknown>

  return {
    id: typeof id === 'string' ? id : '',
    created_at: typeof created_at === 'string' ? created_at : '',
    artwork: {
      id: typeof artworkId === 'string' ? artworkId : '',
      title: typeof title === 'string' ? title : '',
      description: typeof description === 'string' ? description : '',
      price: typeof price === 'number' ? price : 0,
      image_url: typeof image_url === 'string' ? image_url : '',
      creator: {
        id: typeof creatorId === 'string' ? creatorId : '',
        full_name: typeof full_name === 'string' ? full_name : '',
        username: typeof username === 'string' ? username : ''
      }
    }
  }
}

export function WishlistGrid() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchWishlist()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchWishlist = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('You must be logged in to view your wishlist')
        setIsLoading(false)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('wishlists')
        .select(`
          id,
          created_at,
          artwork:artworks (
            id,
            title,
            description,
            price,
            image_url,
            creator:user_profiles (
              id,
              full_name,
              username
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('Error fetching wishlist:', fetchError)
        setError('Failed to load wishlist')
        return
      }

      // Normalize the data to handle array responses from Supabase
      const normalizedData = (data || [])
        .map(normalizeWishlistItem)
        .filter((item): item is WishlistItem => item !== null)

      setWishlistItems(normalizedData)
    } catch (error) {
      console.error('Error fetching wishlist:', error)
      setError('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="aspect-square bg-gray-200 rounded-t-lg"></div>
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">{error}</p>
        <Button onClick={fetchWishlist}>Try Again</Button>
      </div>
    )
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Your wishlist is empty</h3>
        <p className="text-gray-500 mb-6">Start adding artworks you love to your wishlist</p>
        <Link href="/marketplace">
          <Button>Browse Artworks</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {wishlistItems.map((item) => (
        <Card key={item.id} className="group hover:shadow-lg transition-shadow">
          <Link href={`/artwork/${item.artwork.id}`}>
            <div className="aspect-square relative overflow-hidden rounded-t-lg">
              <OptimizedImage
                src={item.artwork.image_url}
                alt={item.artwork.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </Link>
          
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <Link href={`/artwork/${item.artwork.id}`}>
                <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                  {item.artwork.title}
                </h3>
              </Link>
              <WishlistButton 
                artworkId={item.artwork.id}
                artworkTitle={item.artwork.title}
                showText={false}
                className="ml-2"
              />
            </div>
            
            <Link href={`/creator/${item.artwork.creator.username}`}>
              <p className="text-sm text-gray-600 hover:text-blue-600 transition-colors mb-2">
                by {item.artwork.creator.full_name}
              </p>
            </Link>
            
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">
                ${item.artwork.price.toFixed(2)}
              </span>
              
              <Button size="sm" className="ml-2">
                <ShoppingCart className="w-4 h-4 mr-1" />
                Add to Cart
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              Added {new Date(item.created_at).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}