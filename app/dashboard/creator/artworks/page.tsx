import { requireAuth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArtworkCard } from '@/components/artwork-card'
import { ArrowLeft, Plus, Package } from 'lucide-react'
import Link from 'next/link'

async function getCreatorArtworks(userId: string) {
  const supabase = await createServerClient()
  
  const { data: artworks, error } = await supabase
    .from('artworks')
    .select('*')
    .eq('creator_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching artworks:', error)
    return []
  }

  return artworks || []
}

export default async function CreatorArtworksPage() {
  const user = await requireAuth()
  const artworks = await getCreatorArtworks(user.id)

  const availableCount = artworks.filter(artwork => artwork.is_available).length
  const soldCount = artworks.filter(artwork => !artwork.is_available).length
  const totalViews = artworks.reduce((sum, artwork) => sum + (artwork.views_count || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/creator">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">My Artworks</h1>
          </div>
          
          <Link href="/dashboard/creator/artworks/new">
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4 mr-2" />
              Upload New Artwork
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Package className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{artworks.length}</div>
              <div className="text-gray-600">Total Artworks</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-green-600 font-bold">✓</span>
              </div>
              <div className="text-2xl font-bold">{availableCount}</div>
              <div className="text-gray-600">Available</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-red-600 font-bold">✗</span>
              </div>
              <div className="text-2xl font-bold">{soldCount}</div>
              <div className="text-gray-600">Sold</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-purple-600 font-bold">👁</span>
              </div>
              <div className="text-2xl font-bold">{totalViews}</div>
              <div className="text-gray-600">Total Views</div>
            </CardContent>
          </Card>
        </div>

        {/* Artworks Grid */}
        {artworks.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {artworks.map((artwork) => (
              <ArtworkCard 
                key={artwork.id} 
                artwork={artwork} 
                isCreatorView={true}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No artworks yet</h3>
              <p className="text-gray-600 mb-6">
                Start sharing your creativity with the world by uploading your first artwork.
              </p>
              <Link href="/dashboard/creator/artworks/new">
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Your First Artwork
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}