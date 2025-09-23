'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { useState } from 'react'
import { updateCartItem, removeCartItem } from '@/lib/cart'

export type CartRowItem = {
  id: string
  artwork_id: string
  unit_price: number
  quantity: number
  title: string
  thumbnail_url: string | null
}

export function CartRow({ item }: { item: CartRowItem }) {
  const [qty, setQty] = useState<number>(item.quantity)
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)

  const onUpdate = async (val: number) => {
    try {
      setSaving(true)
      setQty(val)
      await updateCartItem(item.id, val)
    } finally {
      setSaving(false)
    }
  }

  const onRemove = async () => {
    try {
      setRemoving(true)
      await removeCartItem(item.id)
      window.location.reload()
    } finally {
      setRemoving(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="relative w-20 h-20 bg-white rounded overflow-hidden">
          {item.thumbnail_url ? (
            <Image src={item.thumbnail_url} alt={item.title} fill className="object-contain" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
          )}
        </div>
        <div className="flex-1">
          <div className="font-medium text-gray-900">{item.title}</div>
          <div className="text-sm text-gray-600">₦{item.unit_price.toLocaleString()}</div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={saving || qty <= 1} onClick={() => onUpdate(qty - 1)}>-</Button>
          <span className="w-8 text-center">{qty}</span>
          <Button variant="outline" size="sm" disabled={saving} onClick={() => onUpdate(qty + 1)}>+</Button>
        </div>
        <div className="w-24 text-right font-semibold">₦{(item.unit_price * qty).toLocaleString()}</div>
        <Button variant="outline" size="sm" onClick={onRemove} disabled={removing}>Remove</Button>
      </CardContent>
    </Card>
  )
}
