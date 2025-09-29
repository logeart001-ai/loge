"use client"
import React, { useState } from 'react'
import { useCart } from './cart-provider'
import { Button } from '@/components/ui/button'

interface AddToCartButtonProps {
  artworkId: string
  disabled?: boolean
  className?: string
}

export const AddToCartButton: React.FC<AddToCartButtonProps> = ({ artworkId, disabled, className }) => {
  const { addItem } = useCart()
  const [pending, setPending] = useState(false)

  const handleClick = async () => {
    if (pending) return
    setPending(true)
    try {
      await addItem(artworkId, 1)
    } finally {
      setPending(false)
    }
  }

  return (
    <Button onClick={handleClick} disabled={disabled || pending} className={className} size="sm">
      {pending ? 'Adding...' : 'Add to Cart'}
    </Button>
  )
}
