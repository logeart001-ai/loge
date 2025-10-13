'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'

interface UseWishlistProps {
  artworkId?: string
}

export function useWishlist({ artworkId }: UseWishlistProps = {}) {
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [wishlistCount, setWishlistCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    if (artworkId) {
      checkWishlistStatus()
    } else {
      getWishlistCount()
    }
  }, [artworkId])

  const checkWishlistStatus = async () => {
    if (!artworkId) return

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

  const getWishlistCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setIsLoading(false)
        return
      }

      const { count } = await supabase
        .from('wishlists')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      setWishlistCount(count || 0)
    } catch (error) {
      console.error('Error getting wishlist count:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleWishlist = async () => {
    if (!artworkId) {
      throw new Error('Artwork ID is required')
    }

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('You must be logged in to manage your wishlist')
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

        if (error) throw error

        setIsInWishlist(false)
        setWishlistCount(prev => Math.max(0, prev - 1))
      } else {
        // Add to wishlist
        const { error } = await supabase
          .from('wishlists')
          .insert({
            user_id: user.id,
            artwork_id: artworkId
          })

        if (error) throw error

        setIsInWishlist(true)
        setWishlistCount(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error)
      throw error
    } finally {
      setIsUpdating(false)
    }
  }

  const addToWishlist = async (targetArtworkId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('You must be logged in to add items to your wishlist')
    }

    const { error } = await supabase
      .from('wishlists')
      .insert({
        user_id: user.id,
        artwork_id: targetArtworkId
      })

    if (error) throw error

    setWishlistCount(prev => prev + 1)
  }

  const removeFromWishlist = async (targetArtworkId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('You must be logged in to manage your wishlist')
    }

    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', user.id)
      .eq('artwork_id', targetArtworkId)

    if (error) throw error

    setWishlistCount(prev => Math.max(0, prev - 1))
  }

  return {
    isInWishlist,
    isLoading,
    isUpdating,
    wishlistCount,
    toggleWishlist,
    addToWishlist,
    removeFromWishlist,
    refresh: artworkId ? checkWishlistStatus : getWishlistCount
  }
}