'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'

interface WishlistButtonProps {
  artworkId: string
  artworkTitle: string
  className?: string
  showText?: boolean
}

export function WishlistButton({ 
  artworkId, 
  artworkTitle, 
  className, 
  showText = true 
}: WishlistButtonProps) {
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Check if artwork is in user's wishlist
  useEffect(() => {
    checkWishlistStatus()
  }, [artworkId])

  const checkWishlistStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('wishlists')
        .select('id')
        .eq('user_id', user.id)
        .eq('artwork_id', artworkId)
        .single()

      if (!error && data) {
        setIsInWishlist(true)
      }
    } catch (error) {
      console.error('Error checking wishlist status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      alert('You must be logged in to add items to your wishlist')
      return
    }

    setIsUpdating(true)

    try {
      if (isInWishlist) {
        // Remove from wishlist
        const { error } = await supabase
          .from('wishlists')
          .delete()
          .eq('user_id', user.id)
          .eq('artwork_id', artworkId)

        if (error) {
          console.error('Error removing from wishlist:', error)
          alert('Failed to remove from wishlist. Please try again.')
          return
        }

        setIsInWishlist(false)
      } else {
        // Add to wishlist
        const { error } = await supabase
          .from('wishlists')
          .insert({
            user_id: user.id,
            artwork_id: artworkId
          })

        if (error) {
          console.error('Error adding to wishlist:', error)
          alert('Failed to add to wishlist. Please try again.')
          return
        }

        setIsInWishlist(true)
      }

      router.refresh()
    } catch (error) {
      console.error('Error updating wishlist:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled className={className}>
        <Heart className="w-4 h-4" />
        {showText && <span className="ml-1">...</span>}
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleWishlist}
      disabled={isUpdating}
      className={`${className} ${
        isInWishlist 
          ? 'text-red-500 hover:text-red-600' 
          : 'text-gray-500 hover:text-red-500'
      }`}
    >
      <Heart 
        className={`w-4 h-4 ${isInWishlist ? 'fill-current' : ''}`} 
      />
      {showText && (
        <span className="ml-1">
          {isUpdating 
            ? (isInWishlist ? 'Removing...' : 'Adding...') 
            : (isInWishlist ? 'In Wishlist' : 'Add to Wishlist')
          }
        </span>
      )}
    </Button>
  )
}