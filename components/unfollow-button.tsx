'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { UserMinus } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'

interface UnfollowButtonProps {
  creatorId: string
  creatorName: string
}

export function UnfollowButton({ creatorId, creatorName }: UnfollowButtonProps) {
  const [isUnfollowing, setIsUnfollowing] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleUnfollow = async (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation to creator page
    e.stopPropagation()

    if (!confirm(`Unfollow ${creatorName}?`)) {
      return
    }

    setIsUnfollowing(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert('You must be logged in to unfollow')
        return
      }

      // Try deleting from 'follows' table first
      const { error: errorPlural } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', creatorId)

      if (errorPlural) {
        // Fallback to 'following' table
        const { error: errorSingular } = await supabase
          .from('following')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', creatorId)

        if (errorSingular) {
          console.error('Error unfollowing:', errorSingular)
          alert('Failed to unfollow. Please try again.')
          return
        }
      }

      // Refresh the page to update the list
      router.refresh()
    } catch (error) {
      console.error('Error unfollowing:', error)
      alert('Failed to unfollow. Please try again.')
    } finally {
      setIsUnfollowing(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleUnfollow}
      disabled={isUnfollowing}
      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
    >
      <UserMinus className="w-4 h-4 mr-1" />
      {isUnfollowing ? 'Unfollowing...' : 'Unfollow'}
    </Button>
  )
}
