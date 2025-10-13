'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { UserPlus, UserMinus } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'

interface FollowButtonProps {
  creatorId: string
  creatorName: string
  className?: string
}

export function FollowButton({ creatorId, creatorName, className }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Check if user is already following this creator
  useEffect(() => {
    checkFollowStatus()
  }, [creatorId])

  const checkFollowStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', creatorId)
        .single()

      if (!error && data) {
        setIsFollowing(true)
      }
    } catch (error) {
      console.error('Error checking follow status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      alert('You must be logged in to follow creators')
      return
    }

    if (user.id === creatorId) {
      alert('You cannot follow yourself')
      return
    }

    setIsUpdating(true)

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', creatorId)

        if (error) {
          console.error('Error unfollowing:', error)
          alert('Failed to unfollow. Please try again.')
          return
        }

        setIsFollowing(false)
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: creatorId
          })

        if (error) {
          console.error('Error following:', error)
          alert('Failed to follow. Please try again.')
          return
        }

        setIsFollowing(true)

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

      router.refresh()
    } catch (error) {
      console.error('Error updating follow status:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled className={className}>
        Loading...
      </Button>
    )
  }

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      onClick={handleFollow}
      disabled={isUpdating}
      className={`${className} ${
        isFollowing 
          ? 'text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200' 
          : 'bg-blue-600 hover:bg-blue-700 text-white'
      }`}
    >
      {isFollowing ? (
        <>
          <UserMinus className="w-4 h-4 mr-1" />
          {isUpdating ? 'Unfollowing...' : 'Unfollow'}
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4 mr-1" />
          {isUpdating ? 'Following...' : 'Follow'}
        </>
      )}
    </Button>
  )
}