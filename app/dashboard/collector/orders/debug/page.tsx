'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type OrderRow = {
  id: string
  order_number?: string | null
  total_amount?: number | string | null
  status?: string | null
  created_at: string
}

export default function CollectorOrdersPageDebug() {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<{ id: string } | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClientComponentClient()
        
        // Check auth
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
        console.log('Client auth check:', { user: currentUser?.id, authError })
        
        if (authError || !currentUser) {
          setError('Not authenticated')
          setLoading(false)
          return
        }
        
        setUser(currentUser)
        
        // Fetch orders
        const { data, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('buyer_id', currentUser.id)
          .order('created_at', { ascending: false })
        
        console.log('Client orders query:', { 
          data: data?.length || 0, 
          error: ordersError 
        })
        
        if (ordersError) {
          setError(`Orders error: ${ordersError.message} (${ordersError.code})`)
        } else {
          setOrders(data || [])
        }
        
      } catch (err) {
        console.error('Client fetch error:', err)
        setError(`Exception: ${err}`)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl font-semibold">Collection History (Debug)</h1>
          {user && <p className="text-sm text-gray-600">User ID: {user.id}</p>}
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Art Collection</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                Error: {error}
              </div>
            )}
            
            {!error && orders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No artworks collected yet.</div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="flex items-center gap-4 p-4 border rounded-lg bg-white">
                    <div className="flex-1">
                      <div className="font-medium">Order {order.order_number || order.id.slice(0, 8)}</div>
                      <div className="text-sm text-gray-600">
                        Collected on {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">${order.total_amount ?? '—'}</div>
                      <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                        {order.status || 'pending'}
                      </Badge>
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