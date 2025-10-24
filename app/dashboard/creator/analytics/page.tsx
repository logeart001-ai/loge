import { requireAuth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  DollarSign, 
  Eye, 
  Package,
  ArrowLeft,
  Calendar,
  BarChart3,
  ShoppingCart
} from 'lucide-react'
import Link from 'next/link'

interface AnalyticsData {
  // Overview Stats
  totalRevenue: number
  totalOrders: number
  totalViews: number
  totalArtworks: number
  
  // Sales Trends (last 30 days)
  salesByDay: Array<{ date: string; amount: number; count: number }>
  
  // Top Performing Artworks
  topArtworks: Array<{
    id: string
    title: string
    price: number
    views_count: number
    sales_count: number
    revenue: number
    image_url: string | null
  }>
  
  // Revenue by Category
  revenueByCategory: Array<{
    category: string
    revenue: number
    count: number
    percentage: number
  }>
  
  // Recent Performance
  last30DaysRevenue: number
  last30DaysOrders: number
  revenueGrowth: number
  ordersGrowth: number
}

async function getCreatorAnalytics(userId: string): Promise<AnalyticsData> {
  const supabase = await createServerClient()
  
  // Get all artworks
  const { data: artworks } = await supabase
    .from('artworks')
    .select('*')
    .eq('creator_id', userId)
  
  const totalArtworks = artworks?.length || 0
  const totalViews = artworks?.reduce((sum, a) => sum + (a.views_count || 0), 0) || 0
  
  // Get all orders (delivered status)
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('creator_id', userId)
    .eq('status', 'delivered')
    .order('created_at', { ascending: false })
  
  const totalOrders = orders?.length || 0
  const totalRevenue = orders?.reduce((sum, o) => sum + parseFloat(o.total_amount || '0'), 0) || 0
  
  // Calculate date ranges
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
  
  // Last 30 days performance
  const last30DaysOrders = orders?.filter(o => new Date(o.created_at) >= thirtyDaysAgo) || []
  const last30DaysRevenue = last30DaysOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || '0'), 0)
  
  // Previous 30 days (for growth calculation)
  const previous30DaysOrders = orders?.filter(o => {
    const date = new Date(o.created_at)
    return date >= sixtyDaysAgo && date < thirtyDaysAgo
  }) || []
  const previous30DaysRevenue = previous30DaysOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || '0'), 0)
  
  // Calculate growth
  const revenueGrowth = previous30DaysRevenue > 0 
    ? ((last30DaysRevenue - previous30DaysRevenue) / previous30DaysRevenue) * 100 
    : last30DaysRevenue > 0 ? 100 : 0
    
  const ordersGrowth = previous30DaysOrders.length > 0
    ? ((last30DaysOrders.length - previous30DaysOrders.length) / previous30DaysOrders.length) * 100
    : last30DaysOrders.length > 0 ? 100 : 0
  
  // Sales by day (last 30 days)
  const salesByDay = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dateStr = date.toISOString().split('T')[0]
    const dayOrders = last30DaysOrders.filter(o => o.created_at.startsWith(dateStr))
    return {
      date: dateStr,
      amount: dayOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || '0'), 0),
      count: dayOrders.length
    }
  }).reverse()
  
  // Revenue by category
  const categoryMap = new Map<string, { revenue: number; count: number }>()
  
  for (const order of orders || []) {
    // Get order items to find categories
    const { data: items } = await supabase
      .from('order_items')
      .select('artwork_id')
      .eq('order_id', order.id)
    
    if (items && items.length > 0) {
      // Get artwork details for category
      const artworkIds = items.map(item => item.artwork_id)
      const { data: orderArtworks } = await supabase
        .from('artworks')
        .select('category')
        .in('id', artworkIds)
      
      for (const artwork of orderArtworks || []) {
        const category = artwork.category || 'uncategorized'
        const existing = categoryMap.get(category) || { revenue: 0, count: 0 }
        categoryMap.set(category, {
          revenue: existing.revenue + parseFloat(order.total_amount || '0'),
          count: existing.count + 1
        })
      }
    }
  }
  
  const revenueByCategory = Array.from(categoryMap.entries()).map(([category, data]) => ({
    category: category.charAt(0).toUpperCase() + category.slice(1),
    revenue: data.revenue,
    count: data.count,
    percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
  })).sort((a, b) => b.revenue - a.revenue)
  
  // Top performing artworks (by views and sales)
  const artworkStats = await Promise.all(
    (artworks || []).slice(0, 10).map(async (artwork) => {
      // Count sales for this artwork
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('order_id')
        .eq('artwork_id', artwork.id)
      
      const salesCount = orderItems?.length || 0
      const revenue = salesCount * parseFloat(artwork.price || '0')
      
      return {
        id: artwork.id,
        title: artwork.title,
        price: parseFloat(artwork.price || '0'),
        views_count: artwork.views_count || 0,
        sales_count: salesCount,
        revenue,
        image_url: artwork.thumbnail_url || (artwork.image_urls?.[0] || null)
      }
    })
  )
  
  // Sort by revenue first, then views
  const topArtworks = artworkStats
    .sort((a, b) => {
      if (b.revenue !== a.revenue) return b.revenue - a.revenue
      return b.views_count - a.views_count
    })
    .slice(0, 5)
  
  return {
    totalRevenue,
    totalOrders,
    totalViews,
    totalArtworks,
    salesByDay,
    topArtworks,
    revenueByCategory,
    last30DaysRevenue,
    last30DaysOrders: last30DaysOrders.length,
    revenueGrowth,
    ordersGrowth
  }
}

export default async function CreatorAnalyticsPage() {
  const user = await requireAuth()
  
  if (user.user_metadata?.user_type !== 'creator') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Access denied. Creator account required.</p>
      </div>
    )
  }
  
  const analytics = await getCreatorAnalytics(user.id)
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Link 
                href="/dashboard/creator"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors inline-block"
                aria-label="Back to dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            </div>
            <p className="text-gray-600">Track your performance and insights</p>
          </div>
          
          <Badge variant="outline" className="gap-2">
            <Calendar className="w-4 h-4" />
            Last 30 Days
          </Badge>
        </div>
        
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Revenue
              </CardTitle>
              <DollarSign className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(analytics.totalRevenue)}
              </div>
              <div className="flex items-center gap-1 mt-1">
                {analytics.revenueGrowth >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
                )}
                <span className={`text-sm ${analytics.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(analytics.revenueGrowth).toFixed(1)}% from last period
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Orders
              </CardTitle>
              <ShoppingCart className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {analytics.totalOrders}
              </div>
              <div className="flex items-center gap-1 mt-1">
                {analytics.ordersGrowth >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
                )}
                <span className={`text-sm ${analytics.ordersGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(analytics.ordersGrowth).toFixed(1)}% from last period
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Views
              </CardTitle>
              <Eye className="w-4 h-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {analytics.totalViews.toLocaleString()}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Across all artworks
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Artworks
              </CardTitle>
              <Package className="w-4 h-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {analytics.totalArtworks}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Published artworks
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Sales Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Sales Trends (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.salesByDay.some(day => day.amount > 0) ? (
              <div className="space-y-4">
                {/* Simple bar chart */}
                <div className="h-64 flex items-end gap-1">
                  {analytics.salesByDay.map((day, index) => {
                    const maxAmount = Math.max(...analytics.salesByDay.map(d => d.amount))
                    const height = maxAmount > 0 ? (day.amount / maxAmount) * 100 : 0
                    
                    return (
                      <div
                        key={index}
                        className="flex-1 group relative h-full"
                      >
                        <div
                          className={`w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer absolute bottom-0`}
                          style={{ height: `${height}%` } as React.CSSProperties}
                          title={`${new Date(day.date).toLocaleDateString()}: ${formatCurrency(day.amount)} (${day.count} orders)`}
                        />
                        
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                          <div className="font-semibold">{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                          <div>{formatCurrency(day.amount)}</div>
                          <div>{day.count} orders</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                {/* X-axis labels */}
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{new Date(analytics.salesByDay[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <span>{new Date(analytics.salesByDay[Math.floor(analytics.salesByDay.length / 2)].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <span>{new Date(analytics.salesByDay[analytics.salesByDay.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
                
                {/* Stats */}
                <div className="pt-4 border-t grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Period Revenue</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(analytics.last30DaysRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Period Orders</p>
                    <p className="text-xl font-bold text-gray-900">{analytics.last30DaysOrders}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Average Order</p>
                    <p className="text-xl font-bold text-gray-900">
                      {analytics.last30DaysOrders > 0 
                        ? formatCurrency(analytics.last30DaysRevenue / analytics.last30DaysOrders)
                        : formatCurrency(0)
                      }
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No sales data available yet</p>
                  <p className="text-sm mt-1">Start selling to see your trends!</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performing Artworks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Top Performing Artworks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.topArtworks.length > 0 ? (
                <div className="space-y-4">
                  {analytics.topArtworks.map((artwork, index) => (
                    <div key={artwork.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-400 w-8">
                        #{index + 1}
                      </div>
                      
                      {artwork.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={artwork.image_url} 
                          alt={artwork.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {artwork.title}
                        </h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {artwork.views_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <ShoppingCart className="w-4 h-4" />
                            {artwork.sales_count} sales
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-bold text-gray-900">
                          {formatCurrency(artwork.revenue)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(artwork.price)} each
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-400">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No artwork performance data yet</p>
                  <p className="text-sm mt-1">Upload artworks to track their performance</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Revenue by Category */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Revenue by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.revenueByCategory.length > 0 ? (
                <div className="space-y-4">
                  {analytics.revenueByCategory.map((category) => (
                    <div key={category.category}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {category.category}
                          </span>
                          <Badge variant="secondary">
                            {category.count} orders
                          </Badge>
                        </div>
                        <span className="font-bold text-gray-900">
                          {formatCurrency(category.revenue)}
                        </span>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="absolute inset-y-0 left-0 bg-linear-to-r from-blue-500 to-blue-600 rounded-full"
                          style={{ width: `${category.percentage}%` }}
                        />
                      </div>
                      
                      <div className="text-sm text-gray-500 mt-1">
                        {category.percentage.toFixed(1)}% of total revenue
                      </div>
                    </div>
                  ))}
                  
                  {/* Total */}
                  <div className="pt-4 border-t flex items-center justify-between">
                    <span className="font-semibold text-gray-900">Total Revenue</span>
                    <span className="text-xl font-bold text-gray-900">
                      {formatCurrency(analytics.totalRevenue)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-gray-400">
                  <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No revenue data yet</p>
                  <p className="text-sm mt-1">Make your first sale to see category breakdown</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-linear-to-br from-green-50 to-green-100 rounded-lg">
                <div className="text-3xl font-bold text-green-700">
                  {analytics.totalOrders > 0 
                    ? ((analytics.totalRevenue / analytics.totalOrders).toFixed(0))
                    : '0'
                  }
                </div>
                <div className="text-sm text-green-600 mt-1">Average Order Value (₦)</div>
              </div>
              
              <div className="text-center p-4 bg-linear-to-br from-blue-50 to-blue-100 rounded-lg">
                <div className="text-3xl font-bold text-blue-700">
                  {analytics.totalArtworks > 0
                    ? ((analytics.totalViews / analytics.totalArtworks).toFixed(0))
                    : '0'
                  }
                </div>
                <div className="text-sm text-blue-600 mt-1">Avg Views per Artwork</div>
              </div>
              
              <div className="text-center p-4 bg-linear-to-br from-purple-50 to-purple-100 rounded-lg">
                <div className="text-3xl font-bold text-purple-700">
                  {analytics.totalViews > 0 && analytics.totalOrders > 0
                    ? ((analytics.totalOrders / analytics.totalViews) * 100).toFixed(2)
                    : '0'
                  }%
                </div>
                <div className="text-sm text-purple-600 mt-1">Conversion Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
