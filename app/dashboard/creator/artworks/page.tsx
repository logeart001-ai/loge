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
  
  // Get both published artworks and submissions
  const [artworksResult, submissionsResult] = await Promise.allSettled([
    supabase
      .from('artworks')
      .select('*, approval_status')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false }),
    
    supabase
      .from('project_submissions')
      .select('*')
      .eq('creator_id', userId)
      .order('submission_date', { ascending: false })
  ])

  const artworks = artworksResult.status === 'fulfilled' ? artworksResult.value.data || [] : []
  const submissions = submissionsResult.status === 'fulfilled' ? submissionsResult.value.data || [] : []

  // Combine artworks and submissions, avoiding duplicates
  const combined = [
    ...artworks.map(artwork => ({
      ...artwork,
      type: 'artwork',
      status: artwork.approval_status || 'pending', // Use approval_status from artworks table
      created_at: artwork.created_at
    })),
    ...submissions
      .filter(sub => !artworks.some(art => art.title === sub.title)) // Avoid duplicates
      .map(submission => ({
        id: submission.id,
        title: submission.title,
        description: submission.description,
        price: submission.price,
        currency: submission.currency,
        thumbnail_url: null, // Submissions don't have thumbnails in artworks format
        type: 'submission',
        status: submission.status,
        created_at: submission.submission_date,
        category: submission.creator_type,
        is_available: submission.status === 'published'
      }))
  ]

  return combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export default async function CreatorArtworksPage() {
  const user = await requireAuth()
  const artworks = await getCreatorArtworks(user.id)

  const publishedCount = artworks.filter(item => item.status === 'approved' || item.status === 'published').length
  const pendingCount = artworks.filter(item => item.status === 'pending' || item.status === 'submitted' || item.status === 'under_review').length
  const rejectedCount = artworks.filter(item => item.status === 'rejected').length
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
              <Package className="w-8 h-8 text-brand-orange mx-auto mb-2" />
              <div className="text-2xl font-bold">{artworks.length}</div>
              <div className="text-gray-600">Total Artworks</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-green-600 font-bold">✓</span>
              </div>
              <div className="text-2xl font-bold">{publishedCount}</div>
              <div className="text-gray-600">Published</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-yellow-600 font-bold">⏳</span>
              </div>
              <div className="text-2xl font-bold">{pendingCount}</div>
              <div className="text-gray-600">Pending Review</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-8 h-8 bg-brand-grey/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-brand-grey font-bold">👁</span>
              </div>
              <div className="text-2xl font-bold">{totalViews}</div>
              <div className="text-gray-600">Total Views</div>
            </CardContent>
          </Card>
        </div>

        {/* Artworks & Submissions Grid */}
        {artworks.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {artworks.map((item) => (
              <div key={item.id} className="relative">
                {item.type === 'submission' ? (
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                        <Package className="w-12 h-12 text-gray-400" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{item.title}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-lg">
                          {item.currency} {item.price?.toLocaleString()}
                        </span>
                        <Badge 
                          className={
                            item.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                            item.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                            item.status === 'approved' ? 'bg-green-100 text-green-800' :
                            item.status === 'published' ? 'bg-green-100 text-green-800' :
                            item.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }
                        >
                          {item.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        Submitted {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <ArtworkCard 
                    artwork={item} 
                    isCreatorView={true}
                  />
                )}
              </div>
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