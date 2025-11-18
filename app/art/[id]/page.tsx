import Link from 'next/link'
import { OptimizedImage } from '@/components/optimized-image'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getArtworkById } from '@/lib/supabase-queries'
import { ArtworkViewTracker } from '@/components/artwork-view-tracker'
import { WishlistButton } from '@/components/wishlist-button'
import { FollowButton } from '@/components/follow-button'
import { ArtworkAnalytics } from '@/components/artwork-analytics'

export default async function ArtworkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const artwork = await getArtworkById(id)
  if (!artwork) return notFound()

  const images: string[] = artwork.image_urls || (artwork.thumbnail_url ? [artwork.thumbnail_url] : [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Track artwork views */}
      <ArtworkViewTracker artworkId={artwork.id} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            <Card>
              <CardContent className="p-0">
                <div className="relative w-full h-80 md:h-[480px] bg-white">
                  {images.length > 0 ? (
                    <OptimizedImage
                      src={images[0]}
                      alt={artwork.title}
                      fill
                      className="object-contain"
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No image
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Details */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{artwork.title}</h1>
            <div className="flex items-center gap-2 mb-4">
              {artwork.category && (
                <Badge variant="secondary" className="capitalize">{String(artwork.category).replace('_', ' ')}</Badge>
              )}
              {artwork.is_limited_edition && (
                <Badge className="bg-brand-orange text-white">Limited Edition</Badge>
              )}
              {artwork.is_featured && (
                <Badge className="bg-yellow-500 text-white">Featured</Badge>
              )}
            </div>

            {artwork.description && (
              <p className="text-gray-700 mb-6 whitespace-pre-line">{artwork.description}</p>
            )}

            <div className="flex items-end gap-3 mb-6">
              <span className="text-2xl md:text-3xl font-bold text-gray-900">₦{artwork.price?.toLocaleString()}</span>
              {artwork.original_price && artwork.original_price > artwork.price && (
                <span className="text-gray-500 line-through">₦{artwork.original_price.toLocaleString()}</span>
              )}
            </div>

            {artwork.creator && (
              <div className="flex items-center gap-3 mb-8">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                  <OptimizedImage
                    src={artwork.creator.avatar_url || '/image/Creator%20Avatars.png'}
                    alt={artwork.creator.full_name}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{artwork.creator.full_name}</div>
                  {artwork.creator.location && (
                    <div className="text-sm text-gray-600">{artwork.creator.location}</div>
                  )}
                </div>
                <div className="ml-auto flex gap-2">
                  <FollowButton 
                    creatorId={artwork.creator.id} 
                    creatorName={artwork.creator.full_name}
                  />
                  <Link href={`/creators/${artwork.creator.id}`}>
                    <Button variant="outline" size="sm">View Artist</Button>
                  </Link>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <AddToCartButton artworkId={artwork.id} />
              <WishlistButton 
                artworkId={artwork.id} 
                artworkTitle={artwork.title}
                className="shrink-0"
              />
            </div>
          </div>
        </div>
        
        {/* Artwork Analytics Section */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Artwork Insights</h2>
          <ArtworkAnalytics artworkId={artwork.id} />
        </div>
      </div>
    </div>
  )
}

import { AddToCartButton } from '@/components/cart/add-to-cart-button'
