'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'

interface UseFollowProps {
  creatorId: string
}

interface FollowStats {
  followersCount: number
  followingCount: number
  isFollowing: boolean
}

export function useFollow({ creatorId }: UseFollowProps) {
  const [stats, setStats] = useState<FollowStats>({
    followersCount: 0,
    followingCount: 0,
    isFollowing: false
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchFollowStats()
  }, [creatorId])

  const fetchFollowStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Get followers count
      const { count: followersCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', creatorId)

      // Get following count
      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', creatorId)

      // Check if current user is following this creator
      let isFollowing = false
      if (user && user.id !== creatorId) {
        const { data } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', creatorId)
          .single()

        isFollowing = !!data
      }

      setStats({
        followersCount: followersCount || 0,
        followingCount: followingCount || 0,
        isFollowing
      })
    } catch (error) {
      console.error('Error fetching follow stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleFollow = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('You must be logged in to follow creators')
    }

    if (user.id === creatorId) {
      throw new Error('You cannot follow yourself')
    }

    setIsUpdating(true)

    try {
      if (stats.isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', creatorId)

        if (error) throw error

        setStats(prev => ({
          ...prev,
          followersCount: prev.followersCount - 1,
          isFollowing: false
        }))
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: creatorId
          })

        if (error) throw error

        setStats(prev => ({
          ...prev,
          followersCount: prev.followersCount + 1,
          isFollowing: true
        }))

        // Create notification for the creator
        await supabase
          .from('notifications')
          .insert({
            user_id: creatorId,
            type: 'follow',
            title: 'New Follower',
            message: `${user.user_metadata?.full_name || 'Someone'} started following you`,
            data: {
              follower_id: user.id,
              follower_name: user.user_metadata?.full_name
            }
          })
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
      throw error
    } finally {
      setIsUpdating(false)
    }
  }

  return {
    ...stats,
    isLoading,
    isUpdating,
    toggleFollow,
    refresh: fetchFollowStats
  }
}