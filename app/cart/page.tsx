import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase'
import { CartRow } from '@/components/cart/cart-row'

type CartSSRItem = {
  id: string
  artwork_id: string
  unit_price: number
  quantity: number
  title: string
  thumbnail_url: string | null
}

async function fetchCart() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { id: null, items: [], subtotal: 0, count: 0 }
  // Query directly to avoid an extra network hop on SSR
  const { data: cart } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!cart) return { id: null, items: [], subtotal: 0, count: 0 }

  const { data: items } = await supabase
    .from('cart_items')
    .select('id, artwork_id, unit_price, quantity, artwork:artworks!artwork_id(id, title, thumbnail_url)')
    .eq('cart_id', cart.id)
    .order('created_at')

  type RawRow = { id: string; artwork_id: string; unit_price: string | number | null; quantity: number | null; artwork?: { title?: string | null; thumbnail_url?: string | null } | null }
  const mapped: CartSSRItem[] = (items as RawRow[] | null ?? []).map((row: RawRow) => ({
    id: String(row.id),
    artwork_id: String(row.artwork_id),
    title: row.artwork?.title ?? 'Untitled',
    thumbnail_url: row.artwork?.thumbnail_url ?? null,
    unit_price: typeof row.unit_price === 'string' ? parseFloat(row.unit_price) : Number(row.unit_price ?? 0),
    quantity: Number(row.quantity ?? 1),
  }))
  const subtotal = mapped.reduce((s: number, it: CartSSRItem) => s + it.unit_price * it.quantity, 0)
  const count = mapped.reduce((s: number, it: CartSSRItem) => s + it.quantity, 0)
  return { id: cart.id, items: mapped, subtotal, count }
}

export default async function CartPage() {
  const cart = await fetchCart()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Your Cart</h1>
        {cart.count === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-600 mb-6">Your cart is empty.</p>
              <Link href="/art">
                <Button className="bg-orange-600 hover:bg-orange-700">Browse Artworks</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item: CartSSRItem) => (
                <CartRow key={item.id} item={item} />
              ))}
            </div>
            <div>
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span className="font-semibold">₦{cart.subtotal.toLocaleString()}</span>
                  </div>
                  <Button className="w-full bg-orange-600 hover:bg-orange-700" disabled>
                    Checkout (coming soon)
                  </Button>
                  <Link href="/art" className="block text-center text-sm text-gray-600 hover:text-gray-800">
                    Continue shopping
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Client row moved to ./cart-row.tsx
