import * as React from "react"
import { cn } from "@/lib/utils"
import { OptimizedImage } from "@/components/optimized-image"
import { Badge } from "@/components/ui/badge"
import { Star } from "lucide-react"
import Link from "next/link"

interface ServerProductCardProps {
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
    reviewCount?: number
  }
  category?: string
  medium?: string
  dimensions?: string
  badges?: Array<{
    text: string
    variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  }>
  stockInfo?: string
  href: string
  className?: string
}

export function ServerProductCard({
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
  medium = "Oil on Canvas",
  dimensions = "60×80 cm",
  badges = [],
  stockInfo = "Only 9 vibes left",
  href,
  className
}: ServerProductCardProps) {
  // Calculate if we need extra space for content
  const hasOriginalPrice = !!originalPrice
  const hasDescription = !!description
  const hasCreatorRating = !!(creator?.rating)
  const needsExtraSpace = hasOriginalPrice || hasDescription || hasCreatorRating

  return (
    <div
      className={cn(
        "group bg-white rounded-2xl shadow-sm border border-gray-100",
        "hover:shadow-lg hover:border-gray-200 transition-all duration-300",
        "overflow-hidden flex flex-col",
        // Dynamic height adjustment based on content
        needsExtraSpace ? "min-h-[500px]" : "min-h-[460px]",
        className
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-50 flex-shrink-0">
        <Link href={href} className="block w-full h-full">
          <OptimizedImage
            src={imageUrl}
            alt={imageAlt || title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
        </Link>

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

      {/* Content Container - Flexible height */}
      <div className="flex flex-col flex-1 p-6 overflow-hidden min-h-0">
        {/* Main Content Area */}
        <div className="flex-1 space-y-4 overflow-hidden">
          {/* Title */}
          <Link href={href}>
            <h3 className="font-semibold text-gray-900 text-lg leading-tight line-clamp-2 group-hover:text-orange-600 transition-colors break-words">
              {title}
            </h3>
          </Link>

          {/* Category and Stock Info */}
          <div className="flex items-center justify-between">
            {category && (
              <Badge variant="secondary" className="text-xs">
                {category}
              </Badge>
            )}
            <div className="text-xs text-gray-500">
              {stockInfo}
            </div>
          </div>

          {/* Creator Info with Rating */}
          {creator && (
            <div className="space-y-2">
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
              </div>
              
              {creator.rating && (
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(creator.rating || 0)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {creator.rating.toFixed(1)} ({creator.reviewCount || Math.floor(Math.random() * 50) + 10} reviews)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Description - Only if provided */}
          {description && (
            <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
              {description}
            </p>
          )}

          {/* Medium and Dimensions */}
          <div className="text-sm text-gray-600">
            {medium} • {dimensions}
          </div>
        </div>

        {/* Price Section - Always at bottom */}
        <div className="mt-auto pt-4 space-y-3 border-t border-gray-100">
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

          {/* Action Buttons - Static for Server Component */}
          <div className="flex gap-3">
            <Link href={href} className="flex-1">
              <div className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium h-11 text-sm rounded-md flex items-center justify-center transition-colors">
                🛒 Add to Cart
              </div>
            </Link>
            <Link href={href} className="px-3">
              <div className="border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium h-11 w-11 rounded-md flex items-center justify-center transition-colors">
                📖
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}