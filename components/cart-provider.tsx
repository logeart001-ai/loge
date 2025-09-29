"use client"
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { getActiveCart, addItemToCart, updateCartItemQuantity, removeCartItem, clearCart, ActiveCart } from '@/lib/supabase-queries'

interface CartContextValue {
  cart: ActiveCart | null
  loading: boolean
  refreshing: boolean
  addItem: (artworkId: string, qty?: number) => Promise<void>
  updateItem: (cartItemId: string, qty: number) => Promise<void>
  removeItem: (cartItemId: string) => Promise<void>
  clear: () => Promise<void>
  refresh: () => Promise<void>
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<ActiveCart | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const c = await getActiveCart()
      setCart(c)
    } catch (e) {
      console.error('Failed to load active cart', e)
      setCart(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const refresh = useCallback(async () => {
    if (!cart) return load()
    try {
      setRefreshing(true)
      const c = await getActiveCart()
      setCart(c)
    } catch (e) {
      console.error('Failed to refresh cart', e)
    } finally {
      setRefreshing(false)
    }
  }, [cart, load])

  const addItem = useCallback(async (artworkId: string, qty: number = 1) => {
    try {
      const updated = await addItemToCart(artworkId, qty)
      setCart(updated)
    } catch (e) {
      console.error('Failed to add item to cart', e)
    }
  }, [])

  const updateItem = useCallback(async (cartItemId: string, qty: number) => {
    try {
      const updated = await updateCartItemQuantity(cartItemId, qty)
      setCart(updated)
    } catch (e) {
      console.error('Failed to update cart item', e)
    }
  }, [])

  const removeItem = useCallback(async (cartItemId: string) => {
    try {
      const updated = await removeCartItem(cartItemId)
      setCart(updated)
    } catch (e) {
      console.error('Failed to remove cart item', e)
    }
  }, [])

  const clear = useCallback(async () => {
    try {
      const updated = await clearCart()
      setCart(updated)
    } catch (e) {
      console.error('Failed to clear cart', e)
    }
  }, [])

  return (
    <CartContext.Provider value={{ cart, loading, refreshing, addItem, updateItem, removeItem, clear, refresh }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
