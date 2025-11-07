"use client"
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { getCart, addToCart, updateCartItem, removeCartItem, Cart } from '@/lib/cart'
import { useUser } from '@/lib/use-user'

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
  const { user, loading: userLoading } = useUser()

  const load = useCallback(async () => {
    // Only fetch cart if user is authenticated
    if (!user) {
      setCart(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const c = await getCart()
      setCart(c)
    } catch (e) {
      // Handle authentication errors gracefully
      const error = e as Error
      if (error.message?.includes('Not authenticated') || error.message?.includes('Unauthorized')) {
        console.log('User not authenticated, cart will remain empty')
        setCart(null)
      } else {
        console.error('Failed to load active cart', e)
        setCart(null)
      }
    } finally {
      setLoading(false)
    }
  }, [user])

  // Fetch cart only when user authentication status changes
  useEffect(() => {
    // Wait for user loading to complete before attempting to load cart
    if (!userLoading) {
      load()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userLoading]) // Only depend on user and userLoading, not load function

  const refresh = useCallback(async () => {
    // Only refresh cart if user is authenticated
    if (!user) {
      setCart(null)
      return
    }

    try {
      setRefreshing(true)
      const c = await getCart()
      setCart(c)
      console.log('Cart refreshed:', c)
    } catch (e) {
      // Handle authentication errors gracefully
      const error = e as Error
      if (error.message?.includes('Not authenticated') || error.message?.includes('Unauthorized')) {
        console.log('User not authenticated, cart will remain empty')
        setCart(null)
      } else {
        console.error('Failed to refresh cart', e)
        // On error, try to load fresh
        await load()
      }
    } finally {
      setRefreshing(false)
    }
  }, [load, user])

  const addItem = useCallback(async (artworkId: string, qty: number = 1) => {
    // Require authentication to add items
    if (!user) {
      console.warn('User must be logged in to add items to cart')
      alert('Please sign in to add items to your cart')
      return
    }

    try {
      await addToCart(artworkId, qty)
      // Refresh cart after adding
      const updated = await getCart()
      setCart(updated)
    } catch (e) {
      const error = e as Error
      if (error.message?.includes('Not authenticated') || error.message?.includes('Unauthorized')) {
        alert('Please sign in to add items to your cart')
      } else {
        console.error('Failed to add item to cart', e)
        alert('Failed to add item to cart. Please try again.')
      }
    }
  }, [user])

  const updateItem = useCallback(async (cartItemId: string, qty: number) => {
    // Require authentication to update items
    if (!user) {
      console.warn('User must be logged in to update cart items')
      return
    }

    try {
      await updateCartItem(cartItemId, qty)
      // Refresh cart after updating
      const updated = await getCart()
      setCart(updated)
    } catch (e) {
      console.error('Failed to update cart item', e)
    }
  }, [user])

  const removeItem = useCallback(async (cartItemId: string) => {
    // Require authentication to remove items
    if (!user) {
      console.warn('User must be logged in to remove cart items')
      return
    }

    try {
      await removeCartItem(cartItemId)
      // Refresh cart after removing
      const updated = await getCart()
      setCart(updated)
    } catch (e) {
      console.error('Failed to remove cart item', e)
    }
  }, [user])

  const clear = useCallback(async () => {
    // Require authentication to clear cart
    if (!user) {
      console.warn('User must be logged in to clear cart')
      return
    }

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
  }, [cart, user])

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
