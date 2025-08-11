'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toggleArtworkAvailability } from '@/lib/artwork-actions'
import { Eye, Edit, Trash2, MoreVertical } from 'lucide-react'
import Link from 'next/link'

interface ArtworkCardProps {
  artwork: any
  isCreatorView?: boolean
}

export function ArtworkCard({ artwork, isCreatorView = false }: ArtworkCardProps) {
  const [isAvailable, setIsAvailable] = useState(artwork.is_available)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleToggleAvailability = async () => {
    setIsUpdating(true)
    try {
      await toggleArtworkAvailability(artwork.id, !isAvailable)
      setIsAvailable(!isAvailable)
    } catch (error) {
      console.error('Failed to update availability:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-300">
      <CardContent className="p-0">
        {/* Image */}
        <div className="relative overflow-hidden">
          <img
            src={artwork.thumbnail_url || artwork.image_urls?.[0] || "/placeholder.svg?height=300&width=400&text=Artwork"}
            alt={artwork.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Overlay for creator view */}
          {isCreatorView && (
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-2">
                <Link href={`/dashboard/creator/artworks/${artwork.id}/edit`}>
                  <Button size="sm" variant="secondary">
                    <Edit className="w-4 h-4" />
                  </Button>
                </Link>
                <Button size="sm" variant="secondary">
                  <Eye className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Status badges */}
          <div className="absolute top-2 left-2 flex flex-col space-y-1">
            {artwork.is_featured && (
              <Badge className="bg-yellow-500 text-white text-xs">
                Featured
              </Badge>
            )}
            {artwork.is_limited_edition && (
              <Badge className="bg-purple-500 text-white text-xs">
                Limited Edition
              </Badge>
            )}
          </div>

          {/* Price badge */}
          <div className="absolute top-2 right-2">
            <Badge className="bg-white text-gray-900 font-semibold">
              ₦{artwork.price?.toLocaleString()}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
                {artwork.title}
              </h3>
              <p className="text-sm text-gray-600 capitalize">
                {artwork.category?.replace('_', ' ')}
              </p>
            </div>
          </div>

          {artwork.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {artwork.description}
            </p>
          )}

          {/* Tags */}
          {artwork.tags && artwork.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {artwork.tags.slice(0, 3).map((tag: string) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {artwork.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{artwork.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Stats and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Eye className="w-4 h-4" />
                <span>{artwork.views_count || 0}</span>
              </div>
              {artwork.stock_quantity && (
                <div>
                  Stock: {artwork.stock_quantity}
                </div>
              )}
            </div>

            {isCreatorView ? (
              <div className="flex items-center space-x-2">
                <Badge 
                  variant={isAvailable ? "default" : "secondary"}
                  className={isAvailable ? "bg-green-500" : "bg-gray-500"}
                >
                  {isAvailable ? 'Available' : 'Unavailable'}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleToggleAvailability}
                  disabled={isUpdating}
                >
                  {isUpdating ? '...' : (isAvailable ? 'Hide' : 'Show')}
                </Button>
              </div>
            ) : (
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                View Details
              </Button>
            )}
          </div>

          {/* Pricing */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-gray-900">
                ₦{artwork.price?.toLocaleString()}
              </span>
              {artwork.original_price && artwork.original_price > artwork.price && (
                <span className="text-sm text-gray-500 line-through">
                  ₦{artwork.original_price.toLocaleString()}
                </span>
              )}
            </div>
            
            {artwork.created_at && (
              <span className="text-xs text-gray-500">
                {new Date(artwork.created_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}