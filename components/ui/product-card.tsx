import * as React from "react"
import { cn } from "@/lib/utils"
import { OptimizedImage } from "@/components/optimized-image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, Star } from "lucide-react"
import Link from "next/link"

interface ProductCardProps {
  id: string
  title: string
  description?: string
  price: number
  originalPrice?: number
  currency?: string
  imageUrl: string
  imageAlt?: string
  creator?: {
    name: string
    avatar?: string
    rating?: number
  }
  category?: string
  badges?: Array<{
    text: string
    variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  }>
  href: string
  onAddToCart?: () => void
  onToggleWishlist?: () => void
  isInWishlist?: boolean
  className?: string
}

export function ProductCard({
  id,
  title,
  description,
  price,
  originalPrice,
  currency = "₦",
  imageUrl,
  imageAlt,
  creator,
  category,
  badges = [],
  href,
  onAddToCart,
  onToggleWishlist,
  isInWishlist = false,
  className
}: ProductCardProps) {
  return (
    <div
      className={cn(
        "group bg-white rounded-2xl shadow-sm border border-gray-100",
        "hover:shadow-lg hover:border-gray-200 transition-all duration-300",
        "overflow-hidden flex flex-col h-full",
        className
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <Link href={href} className="block w-full h-full">
          <OptimizedImage
            src={imageUrl}
            alt={imageAlt || title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
        </Link>

        {/* Wishlist Button */}
        {onToggleWishlist && (
          <button
            onClick={(e) => {
              e.preventDefault()
              onToggleWishlist()
            }}
            className={cn(
              "absolute top-4 right-4 p-2 rounded-full transition-all duration-200",
              "bg-white/90 backdrop-blur-sm shadow-sm",
              "hover:bg-white hover:shadow-md",
              isInWishlist ? "text-red-500" : "text-gray-600 hover:text-red-500"
            )}
          >
            <Heart className={cn("w-4 h-4", isInWishlist && "fill-current")} />
          </button>
        )}

        {/* Badges */}
        {badges.length > 0 && (
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {badges.map((badge, index) => (
              <Badge
                key={index}
                variant={badge.variant || 'default'}
                className="text-xs font-medium"
              >
                {badge.text}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="flex flex-col flex-1 p-6">
        {/* Header Section */}
        <div className="flex-1 space-y-3">
          {/* Title and Price Row */}
          <div className="flex items-start justify-between gap-3">
            <Link href={href} className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-lg leading-tight line-clamp-2 group-hover:text-orange-600 transition-colors">
                {title}
              </h3>
            </Link>
            <div className="flex-shrink-0 text-right">
              <div className="font-bold text-lg text-gray-900">
                {currency}{price.toLocaleString()}
              </div>
              {originalPrice && (
                <div className="text-sm text-gray-500 line-through">
                  {currency}{originalPrice.toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {description && (
            <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
              {description}
            </p>
          )}

          {/* Creator Info */}
          {creator && (
            <div className="flex items-center gap-2">
              {creator.avatar && (
                <OptimizedImage
                  src={creator.avatar}
                  alt={creator.name}
                  width={20}
                  height={20}
                  className="rounded-full object-cover"
                />
              )}
              <span className="text-sm text-gray-600">by {creator.name}</span>
              {creator.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                  <span className="text-xs text-gray-600">{creator.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          )}

          {/* Category and Additional Info */}
          <div className="flex items-center justify-between">
            {category && (
              <Badge variant="secondary" className="text-xs">
                {category}
              </Badge>
            )}
            <div className="text-xs text-gray-500">
              Only 9 vibes left
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
          {onAddToCart && (
            <Button
              onClick={(e) => {
                e.preventDefault()
                onAddToCart()
              }}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium"
            >
              Add to Cart
            </Button>
          )}
          <Button
            variant="outline"
            className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
          >
            Bookmark
          </Button>
        </div>
      </div>
    </div>
  )
}