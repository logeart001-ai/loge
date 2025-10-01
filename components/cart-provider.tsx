"use client"
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { getCart, addToCart, updateCartItem, removeCartItem, Cart } from '@/lib/cart'

interface CartContextValue {
  cart: Cart | null
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
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const c = await getCart()
      setCart(c)
    } catch (e) {
      console.error('Failed to load active cart', e)
      setCart(null) // Set to null for unauthenticated users
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const refresh = useCallback(async () => {
    if (!cart) return load()
    try {
      setRefreshing(true)
      const c = await getCart()
      setCart(c)
    } catch (e) {
      console.error('Failed to refresh cart', e)
      setCart(null)
    } finally {
      setRefreshing(false)
    }
  }, [cart, load])

  const addItem = useCallback(async (artworkId: string, qty: number = 1) => {
    try {
      await addToCart(artworkId, qty)
      // Refresh cart after adding
      const updated = await getCart()
      setCart(updated)
    } catch (e) {
      console.error('Failed to add item to cart', e)
    }
  }, [])

  const updateItem = useCallback(async (cartItemId: string, qty: number) => {
    try {
      await updateCartItem(cartItemId, qty)
      // Refresh cart after updating
      const updated = await getCart()
      setCart(updated)
    } catch (e) {
      console.error('Failed to update cart item', e)
    }
  }, [])

  const removeItem = useCallback(async (cartItemId: string) => {
    try {
      await removeCartItem(cartItemId)
      // Refresh cart after removing
      const updated = await getCart()
      setCart(updated)
    } catch (e) {
      console.error('Failed to remove cart item', e)
    }
  }, [])

  const clear = useCallback(async () => {
    try {
      // Clear all items by removing them one by one
      if (cart?.items) {
        for (const item of cart.items) {
          await removeCartItem(item.id)
        }
      }
      // Refresh cart after clearing
      const updated = await getCart()
      setCart(updated)
    } catch (e) {
      console.error('Failed to clear cart', e)
    }
  }, [cart])

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
