'use client'

import { useState, useEffect, useCallback } from 'react'
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

type FollowerItem = {
  id: string
  created_at: string
  follower:
    | {
        id: string
        full_name: string
        username: string
        avatar_url?: string
        bio?: string
      }
    | {
        id: string
        full_name: string
        username: string
        avatar_url?: string
        bio?: string
      }[]
}

type FollowingItem = {
  id: string
  created_at: string
  following:
    | {
        id: string
        full_name: string
        username: string
        avatar_url?: string
        bio?: string
      }
    | {
        id: string
        full_name: string
        username: string
        avatar_url?: string
        bio?: string
      }[]
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

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
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

        if (data) {
          const mappedData = data
            .map((item: FollowerItem) => {
              const follower = Array.isArray(item.follower)
                ? item.follower[0]
                : item.follower
              return {
                ...item,
                follower,
              }
            })
            .filter(item => item.follower)
          setUsers(mappedData as FollowerData[])
        } else {
          setUsers([])
        }
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

        if (data) {
          const mappedData = data
            .map((item: FollowingItem) => {
              const following = Array.isArray(item.following)
                ? item.following[0]
                : item.following
              return {
                ...item,
                following,
              }
            })
            .filter(item => item.following)
          setUsers(mappedData as FollowingData[])
        } else {
          setUsers([])
        }
      }
    } catch (error) {
      console.error(`Error fetching ${type}:`, error)
      setError(`Failed to load ${type}`)
    } finally {
      setIsLoading(false)
    }
  }, [userId, type, supabase])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

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

        if (!user) return null

        return (
          <Card key={item.id}>
            <CardContent className="p-4 flex items-center space-x-4">
              <Link href={`/creator/${user.username}`}>
                <OptimizedImage
                  src={user.avatar_url || '/img/avatar-placeholder.png'}
                  alt={user.full_name}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover"
                />
              </Link>
              <div className="flex-1">
                <Link href={`/creator/${user.username}`}>
                  <h4 className="font-semibold text-gray-900 hover:underline">
                    {user.full_name}
                  </h4>
                </Link>
                <p className="text-sm text-gray-500 truncate">
                  {user.bio || `@${user.username}`}
                </p>
              </div>
              <div className="shrink-0">
                <FollowButton
                  creatorId={user.id}
                  creatorName={user.full_name || user.username}
                />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}