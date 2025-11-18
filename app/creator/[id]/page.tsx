import { notFound } from 'next/navigation'
import { OptimizedImage } from '@/components/optimized-image'
import { Navbar } from '@/components/navbar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FollowButton } from '@/components/follow-button'
import { FollowersList } from '@/components/followers-list'
import { createServerClient } from '@/lib/supabase'
import { MapPin, Calendar, Award, Users, Heart } from 'lucide-react'

interface CreatorProfile {
  id: string
  full_name: string
  username: string
  bio: string
  avatar_url: string
  location: string
  discipline: string
  is_verified: boolean
  created_at: string
  website_url?: string
  instagram_handle?: string
  twitter_handle?: string
}

interface CreatorArtwork {
  id: string
  title: string
  price: number
  image_url: string
  category: string
  is_available: boolean
}

async function getCreatorProfile(id: string): Promise<CreatorProfile | null> {
  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .eq('role', 'creator')
      .single()

    if (error || !data) return null
    return data as CreatorProfile
  } catch (error) {
    console.error('Error fetching creator profile:', error)
    return null
  }
}

async function getCreatorArtworks(creatorId: string): Promise<CreatorArtwork[]> {
  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from('artworks')
      .select('id, title, price, image_url, category, is_available')
      .eq('creator_id', creatorId)
      .eq('is_available', true)
      .order('created_at', { ascending: false })
      .limit(12)

    if (error) {
      console.error('Error fetching creator artworks:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching creator artworks:', error)
    return []
  }
}

async function getFollowStats(creatorId: string) {
  try {
    const supabase = await createServerClient()
    
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

    return {
      followersCount: followersCount || 0,
      followingCount: followingCount || 0
    }
  } catch (error) {
    console.error('Error fetching follow stats:', error)
    return { followersCount: 0, followingCount: 0 }
  }
}

export default async function CreatorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const [creator, artworks, followStats] = await Promise.all([
    getCreatorProfile(id),
    getCreatorArtworks(id),
    getFollowStats(id)
  ])

  if (!creator) return notFound()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Creator Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-200 shrink-0">
                <OptimizedImage
                  src={creator.avatar_url || '/image/Creator%20Avatars.png'}
                  alt={creator.full_name}
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              </div>

              {/* Creator Info */}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                        {creator.full_name}
                      </h1>
                      {creator.is_verified && (
                        <Badge className="bg-blue-500 text-white">
                          <Award className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2">@{creator.username}</p>
                    {creator.discipline && (
                      <Badge variant="secondary" className="mb-2">
                        {creator.discipline}
                      </Badge>
                    )}
                  </div>

                  <FollowButton 
                    creatorId={creator.id} 
                    creatorName={creator.full_name}
                    className="self-start"
                  />
                </div>

                {creator.bio && (
                  <p className="text-gray-700 mb-4 whitespace-pre-line">{creator.bio}</p>
                )}

                {/* Creator Details */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  {creator.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {creator.location}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined {new Date(creator.created_at).toLocaleDateString('en-US', { 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </div>
                </div>

                {/* Follow Stats */}
                <div className="flex gap-6 mt-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold">{followStats.followersCount}</span>
                    <span className="text-gray-600">followers</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold">{followStats.followingCount}</span>
                    <span className="text-gray-600">following</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="artworks" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="artworks">Artworks ({artworks.length})</TabsTrigger>
            <TabsTrigger value="followers">Followers ({followStats.followersCount})</TabsTrigger>
            <TabsTrigger value="following">Following ({followStats.followingCount})</TabsTrigger>
          </TabsList>

          <TabsContent value="artworks" className="mt-6">
            {artworks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {artworks.map((artwork) => (
                  <Card key={artwork.id} className="group hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      <div className="aspect-square relative overflow-hidden rounded-t-lg">
                        <OptimizedImage
                          src={artwork.image_url}
                          alt={artwork.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                          {artwork.title}
                        </h3>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-gray-900">
                            ₦{artwork.price.toLocaleString()}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {artwork.category}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Award className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No artworks yet</h3>
                <p className="text-gray-600">This creator hasn't uploaded any artworks yet.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="followers" className="mt-6">
            <FollowersList userId={creator.id} type="followers" />
          </TabsContent>

          <TabsContent value="following" className="mt-6">
            <FollowersList userId={creator.id} type="following" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}