import { requireAuth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { OptimizedImage } from '@/components/optimized-image'
import Link from 'next/link'

interface WishlistRow {
  artwork_id: string
  created_at: string
  artworks: {
    id: string
    title: string
    price: number
    thumbnail_url?: string | null
    image_urls?: string[] | null
    category?: string | null
  }
}

async function getWishlist(userId: string) {
  const supabase = await createServerClient()
  // Try plural first
  const { data: dataPlural, error: errorPlural } = await supabase
    .from('wishlists')
    .select(`
      artwork_id,
      created_at,
      artworks:artworks (
        id,
        title,
        price,
        thumbnail_url,
        image_urls,
        category
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (!errorPlural) {
    return (dataPlural as unknown as WishlistRow[]) || []
  }

  {
    // Fallback to singular table name if present
    const { data: dataSingular, error: errorSingular } = await supabase
      .from('wishlist')
      .select(`
        artwork_id,
        created_at,
        artworks:artworks (
          id,
          title,
          price,
          thumbnail_url,
          image_urls,
          category
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (errorSingular) {
      console.error('Error fetching wishlist:', errorSingular)
      return [] as WishlistRow[]
    }
    return (dataSingular as unknown as WishlistRow[]) || []
  }
}

export default async function CollectorWishlistPage() {
  const user = await requireAuth()
  const items = await getWishlist(user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl font-semibold">Wishlist</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Saved Artworks</CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No items in your wishlist.</div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map(({ artworks }) => (
                  <div key={artworks.id} className="border rounded-lg overflow-hidden bg-white">
                    <div className="relative w-full h-40 bg-gray-100">
                      <OptimizedImage
                        src={artworks.thumbnail_url || artworks.image_urls?.[0] || '/placeholder.svg'}
                        alt={artworks.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium mb-1">{artworks.title}</h3>
                      <div className="text-sm text-gray-600 mb-3">{artworks.category}</div>
                      <div className="flex items-center justify-between">
                        <div className="font-bold">${artworks.price}</div>
                        <Link href={`/art?id=${artworks.id}`}>
                          <Button size="sm" variant="outline">View</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}