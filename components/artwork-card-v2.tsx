import * as React from "react"
import { ProductCard } from "@/components/ui/product-card"
import { WishlistButton } from "@/components/wishlist-button"

interface ArtworkCardProps {
  artwork: {
    id: string
    title: string
    description?: string
    price: number
    original_price?: number
    currency?: string
    thumbnail_url?: string
    image_urls?: string[]
    category?: string
    creator?: {
      id: string
      full_name?: string
      avatar_url?: string
      rating?: number
    }
    is_featured?: boolean
    is_on_sale?: boolean
    stock_quantity?: number
  }
  onAddToCart?: () => void
  className?: string
}

export function ArtworkCardV2({ artwork, onAddToCart, className }: ArtworkCardProps) {
  const badges = []
  
  // Add sale badge if on sale
  if (artwork.is_on_sale && artwork.original_price) {
    const discount = Math.round(((artwork.original_price - artwork.price) / artwork.original_price) * 100)
    badges.push({ text: `${discount}% OFF`, variant: 'destructive' as const })
  }
  
  // Add featured badge
  if (artwork.is_featured) {
    badges.push({ text: 'Featured', variant: 'default' as const })
  }
  
  // Add low stock warning
  if (artwork.stock_quantity && artwork.stock_quantity <= 5) {
    badges.push({ text: `Only ${artwork.stock_quantity} left`, variant: 'outline' as const })
  }

  const imageUrl = artwork.thumbnail_url || artwork.image_urls?.[0] || '/image/placeholder-artwork.jpg'
  
  return (
    <ProductCard
      id={artwork.id}
      title={artwork.title}
      description={artwork.description}
      price={artwork.price}
      originalPrice={artwork.original_price}
      currency={artwork.currency || "₦"}
      imageUrl={imageUrl}
      imageAlt={artwork.title}
      creator={artwork.creator ? {
        name: artwork.creator.full_name || 'Unknown Artist',
        avatar: artwork.creator.avatar_url,
        rating: artwork.creator.rating
      } : undefined}
      category={artwork.category?.replace('_', ' ')}
      badges={badges}
      href={`/art/${artwork.id}`}
      onAddToCart={onAddToCart}
      className={className}
    />
  )
}