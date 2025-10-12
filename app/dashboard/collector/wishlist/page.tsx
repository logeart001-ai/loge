import { requireAuth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Heart, ArrowLeft, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { OptimizedImage } from '@/components/optimized-image'

async function getWishlistItems(userId: string) {
  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from('wishlists')
      .select(`
        id,
        created_at,
        artworks (
          id,
          title,
          price,
          currency,
          image_urls,
          thumbnail_url,
          is_available,
          user_profiles (
            full_name
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching wishlist:', error)
      return []
    }
    
    return data || []
  } catch (err) {
    console.error('Exception in getWishlistItems:', err)
    return []
  }
}

export default async function WishlistPage() {
  const user = await requireAuth()
  const wishlistItems = await getWishlistItems(user.id)

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
            <h1 className="text-xl font-semibold">My Wishlist</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {wishlistItems.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Your wishlist is empty</h3>
              <p className="text-gray-600 mb-6">
                Start exploring artworks and add your favorites to your wishlist.
              </p>
              <Link href="/art">
                <Button className="bg-orange-500 hover:bg-orange-600">
                  Explore Artworks
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((item: any) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <div className="aspect-square bg-gray-200">
                    <OptimizedImage
                      src={item.artworks?.thumbnail_url || item.artworks?.image_urls?.[0] || '/placeholder.svg'}
                      alt={item.artworks?.title || 'Artwork'}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute top-2 right-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-white/80 hover:bg-white"
                    >
                      <Heart className="w-4 h-4 text-red-500 fill-current" />
                    </Button>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                    {item.artworks?.title}
                  </h3>
                  <p className="text-xs text-gray-600 mb-2">
                    by {item.artworks?.user_profiles?.full_name || 'Unknown Artist'}
                  </p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-sm">
                      {item.artworks?.currency} {item.artworks?.price?.toLocaleString()}
                    </span>
                    <Badge variant={item.artworks?.is_available ? 'default' : 'secondary'}>
                      {item.artworks?.is_available ? 'Available' : 'Sold'}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link href={`/art/${item.artworks?.id}`} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full">
                        View Details
                      </Button>
                    </Link>
                    {item.artworks?.is_available && (
                      <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                        <ShoppingCart className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}