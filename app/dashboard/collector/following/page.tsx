import { requireAuth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, ArrowLeft, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { OptimizedImage } from '@/components/optimized-image'
import { UnfollowButton } from '@/components/unfollow-button'

interface FollowingData {
  id: string
  created_at: string
  following: {
    id: string
    full_name: string
    avatar_url?: string | null
    bio?: string | null
    discipline?: string | null
    location?: string | null
    is_verified?: boolean
    artworks?: { count: number }[]
  } | null
}

async function getFollowingList(userId: string) {
  try {
    const supabase = await createServerClient()
    
    // Try follows table first (preferred)
    const { data, error } = await supabase
      .from('follows')
      .select(`
        id,
        created_at,
        following_id,
        following:user_profiles!follows_following_id_fkey (
          id,
          full_name,
          avatar_url,
          bio,
          discipline,
          location,
          is_verified
        )
      `)
      .eq('follower_id', userId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      return data as unknown as FollowingData[]
    }

    // Fallback to following table
    const { data: dataFallback, error: errorFallback } = await supabase
      .from('following')
      .select(`
        id,
        created_at,
        following_id,
        following:user_profiles!following_following_id_fkey (
          id,
          full_name,
          avatar_url,
          bio,
          discipline,
          location,
          is_verified
        )
      `)
      .eq('follower_id', userId)
      .order('created_at', { ascending: false })

    if (errorFallback) {
      console.error('Error fetching following list:', errorFallback)
      return []
    }
    
    return (dataFallback as unknown as FollowingData[]) || []
  } catch (err) {
    console.error('Exception in getFollowingList:', err)
    return []
  }
}

export default async function FollowingPage() {
  const user = await requireAuth()
  const followingList = await getFollowingList(user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/collector">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold">Following</h1>
              <p className="text-sm text-gray-500">{followingList.length} creators</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {followingList.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">You are not following anyone yet</h3>
              <p className="text-gray-600 mb-6">
                Discover amazing creators and follow them to stay updated with their latest works.
              </p>
              <Link href="/art">
                <Button className="bg-orange-500 hover:bg-orange-600">
                  Discover Creators
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {followingList.map((follow) => {
              if (!follow.following) return null
              
              return (
                <Card key={follow.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    {/* Creator Profile Header */}
                    <div className="flex items-start space-x-4 mb-4">
                      <div className="relative flex-shrink-0">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-yellow-400">
                          {follow.following.avatar_url ? (
                            <OptimizedImage
                              src={follow.following.avatar_url}
                              alt={follow.following.full_name}
                              width={64}
                              height={64}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white text-xl font-bold">
                              {follow.following.full_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        {follow.following.is_verified && (
                          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                            <svg className="w-4 h-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1 truncate">
                          {follow.following.full_name}
                        </h3>
                        
                        {follow.following.discipline && (
                          <Badge variant="secondary" className="text-orange-600 bg-orange-50 border-orange-200">
                            {follow.following.discipline}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Location */}
                    {follow.following.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{follow.following.location}</span>
                      </div>
                    )}
                    
                    {/* Bio */}
                    {follow.following.bio && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {follow.following.bio}
                      </p>
                    )}
                    
                    {/* Following Since */}
                    <div className="text-xs text-gray-500 mb-4 pb-4 border-b">
                      Following since {new Date(follow.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Link href={`/creator/${follow.following.id}`} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full">
                          View Profile
                        </Button>
                      </Link>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="px-3"
                        title="Message Creator"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                      <UnfollowButton 
                        creatorId={follow.following.id} 
                        creatorName={follow.following.full_name}
                      />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
