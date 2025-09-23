// Thin client helpers that call our Next.js API for cart operations

export type CartItem = {
  id: string
  artwork_id: string
  title: string
  thumbnail_url: string | null
  unit_price: number
  quantity: number
  creator_id?: string
}

export type Cart = {
  id: string
  items: CartItem[]
  subtotal: number
  count: number
}

async function handleJson(res: Response) {
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || 'Request failed'
    throw new Error(message)
  }
  return data
}

export async function getCart(): Promise<Cart> {
  const res = await fetch('/api/cart', { method: 'GET', credentials: 'include' })
  return handleJson(res)
}

export async function addToCart(artworkId: string, quantity = 1) {
  const res = await fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ artworkId, quantity })
  })
  const data = await handleJson(res)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: data?.count ?? 0 }))
  }
  return data
}

export async function updateCartItem(itemId: string, quantity: number) {
  const res = await fetch('/api/cart', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ itemId, quantity })
  })
  const data = await handleJson(res)
  if (typeof window !== 'undefined') {
    // We don't know count here; caller can refresh. Emit a generic event.
    window.dispatchEvent(new Event('cart:updated'))
  }
  return data
}

export async function removeCartItem(itemId: string) {
  const res = await fetch('/api/cart', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ itemId })
  })
  const data = await handleJson(res)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('cart:updated'))
  }
  return data
}
