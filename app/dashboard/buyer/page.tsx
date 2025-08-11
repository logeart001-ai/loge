import { requireAuth, signOut } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, ShoppingBag, User, Bell, Settings, LogOut } from 'lucide-react'
import Link from 'next/link'

async function getBuyerStats(userId: string) {
  const supabase = await createServerClient()
  
  // Get orders count
  const { count: ordersCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('buyer_id', userId)

  // Get wishlist count
  const { count: wishlistCount } = await supabase
    .from('wishlist')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  // Get following count
  const { count: followingCount } = await supabase
    .from('following')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId)

  // Get recent orders
  const { data: recentOrders } = await supabase
    .from('orders')
    .select(`
      *,
      artworks (
        title,
        image_urls
      ),
      user_profiles!orders_creator_id_fkey (
        full_name
      )
    `)
    .eq('buyer_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)

  return {
    ordersCount: ordersCount || 0,
    wishlistCount: wishlistCount || 0,
    followingCount: followingCount || 0,
    recentOrders: recentOrders || []
  }
}

export default async function BuyerDashboard() {
  const user = await requireAuth()
  const stats = await getBuyerStats(user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="font-bold text-lg">L'oge Arts</span>
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
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    {user.user_metadata?.avatar_url ? (
                      <img src={user.user_metadata.avatar_url || "/placeholder.svg"} alt={user.user_metadata?.full_name} className="w-12 h-12 rounded-full" />
                    ) : (
                      <User className="w-6 h-6 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{user.user_metadata?.full_name || user.email}</h3>
                    <Badge variant="secondary">Art Enthusiast</Badge>
                  </div>
                </div>
                
                <nav className="space-y-2">
                  <Link href="/dashboard/buyer" className="flex items-center space-x-2 p-2 bg-orange-50 text-orange-600 rounded">
                    <User className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                  <Link href="/dashboard/buyer/orders" className="flex items-center space-x-2 p-2 text-gray-600 hover:bg-gray-50 rounded">
                    <ShoppingBag className="w-4 h-4" />
                    <span>Order History</span>
                  </Link>
                  <Link href="/dashboard/buyer/wishlist" className="flex items-center space-x-2 p-2 text-gray-600 hover:bg-gray-50 rounded">
                    <Heart className="w-4 h-4" />
                    <span>Wishlist</span>
                  </Link>
                  <Link href="/dashboard/buyer/following" className="flex items-center space-x-2 p-2 text-gray-600 hover:bg-gray-50 rounded">
                    <Bell className="w-4 h-4" />
                    <span>Following</span>
                  </Link>
                  <Link href="/dashboard/buyer/settings" className="flex items-center space-x-2 p-2 text-gray-600 hover:bg-gray-50 rounded">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
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
                <CardTitle>Welcome back, {user.user_metadata?.full_name || user.email}!</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Discover amazing African art, fashion, and literature from talented creators across the continent.
                </p>
                <div className="flex gap-4">
                  <Link href="/">
                    <Button className="bg-orange-500 hover:bg-orange-600">
                      Explore Artworks
                    </Button>
                  </Link>
                  <Link href="/events">
                    <Button variant="outline">
                      View Events
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <ShoppingBag className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.ordersCount}</div>
                  <div className="text-gray-600">Orders</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.wishlistCount}</div>
                  <div className="text-gray-600">Wishlist Items</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Bell className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.followingCount}</div>
                  <div className="text-gray-600">Following</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.recentOrders.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recentOrders.map((order: any) => (
                      <div key={order.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0">
                          {order.artworks?.image_urls?.[0] && (
                            <img 
                              src={order.artworks.image_urls[0] || "/placeholder.svg"} 
                              alt={order.artworks.title}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{order.artworks?.title}</h4>
                          <p className="text-sm text-gray-600">by {order.user_profiles?.full_name}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">${order.total_amount}</div>
                          <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No orders yet.</p>
                    <p className="text-sm">Start exploring to make your first purchase!</p>
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
