import * as React from "react"
import { cn } from "@/lib/utils"
import { OptimizedImage } from "@/components/optimized-image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, Star, ShoppingCart, Bookmark } from "lucide-react"
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
      <div className="relative aspect-square overflow-hidden bg-gray-50 shrink-0">
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
            type="button"
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
            aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={isInWishlist ? 'true' : 'false'}
            title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className={cn("w-4 h-4", isInWishlist && "fill-current")} />
            <span className="sr-only">
              {isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            </span>
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
      <div className="flex flex-col flex-1 p-6 overflow-hidden min-h-0">
        {/* Header Section */}
        <div className="flex-1 space-y-4 overflow-hidden">
          {/* Title */}
          <Link href={href}>
            <h3 className="font-semibold text-gray-900 text-lg leading-tight line-clamp-2 group-hover:text-orange-600 transition-colors wrap-break-word">
              {title}
            </h3>
          </Link>

          {/* Category Badge */}
          {category && (
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">
                {category}
              </Badge>
              <div className="text-xs text-gray-500">
                Only 9 vibes left
              </div>
            </div>
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
                <div className="flex items-center gap-1 ml-auto">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < Math.floor(creator.rating || 0)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-600 ml-1">
                    {creator.rating.toFixed(1)} ({Math.floor(Math.random() * 50) + 10} reviews)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {description && (
            <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
              {description}
            </p>
          )}

          {/* Additional Details */}
          <div className="text-sm text-gray-600">
            Oil on Canvas • 60×80 cm
          </div>
        </div>

        {/* Price Section - Always at bottom with proper spacing */}
        <div className="mt-6 space-y-4">
          {/* Price Display - Current price first, slashed price below */}
          <div className="flex flex-col gap-1">
            <div className="font-bold text-lg text-gray-900">
              {currency}{price.toLocaleString()}
            </div>
            {originalPrice && (
              <div className="text-xs text-gray-500 line-through">
                {currency}{originalPrice.toLocaleString()}
              </div>
            )}
          </div>

          {/* Action Buttons - Properly contained */}
          <div className="flex gap-3">
            {onAddToCart && (
              <Button
                onClick={(e) => {
                  e.preventDefault()
                  onAddToCart()
                }}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium h-12"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart
              </Button>
            )}
            <Button
              variant="outline"
              className="px-4 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium h-12"
            >
              <Bookmark className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}