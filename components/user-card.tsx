'use client'

import { UserAvatar } from '@/components/user-avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Star, Calendar, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface UserCardProps {
  user: {
    id: string
    full_name?: string | null
    avatar_url?: string | null
    email?: string
    role?: string
    bio?: string | null
    location?: string | null
    discipline?: string | null
    rating?: number
    is_verified?: boolean
    created_at?: string
    social_links?: {
      instagram?: string
      twitter?: string
      website?: string
    }
  }
  variant?: 'compact' | 'detailed'
  showActions?: boolean
}

export function UserCard({ user, variant = 'compact', showActions = true }: UserCardProps) {
  const getRoleBadge = (role?: string) => {
    const roleConfig = {
      admin: { color: 'bg-red-100 text-red-800', label: 'Admin' },
      creator: { color: 'bg-blue-100 text-blue-800', label: 'Creator' },
      collector: { color: 'bg-green-100 text-green-800', label: 'Collector' },
      buyer: { color: 'bg-gray-100 text-gray-800', label: 'Buyer' }
    }

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.buyer
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const formatJoinDate = (dateString?: string) => {
    if (!dateString) return 'Recently joined'
    const date = new Date(dateString)
    return `Joined ${date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
  }

  if (variant === 'compact') {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <UserAvatar user={user} size="md" />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-gray-900 truncate">
                  {user.full_name || user.email}
                </h3>
                {user.is_verified && (
                  <div className="text-blue-500" title="Verified">
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                {getRoleBadge(user.role)}
                {user.discipline && (
                  <span className="truncate">• {user.discipline}</span>
                )}
              </div>
            </div>

            {showActions && (
              <Link href={`/creator/${user.id}`}>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="text-center mb-4">
          <UserAvatar user={user} size="xl" className="mx-auto mb-3" />
          
          <div className="flex items-center justify-center space-x-2 mb-2">
            <h3 className="text-xl font-bold text-gray-900">
              {user.full_name || user.email}
            </h3>
            {user.is_verified && (
              <div className="text-blue-500" title="Verified">
                <Star className="w-5 h-5 fill-current" />
              </div>
            )}
          </div>

          <div className="flex items-center justify-center space-x-2 mb-3">
            {getRoleBadge(user.role)}
            {user.rating && user.rating > 0 && (
              <div className="flex items-center space-x-1 text-yellow-500">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-medium">{user.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>

        {user.bio && (
          <p className="text-gray-600 text-center mb-4 line-clamp-3">
            {user.bio}
          </p>
        )}

        <div className="space-y-2 text-sm text-gray-600">
          {user.discipline && (
            <div className="flex items-center space-x-2">
              <span className="font-medium">Discipline:</span>
              <span>{user.discipline}</span>
            </div>
          )}
          
          {user.location && (
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>{user.location}</span>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>{formatJoinDate(user.created_at)}</span>
          </div>
        </div>

        {user.social_links && (
          <div className="mt-4 flex justify-center space-x-2">
            {user.social_links.website && (
              <Button variant="outline" size="sm" asChild>
                <a href={user.social_links.website} target="_blank" rel="noopener noreferrer">
                  Website
                </a>
              </Button>
            )}
            {user.social_links.instagram && (
              <Button variant="outline" size="sm" asChild>
                <a href={`https://instagram.com/${user.social_links.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                  Instagram
                </a>
              </Button>
            )}
          </div>
        )}

        {showActions && (
          <div className="mt-4 flex space-x-2">
            <Button asChild className="flex-1">
              <Link href={`/creator/${user.id}`}>
                View Profile
              </Link>
            </Button>
            <Button variant="outline" className="flex-1">
              Follow
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}