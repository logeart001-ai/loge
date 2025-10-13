'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { OptimizedImage } from '@/components/optimized-image'
import { FollowButton } from '@/components/follow-button'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Users } from 'lucide-react'

interface FollowerData {
  id: string
  created_at: string
  follower: {
    id: string
    full_name: string
    username: string
    avatar_url?: string
    bio?: string
  }
}

interface FollowingData {
  id: string
  created_at: string
  following: {
    id: string
    full_name: string
    username: string
    avatar_url?: string
    bio?: string
  }
}

interface FollowersListProps {
  userId: string
  type: 'followers' | 'following'
  className?: string
}

export function FollowersList({ userId, type, className }: FollowersListProps) {
  const [users, setUsers] = useState<(FollowerData | FollowingData)[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchUsers()
  }, [userId, type])

  const fetchUsers = async () => {
    try {
      if (type === 'followers') {
        const { data, error: fetchError } = await supabase
          .from('follows')
          .select(`
            id,
            created_at,
            follower:user_profiles!follows_follower_id_fkey (
              id,
              full_name,
              username,
              avatar_url,
              bio
            )
          `)
          .eq('following_id', userId)
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError
        setUsers(data || [])
      } else {
        const { data, error: fetchError } = await supabase
          .from('follows')
          .select(`
            id,
            created_at,
            following:user_profiles!follows_following_id_fkey (
              id,
              full_name,
              username,
              avatar_url,
              bio
            )
          `)
          .eq('follower_id', userId)
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError
        setUsers(data || [])
      }
    } catch (error) {
      console.error(`Error fetching ${type}:`, error)
      setError(`Failed to load ${type}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
              <div className="w-20 h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">{error}</p>
        <Button onClick={fetchUsers}>Try Again</Button>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No {type} yet
        </h3>
        <p className="text-gray-500">
          {type === 'followers' 
            ? 'No one is following this user yet' 
            : 'This user is not following anyone yet'
          }
        </p>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {users.map((item) => {
        const user = type === 'followers' 
          ? (item as FollowerData).follower 
          : (item as FollowingData).following

        return (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center space-x-4">
              <Link href={`/creator/${user.username}`}>
                <div className="w-12 h-12 relative rounded-full overflow-hidden bg-gray-200">
                  {user.avatar_url ? (
                    <OptimizedImage
                      src={user.avatar_url}
                      alt={user.full_name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 font-semibold">
                      {user.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </Link>

              <div className="flex-1 min-w-0">
                <Link href={`/creator/${user.username}`}>
                  <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors truncate">
                    {user.full_name}
                  </h3>
                  <p className="text-sm text-gray-600 truncate">
                    @{user.username}
                  </p>
                </Link>
                {user.bio && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {user.bio}
                  </p>
                )}
              </div>

              <div className="flex-shrink-0">
                <FollowButton
                  creatorId={user.id}
                  creatorName={user.full_name}
                  className="min-w-[100px]"
                />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}