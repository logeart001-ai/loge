import { requireAuth, signOut } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, DollarSign, Eye, TrendingUp, Settings, LogOut, Plus, Package, BarChart3, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { OptimizedImage } from '@/components/optimized-image'

async function getCreatorStats(userId: string) {
  const supabase = await createServerClient()
  
  // Get artworks count
  const { count: artworksCount } = await supabase
    .from('artworks')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', userId)

  // Get total views
  const { data: viewsData } = await supabase
    .from('artworks')
    .select('views_count')
    .eq('creator_id', userId)
  
  const totalViews = viewsData?.reduce((sum, artwork) => sum + (artwork.views_count || 0), 0) || 0

  // Get total earnings
  const { data: ordersData } = await supabase
    .from('orders')
    .select('total_amount')
    .eq('creator_id', userId)
    .eq('status', 'delivered')
  
  const totalEarnings = ordersData?.reduce((sum, order) => sum + parseFloat(order.total_amount), 0) || 0

  // Get orders count
  const { count: ordersCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', userId)

  // Get recent artworks
  const { data: recentArtworks } = await supabase
    .from('artworks')
    .select('*')
    .eq('creator_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)

  return {
    artworksCount: artworksCount || 0,
    totalViews,
    totalEarnings,
    ordersCount: ordersCount || 0,
    recentArtworks: recentArtworks || []
  }
}

export default async function CreatorDashboard() {
  const user = await requireAuth()
  
  if (user.user_metadata?.user_type !== 'creator') {
    redirect('/dashboard/collector')
  }

  const stats = await getCreatorStats(user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <OptimizedImage src="/image/logelogo.png" alt="L'oge Arts logo" width={64} height={64} priority />
            <span className="brand-text font-bold text-lg">L&apos;oge Arts</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Welcome, {user.user_metadata?.full_name || user.email}</span>
            <form action={signOut}>
              <Button variant="outline" size="sm" type="submit">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                    {user.user_metadata?.avatar_url ? (
                      <OptimizedImage src={user.user_metadata.avatar_url || "/placeholder.svg"} alt={user.user_metadata?.full_name || 'Profile avatar'} width={48} height={48} className="rounded-full object-cover" />
                    ) : (
                      <Upload className="w-6 h-6 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{user.user_metadata?.full_name || user.email}</h3>
                    <Badge className="bg-orange-100 text-orange-800">Creator</Badge>
                  </div>
                </div>
                
                <nav className="space-y-2">
                  <Link href="/dashboard/creator" className="flex items-center space-x-2 p-2 bg-orange-50 text-orange-600 rounded">
                    <BarChart3 className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                  <Link href="/dashboard/creator/artworks" className="flex items-center space-x-2 p-2 text-gray-600 hover:bg-gray-50 rounded">
                    <Package className="w-4 h-4" />
                    <span>My Artworks</span>
                  </Link>
                  <Link href="/dashboard/creator/orders" className="flex items-center space-x-2 p-2 text-gray-600 hover:bg-gray-50 rounded">
                    <DollarSign className="w-4 h-4" />
                    <span>Orders & Sales</span>
                  </Link>
                  <Link href="/dashboard/creator/analytics" className="flex items-center space-x-2 p-2 text-gray-600 hover:bg-gray-50 rounded">
                    <TrendingUp className="w-4 h-4" />
                    <span>Analytics</span>
                  </Link>
                  <Link href="/dashboard/creator/profile" className="flex items-center space-x-2 p-2 text-gray-600 hover:bg-gray-50 rounded">
                    <Settings className="w-4 h-4" />
                    <span>Profile Settings</span>
                  </Link>
                  <Link href="/support" className="flex items-center space-x-2 p-2 text-gray-600 hover:bg-gray-50 rounded">
                    <MessageCircle className="w-4 h-4" />
                    <span>Customer Support</span>
                  </Link>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Welcome Section */}
            <Card>
              <CardHeader>
                <CardTitle>Creator Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Welcome to your creator space! Upload your artworks, track sales, and connect with art lovers worldwide.
                </p>
                <div className="flex gap-4">
                  <Link href="/dashboard/creator/artworks/new">
                    <Button className="bg-orange-500 hover:bg-orange-600">
                      <Plus className="w-4 h-4 mr-2" />
                      Upload New Artwork
                    </Button>
                  </Link>
                  <Link href="/dashboard/creator/profile">
                    <Button variant="outline">
                      Complete Profile
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Stats Overview */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <Package className="w-8 h-8 text-brand-orange mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.artworksCount}</div>
                  <div className="text-gray-600">Artworks</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Eye className="w-8 h-8 text-brand-yellow mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.totalViews}</div>
                  <div className="text-gray-600">Total Views</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <DollarSign className="w-8 h-8 text-brand-orange mx-auto mb-2" />
                  <div className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</div>
                  <div className="text-gray-600">Total Earnings</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <TrendingUp className="w-8 h-8 text-brand-red mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.ordersCount}</div>
                  <div className="text-gray-600">Orders</div>
                </CardContent>
              </Card>
            </div>

            {/* Getting Started */}
            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 font-bold text-sm">1</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Complete Your Profile</h4>
                      <p className="text-sm text-gray-600">Add your bio, location, and artistic discipline</p>
                    </div>
                    <Link href="/dashboard/creator/profile">
                      <Button variant="outline" size="sm">
                        Complete
                      </Button>
                    </Link>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 font-bold text-sm">2</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Upload Your First Artwork</h4>
                      <p className="text-sm text-gray-600">Share your creativity with the world</p>
                    </div>
                    <Link href="/dashboard/creator/artworks/new">
                      <Button variant="outline" size="sm">
                        Upload Now
                      </Button>
                    </Link>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 font-bold text-sm">3</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Set Up Your Store</h4>
                      <p className="text-sm text-gray-600">Configure pricing and shipping options</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Set Up
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Artworks */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Artworks</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.recentArtworks.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stats.recentArtworks.map((artwork: { id: string; image_urls?: string[]; title: string; category: string; price: number; is_available: boolean }) => (
                      <div key={artwork.id} className="border rounded-lg p-4">
                        <div className="relative w-full h-32 bg-gray-200 rounded-lg mb-3 overflow-hidden">
                          <OptimizedImage
                            src={artwork.image_urls?.[0] || "/placeholder.svg"}
                            alt={artwork.title}
                            fill
                            className="object-cover rounded-lg"
                          />
                        </div>
                        <h4 className="font-medium text-sm">{artwork.title}</h4>
                        <p className="text-xs text-gray-600 mb-2">{artwork.category}</p>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-sm">${artwork.price}</span>
                          <Badge variant={artwork.is_available ? 'default' : 'secondary'}>
                            {artwork.is_available ? 'Available' : 'Sold'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No artworks yet.</p>
                    <p className="text-sm">Upload your first artwork to get started!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
