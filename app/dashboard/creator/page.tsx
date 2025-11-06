import { requireAuth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, DollarSign, Eye, TrendingUp, Settings, Plus, Package, BarChart3, MessageCircle, FileText, Clock, CheckCircle, XCircle, Wallet } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { OptimizedImage } from '@/components/optimized-image'
import { SignOutButton } from '@/components/dashboard/sign-out-button'

interface Submission {
  id: string
  title: string
  creator_type?: string
  status: string
  submission_date?: string
  created_at: string
  price?: number
  currency?: string
}

async function getCreatorStats(userId: string) {
  const supabase = await createServerClient()

  // Get user profile with avatar
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('avatar_url, full_name')
    .eq('id', userId)
    .single()

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

  // Get project submissions
  const { data: submissions } = await supabase
    .from('project_submissions')
    .select('*')
    .eq('creator_id', userId)
    .order('created_at', { ascending: false })

  const submissionStats = {
    total: submissions?.length || 0,
    approved: submissions?.filter(s => s.status === 'approved' || s.status === 'published').length || 0,
    pending: submissions?.filter(s => s.status === 'submitted' || s.status === 'under_review').length || 0,
    rejected: submissions?.filter(s => s.status === 'rejected').length || 0
  }

  return {
    artworksCount: artworksCount || 0,
    totalViews,
    totalEarnings,
    ordersCount: ordersCount || 0,
    recentArtworks: recentArtworks || [],
    submissions: submissions || [],
    submissionStats,
    userProfile
  }
}

export default async function CreatorDashboard() {
  const user = await requireAuth()
  console.log('🔥 Creator Dashboard - User authenticated:', { 
    id: user.id, 
    email: user.email,
    metadata: user.user_metadata 
  })

  // Check user type from database profile first, then fall back to metadata
  const supabase = await createServerClient()
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  console.log('🔥 Creator Dashboard - Profile check:', { 
    profile, 
    profileError: profileError?.message 
  })

  const userType = profile?.role || user.user_metadata?.user_type || user.user_metadata?.role
  console.log('🔥 Creator Dashboard - Determined user type:', userType)

  if (userType !== 'creator') {
    console.log('🔥 Creator Dashboard - Redirecting to collector dashboard')
    redirect('/dashboard/collector')
  }

  const stats = await getCreatorStats(user.id)
  console.log('🔥 Creator Dashboard - Stats loaded successfully')

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
            <span className="text-gray-600">Welcome, {stats.userProfile?.full_name || user.user_metadata?.full_name || user.email}</span>
            <SignOutButton />
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
                    {stats.userProfile?.avatar_url ? (
                      <OptimizedImage
                        src={stats.userProfile.avatar_url}
                        alt={stats.userProfile?.full_name || user.email || 'User'}
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <Upload className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{stats.userProfile?.full_name || user.user_metadata?.full_name || user.email}</h3>
                    <Badge className="bg-orange-100 text-orange-600">Creator</Badge>
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
                  <Link href="/dashboard/submissions/new" className="flex items-center space-x-2 p-2 text-gray-600 hover:bg-gray-50 rounded">
                    <FileText className="w-4 h-4" />
                    <span>Submissions</span>
                  </Link>
                  <Link href="/dashboard/creator/orders" className="flex items-center space-x-2 p-2 text-gray-600 hover:bg-gray-50 rounded">
                    <DollarSign className="w-4 h-4" />
                    <span>Orders & Sales</span>
                  </Link>
                  <Link href="/dashboard/creator/wallet" className="flex items-center space-x-2 p-2 text-gray-600 hover:bg-gray-50 rounded">
                    <Wallet className="w-4 h-4" />
                    <span>Wallet & Earnings</span>
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
                  Welcome to your creator space! Upload your artworks, submit projects for review, track sales, and connect with art lovers worldwide.
                </p>
                <div className="flex gap-4">
                  <Link href="/dashboard/creator/artworks/new">
                    <Button className="bg-orange-500 hover:bg-orange-600">
                      <Plus className="w-4 h-4 mr-2" />
                      Upload New Artwork
                    </Button>
                  </Link>
                  <Link href="/dashboard/submissions/new">
                    <Button variant="outline">
                      <FileText className="w-4 h-4 mr-2" />
                      New Project Submission
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Stats Overview */}
            <div className="grid md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <Package className="w-8 h-8 text-brand-orange mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.artworksCount}</div>
                  <div className="text-gray-600 text-sm">Artworks</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.submissionStats.total}</div>
                  <div className="text-gray-600 text-sm">Submissions</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <Eye className="w-8 h-8 text-brand-yellow mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.totalViews}</div>
                  <div className="text-gray-600 text-sm">Total Views</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <DollarSign className="w-8 h-8 text-brand-orange mx-auto mb-2" />
                  <div className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</div>
                  <div className="text-gray-600 text-sm">Earnings</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <TrendingUp className="w-8 h-8 text-brand-red mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.ordersCount}</div>
                  <div className="text-gray-600 text-sm">Orders</div>
                </CardContent>
              </Card>
            </div>

            {/* Tabbed Content */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="artworks">Artworks</TabsTrigger>
                <TabsTrigger value="submissions">Submissions</TabsTrigger>
                <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Quick Stats */}
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Submission Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          Approved
                        </span>
                        <span className="font-semibold">{stats.submissionStats.approved}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-yellow-600" />
                          Pending
                        </span>
                        <span className="font-semibold">{stats.submissionStats.pending}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-600" />
                          Rejected
                        </span>
                        <span className="font-semibold">{stats.submissionStats.rejected}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Approval Rate</span>
                        <span className="font-semibold">
                          {stats.submissionStats.total > 0
                            ? Math.round((stats.submissionStats.approved / stats.submissionStats.total) * 100)
                            : 0}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Views</span>
                        <span className="font-semibold">{stats.totalViews}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Conversion Rate</span>
                        <span className="font-semibold">
                          {stats.totalViews > 0
                            ? ((stats.ordersCount / stats.totalViews) * 100).toFixed(1)
                            : 0}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.submissions.slice(0, 5).map((submission: Submission) => (
                        <div key={submission.id} className="flex items-center gap-3 text-sm p-3 bg-gray-50 rounded-lg">
                          {submission.status === 'approved' || submission.status === 'published' ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : submission.status === 'rejected' ? (
                            <XCircle className="w-4 h-4 text-red-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-yellow-600" />
                          )}
                          <span className="flex-1">
                            <span className="font-medium">{submission.title}</span> - {submission.status}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {new Date(submission.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                      {stats.submissions.length === 0 && (
                        <p className="text-center text-gray-500 py-4">No recent activity</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Artworks Tab */}
              <TabsContent value="artworks">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>My Artworks</span>
                      <Link href="/dashboard/creator/artworks/new">
                        <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                          <Plus className="w-4 h-4 mr-2" />
                          Upload New
                        </Button>
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.recentArtworks.length > 0 ? (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {stats.recentArtworks.map((artwork: { id: string; image_urls?: string[]; title: string; category: string; price: number; is_available: boolean }) => (
                          <div key={artwork.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="relative w-full h-32 bg-gray-200 rounded-lg mb-3 overflow-hidden">
                              <OptimizedImage
                                src={artwork.image_urls?.[0] || "/image/placeholder.svg"}
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
                        <p className="font-medium mb-2">No artworks yet</p>
                        <p className="text-sm mb-4">Upload your first artwork to get started!</p>
                        <Link href="/dashboard/creator/artworks/new">
                          <Button className="bg-orange-500 hover:bg-orange-600">
                            <Plus className="w-4 h-4 mr-2" />
                            Upload Artwork
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Submissions Tab */}
              <TabsContent value="submissions">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Project Submissions</span>
                      <Link href="/dashboard/submissions/new">
                        <Button size="sm" variant="outline">
                          <Plus className="w-4 h-4 mr-2" />
                          New Submission
                        </Button>
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.submissions.length > 0 ? (
                      <div className="space-y-4">
                        {stats.submissions.map((submission: Submission) => (
                          <div
                            key={submission.id}
                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-4">
                              {submission.status === 'approved' || submission.status === 'published' ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : submission.status === 'rejected' ? (
                                <XCircle className="w-5 h-5 text-red-600" />
                              ) : (
                                <Clock className="w-5 h-5 text-yellow-600" />
                              )}
                              <div>
                                <h3 className="font-semibold text-gray-900">{submission.title}</h3>
                                <p className="text-sm text-gray-600">
                                  {submission.creator_type?.replace('_', ' ')} •
                                  Submitted {new Date(submission.submission_date || submission.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              {submission.price && (
                                <span className="text-sm font-medium text-gray-900">
                                  {submission.currency} {submission.price.toLocaleString()}
                                </span>
                              )}
                              <Badge className={
                                submission.status === 'approved' || submission.status === 'published'
                                  ? 'bg-green-100 text-green-800'
                                  : submission.status === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                              }>
                                {submission.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="font-medium mb-2">No submissions yet</p>
                        <p className="text-sm mb-4">Submit your first project for review</p>
                        <Link href="/dashboard/submissions/new">
                          <Button variant="outline">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Submission
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Getting Started Tab */}
              <TabsContent value="getting-started">
                <Card>
                  <CardHeader>
                    <CardTitle>Getting Started Guide</CardTitle>
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
                          <h4 className="font-medium">Submit Your Project for Review</h4>
                          <p className="text-sm text-gray-600">Fill out the project submission form to get approved</p>
                        </div>
                        <Link href="/dashboard/submissions/new">
                          <Button variant="outline" size="sm">
                            Submit Now
                          </Button>
                        </Link>
                      </div>

                      <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-orange-600 font-bold text-sm">3</span>
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
                          <span className="text-orange-600 font-bold text-sm">4</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">Track Your Sales</h4>
                          <p className="text-sm text-gray-600">Monitor orders and earnings from your dashboard</p>
                        </div>
                        <Link href="/dashboard/creator/orders">
                          <Button variant="outline" size="sm">
                            View Orders
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
