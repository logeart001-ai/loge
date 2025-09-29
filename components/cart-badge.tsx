"use client"
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useCart } from './cart-provider'

export function CartBadge() {
  const { cart, loading } = useCart()
  const [count, setCount] = useState<number>(0)

  useEffect(() => {
    if (!loading) {
      setCount(cart?.itemCount || cart?.items.length || 0)
    }
  }, [cart, loading])

  return (
    <Link href="/cart" className="relative inline-flex items-center px-3 py-1 rounded-full bg-orange-600 text-white text-sm font-medium hover:bg-orange-500 transition">
      <span>Cart</span>
      <span className="ml-2 inline-flex items-center justify-center rounded-full bg-white text-orange-600 text-xs font-semibold w-5 h-5">
        {count}
      </span>
    </Link>
  )
}
