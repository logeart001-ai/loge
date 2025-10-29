'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GrowthChart } from './growth-chart'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  Eye, 
  Heart,
  DollarSign,
  Activity,
  Star,
  MessageSquare
} from 'lucide-react'

interface AnalyticsData {
  users: {
    total: number
    new_this_month: number
    active_users: number
    creators: number
    collectors: number
  }
  content: {
    total_artworks: number
    new_artworks_this_month: number
    total_views: number
    total_likes: number
    avg_views_per_artwork: number
  }
  sales: {
    total_revenue: number
    monthly_revenue: number
    total_orders: number
    monthly_orders: number
    avg_order_value: number
  }
  engagement: {
    total_follows: number
    total_wishlists: number
    total_reviews: number
    avg_rating: number
  }
}

interface ChartData {
  date: string
  users: number
  artworks: number
  revenue: number
  orders: number
  [key: string]: string | number
}

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    users: { total: 0, new_this_month: 0, active_users: 0, creators: 0, collectors: 0 },
    content: { total_artworks: 0, new_artworks_this_month: 0, total_views: 0, total_likes: 0, avg_views_per_artwork: 0 },
    sales: { total_revenue: 0, monthly_revenue: 0, total_orders: 0, monthly_orders: 0, avg_order_value: 0 },
    engagement: { total_follows: 0, total_wishlists: 0, total_reviews: 0, avg_rating: 0 }
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [chartType, setChartType] = useState<'area' | 'line' | 'bar'>('area')
  const supabase = createClient()

  useEffect(() => {
    fetchAnalytics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      // Fetch user analytics
      const { count: totalUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })

      const { count: newUsersThisMonth } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString())

      const { count: creators } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'creator')

      const { count: collectors } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'collector')

      // Fetch content analytics
      const { count: totalArtworks } = await supabase
        .from('artworks')
        .select('*', { count: 'exact', head: true })

      const { count: newArtworksThisMonth } = await supabase
        .from('artworks')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString())

      const { count: totalViews } = await supabase
        .from('artwork_views')
        .select('*', { count: 'exact', head: true })

      const { count: totalWishlists } = await supabase
        .from('wishlists')
        .select('*', { count: 'exact', head: true })

      // Fetch sales analytics
      const { data: ordersData } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .eq('status', 'completed')

      const totalRevenue = ordersData?.reduce((sum, order) => sum + order.total_amount, 0) || 0
      const monthlyOrders = ordersData?.filter(order => 
        new Date(order.created_at) >= startOfMonth
      ) || []
      const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + order.total_amount, 0)

      // Fetch engagement analytics
      const { count: totalFollows } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })

      const { count: totalReviews } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })

      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('rating')

      const avgRating = reviewsData?.length 
        ? reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length 
        : 0

      setAnalytics({
        users: {
          total: totalUsers || 0,
          new_this_month: newUsersThisMonth || 0,
          active_users: totalUsers || 0, // Simplified - could be more sophisticated
          creators: creators || 0,
          collectors: collectors || 0
        },
        content: {
          total_artworks: totalArtworks || 0,
          new_artworks_this_month: newArtworksThisMonth || 0,
          total_views: totalViews || 0,
          total_likes: totalWishlists || 0, // Using wishlists as likes
          avg_views_per_artwork: totalArtworks ? (totalViews || 0) / totalArtworks : 0
        },
        sales: {
          total_revenue: totalRevenue,
          monthly_revenue: monthlyRevenue,
          total_orders: ordersData?.length || 0,
          monthly_orders: monthlyOrders.length,
          avg_order_value: ordersData?.length ? totalRevenue / ordersData.length : 0
        },
        engagement: {
          total_follows: totalFollows || 0,
          total_wishlists: totalWishlists || 0,
          total_reviews: totalReviews || 0,
          avg_rating: avgRating
        }
      })

      // Generate growth trend data for the last 30 days
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      const growthData: ChartData[] = []

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const startOfDay = new Date(date.setHours(0, 0, 0, 0))
        const endOfDay = new Date(date.setHours(23, 59, 59, 999))

        // Fetch users created on this day
        const { count: dailyUsers } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfDay.toISOString())
          .lte('created_at', endOfDay.toISOString())

        // Fetch artworks created on this day
        const { count: dailyArtworks } = await supabase
          .from('artworks')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfDay.toISOString())
          .lte('created_at', endOfDay.toISOString())

        // Fetch orders and revenue for this day
        const { data: dailyOrders } = await supabase
          .from('orders')
          .select('total_amount')
          .gte('created_at', startOfDay.toISOString())
          .lte('created_at', endOfDay.toISOString())
          .eq('status', 'delivered')

        const dailyRevenue = dailyOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0

        growthData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          users: dailyUsers || 0,
          artworks: dailyArtworks || 0,
          revenue: dailyRevenue,
          orders: dailyOrders?.length || 0
        })
      }

      setChartData(growthData)

    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">Platform performance and insights</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(analytics.users.total)}</p>
                    <p className="text-xs text-green-600">+{analytics.users.new_this_month} this month</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.sales.total_revenue)}</p>
                    <p className="text-xs text-green-600">{formatCurrency(analytics.sales.monthly_revenue)} this month</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Artworks</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(analytics.content.total_artworks)}</p>
                    <p className="text-xs text-green-600">+{analytics.content.new_artworks_this_month} this month</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Views</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(analytics.content.total_views)}</p>
                    <p className="text-xs text-gray-600">{Math.round(analytics.content.avg_views_per_artwork)} avg per artwork</p>
                  </div>
                  <Eye className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Growth Trends Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Growth Trends</CardTitle>
                <div className="flex gap-2">
                  <Select value={chartType} onValueChange={(value: 'area' | 'line' | 'bar') => setChartType(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="area">Area</SelectItem>
                      <SelectItem value="line">Line</SelectItem>
                      <SelectItem value="bar">Bar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <GrowthChart
                data={chartData}
                datasets={[
                  { key: 'users', label: 'New Users', color: '#3B82F6' },
                  { key: 'artworks', label: 'New Artworks', color: '#10B981' },
                  { key: 'orders', label: 'Orders', color: '#F59E0B' }
                ]}
                type={chartType}
                height={320}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900">{formatNumber(analytics.users.total)}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Creators</p>
                    <p className="text-3xl font-bold text-gray-900">{formatNumber(analytics.users.creators)}</p>
                  </div>
                  <Activity className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Collectors</p>
                    <p className="text-3xl font-bold text-gray-900">{formatNumber(analytics.users.collectors)}</p>
                  </div>
                  <ShoppingCart className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Artworks</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(analytics.content.total_artworks)}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Views</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(analytics.content.total_views)}</p>
                  </div>
                  <Eye className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Views/Artwork</p>
                    <p className="text-2xl font-bold text-gray-900">{Math.round(analytics.content.avg_views_per_artwork)}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">In Wishlists</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(analytics.content.total_likes)}</p>
                  </div>
                  <Heart className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.sales.total_revenue)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(analytics.sales.total_orders)}</p>
                  </div>
                  <ShoppingCart className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.sales.avg_order_value)}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Follows</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(analytics.engagement.total_follows)}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Wishlisted Items</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(analytics.engagement.total_wishlists)}</p>
                  </div>
                  <Heart className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(analytics.engagement.total_reviews)}</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.engagement.avg_rating.toFixed(1)}</p>
                  </div>
                  <Star className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}