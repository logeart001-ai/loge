import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// Helpers
type Supa = Awaited<ReturnType<typeof createServerClient>>

async function requireUser() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return { supabase, user }
}

async function getOrCreateActiveCart(supabase: Supa, userId: string) {
  // Try to get an active cart
  const { data: existing } = await supabase
    .from('carts')
    .select('id, status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (existing) return existing

  // Create if not exist
  const { data: created, error: createErr } = await supabase
    .from('carts')
    .insert({ user_id: userId, status: 'active' })
    .select('id, status')
    .single()

  if (createErr) throw new Error(createErr.message)
  return created
}

type ItemRow = {
  id: string
  artwork_id: string
  unit_price: string | number
  quantity: number
  // Supabase join can sometimes be inferred as an array; accept both and normalize later
  artwork?:
    | { id: string; title?: string | null; thumbnail_url?: string | null; creator_id?: string | null }
    | { id: string; title?: string | null; thumbnail_url?: string | null; creator_id?: string | null }[]
    | null
}

function toCartResponse(items: ItemRow[]) {
  const mapped = (items || []).map((row) => {
    const art = Array.isArray(row.artwork) ? row.artwork[0] : row.artwork
    return {
      id: row.id,
      artwork_id: row.artwork_id,
      title: art?.title ?? 'Untitled',
      thumbnail_url: art?.thumbnail_url ?? null,
      unit_price: typeof row.unit_price === 'string' ? parseFloat(row.unit_price) : Number(row.unit_price ?? 0),
      quantity: row.quantity,
      creator_id: art?.creator_id ?? undefined,
    }
  })
  const subtotal = mapped.reduce((s, it) => s + it.unit_price * it.quantity, 0)
  const count = mapped.reduce((s, it) => s + it.quantity, 0)
  return { items: mapped, subtotal, count }
}

export async function GET() {
  try {
    const { supabase, user } = await requireUser()

    // Find active cart and items
    const { data: cart, error: cartErr } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

  if (cartErr && cartErr.code !== 'PGRST116') throw cartErr

    if (!cart) {
      return NextResponse.json({ id: null, items: [], subtotal: 0, count: 0 })
    }

    const { data: items, error: itemsErr } = await supabase
      .from('cart_items')
      .select('id, artwork_id, unit_price, quantity, artwork:artworks!artwork_id(id, title, thumbnail_url, creator_id)')
      .eq('cart_id', cart.id)
      .order('created_at', { ascending: true })

    if (itemsErr) throw itemsErr

  const summary = toCartResponse((items as unknown as ItemRow[]) || [])
    return NextResponse.json({ id: cart.id, ...summary })
  } catch (e: unknown) {
    const message = typeof e === 'object' && e && 'message' in e ? String((e as { message?: string }).message || 'Failed to load cart') : 'Failed to load cart'
    return NextResponse.json({ error: message }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await requireUser()
    const body = await req.json().catch(() => ({}))
    const { artworkId, quantity = 1 } = body || {}
    if (!artworkId) return NextResponse.json({ error: 'artworkId is required' }, { status: 400 })

    // Ensure artwork exists and is available, capture current price
    const { data: artwork, error: artErr } = await supabase
      .from('artworks')
      .select('id, price, is_available')
      .eq('id', artworkId)
      .single()
    if (artErr) throw artErr
    if (!artwork.is_available) return NextResponse.json({ error: 'Artwork not available' }, { status: 400 })

    const cart = await getOrCreateActiveCart(supabase, user.id)

    // Try upsert: if item exists, increase quantity
    const { data: existingItems, error: existErr } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cart.id)
      .eq('artwork_id', artworkId)
    if (existErr) throw existErr

    if (existingItems && existingItems.length > 0) {
      const item = existingItems[0]
      const newQty = item.quantity + quantity
      const { error: updErr } = await supabase
        .from('cart_items')
        .update({ quantity: newQty })
        .eq('id', item.id)
      if (updErr) throw updErr
    } else {
      const { error: insErr } = await supabase
        .from('cart_items')
        .insert({ cart_id: cart.id, artwork_id: artworkId, quantity, unit_price: artwork.price ?? 0 })
      if (insErr) throw insErr
    }

    // Return updated cart
    const { data: items } = await supabase
      .from('cart_items')
      .select('id, artwork_id, unit_price, quantity, artwork:artworks!artwork_id(id, title, thumbnail_url, creator_id)')
      .eq('cart_id', cart.id)

  const summary = toCartResponse((items as unknown as ItemRow[]) || [])
    return NextResponse.json({ id: cart.id, ...summary })
  } catch (e: unknown) {
    const message = typeof e === 'object' && e && 'message' in e ? String((e as { message?: string }).message || 'Failed to add to cart') : 'Failed to add to cart'
    return NextResponse.json({ error: message }, { status: message === 'Not authenticated' ? 401 : 400 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { supabase } = await requireUser()
    const body = await req.json().catch(() => ({}))
    const { itemId, quantity } = body || {}
    if (!itemId || typeof quantity !== 'number' || quantity < 1) {
      return NextResponse.json({ error: 'itemId and valid quantity are required' }, { status: 400 })
    }

    const { error: updErr } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId)
    if (updErr) throw updErr

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const message = typeof e === 'object' && e && 'message' in e ? String((e as { message?: string }).message || 'Failed to update cart item') : 'Failed to update cart item'
    return NextResponse.json({ error: message }, { status: message === 'Not authenticated' ? 401 : 400 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { supabase } = await requireUser()
    const body = await req.json().catch(() => ({}))
    const { itemId } = body || {}
    if (!itemId) return NextResponse.json({ error: 'itemId is required' }, { status: 400 })

    const { error: delErr } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)
    if (delErr) throw delErr

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const message = typeof e === 'object' && e && 'message' in e ? String((e as { message?: string }).message || 'Failed to remove cart item') : 'Failed to remove cart item'
    return NextResponse.json({ error: message }, { status: message === 'Not authenticated' ? 401 : 400 })
  }
}
