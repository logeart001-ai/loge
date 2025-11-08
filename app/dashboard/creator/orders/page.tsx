'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ShoppingBag, TrendingUp } from 'lucide-react'

type OrderRow = {
  id: string
  order_number?: string | null
  total_amount?: number | string | null
  status?: string | null
  created_at: string
  buyer_id?: string | null
  seller_id?: string | null
  order_items?: OrderItemRow[]
}

type OrderItemRow = {
  id: string
  order_id: string
  artwork_id: string
  artwork_title?: string | null
  quantity: number
  price_at_purchase: number
  creator_id: string
}

export default function CreatorOrdersPage() {
  const [sales, setSales] = useState<OrderRow[]>([])
  const [purchases, setPurchases] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrders() {
      try {
        // Fetch sales (where user is the seller)
        const salesRes = await fetch('/api/creator/sales')
        if (salesRes.ok) {
          const salesData = await salesRes.json()
          setSales(salesData.orders || [])
        }

        // Fetch purchases (where user is the buyer)
        const purchasesRes = await fetch('/api/creator/purchases')
        if (purchasesRes.ok) {
          const purchasesData = await purchasesRes.json()
          setPurchases(purchasesData.orders || [])
        }
      } catch (error) {
        console.error('Error fetching orders:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const renderOrders = (orders: OrderRow[], type: 'sales' | 'purchases') => {
    if (loading) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading orders...</p>
        </div>
      )
    }

    if (orders.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-2">
            {type === 'sales' ? (
              <TrendingUp className="w-16 h-16 mx-auto" />
            ) : (
              <ShoppingBag className="w-16 h-16 mx-auto" />
            )}
          </div>
          <p className="text-gray-500 text-lg font-medium">
            {type === 'sales' ? 'No sales yet' : 'No purchases yet'}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {type === 'sales' 
              ? 'Your sales will appear here when customers purchase your artworks'
              : 'Your purchases will appear here when you buy artworks'}
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {orders.map((order: OrderRow) => {
          const totalAmount = typeof order.total_amount === 'string' 
            ? parseFloat(order.total_amount) 
            : (order.total_amount || 0)
          const itemCount = order.order_items?.length || 1
          
          return (
            <div key={order.id} className="border rounded-lg bg-white overflow-hidden hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-semibold text-gray-900">
                      Order #{order.order_number || order.id.slice(0, 8).toUpperCase()}
                    </div>
                    <Badge variant={order.status === 'delivered' ? 'default' : order.status === 'confirmed' ? 'secondary' : 'outline'}>
                      {order.status || 'pending'}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(order.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                  {itemCount > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      {itemCount} item{itemCount !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900">
                    ₦{totalAmount.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {type === 'sales' ? 'Revenue' : 'Spent'}
                  </div>
                </div>
              </div>
              
              {/* Show order items if available */}
              {order.order_items && order.order_items.length > 0 && (
                <div className="border-t bg-gray-50 px-4 py-3">
                  <div className="text-xs font-medium text-gray-700 mb-2">Items in this order:</div>
                  <div className="space-y-1">
                    {order.order_items.map((item: OrderItemRow) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-700">
                          {item.artwork_title || 'Artwork'} × {item.quantity}
                        </span>
                        <span className="font-medium text-gray-900">
                          ₦{(item.price_at_purchase * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl font-semibold">Orders & Transactions</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="sales" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="sales" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Sales ({sales.length})
                </TabsTrigger>
                <TabsTrigger value="purchases" className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  Purchases ({purchases.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="sales">
                {renderOrders(sales, 'sales')}
              </TabsContent>
              
              <TabsContent value="purchases">
                {renderOrders(purchases, 'purchases')}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
