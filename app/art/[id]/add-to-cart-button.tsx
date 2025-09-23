'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { addToCart } from '@/lib/cart'
import { ShoppingCart } from 'lucide-react'

export function AddToCartButton({ artworkId }: { artworkId: string }) {
  const [loading, setLoading] = useState(false)
  const [added, setAdded] = useState(false)

  const onAdd = async () => {
    try {
      setLoading(true)
      await addToCart(artworkId, 1)
      setAdded(true)
      setTimeout(() => setAdded(false), 1500)
    } catch (e: unknown) {
      console.error(e)
      const message = typeof e === 'object' && e && 'message' in e ? String((e as { message?: string }).message || 'Failed to add to cart') : 'Failed to add to cart'
      alert(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={onAdd} disabled={loading} className="bg-orange-600 hover:bg-orange-700 flex items-center gap-2">
      <ShoppingCart className="w-4 h-4" />
      {loading ? 'Adding…' : added ? 'Added!' : 'Add to Cart'}
    </Button>
  )
}
