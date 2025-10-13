'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, Heart, TrendingUp } from 'lucide-react'

interface ArtworkAnalyticsProps {
  artworkId: string
  className?: string
}

interface AnalyticsData {
  totalViews: number
  uniqueViews: number
  wishlistCount: number
  recentViews: number // views in last 7 days
}

export function ArtworkAnalytics({ artworkId, className }: ArtworkAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalViews: 0,
    uniqueViews: 0,
    wishlistCount: 0,
    recentViews: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchAnalytics()
  }, [artworkId])

  const fetchAnalytics = async () => {
    try {
      // Get total views
      const { count: totalViews } = await supabase
        .from('artwork_views')
        .select('*', { count: 'exact', head: true })
        .eq('artwork_id', artworkId)

      // Get unique views (distinct user_ids, including nulls for anonymous)
      const { data: uniqueViewsData } = await supabase
        .from('artwork_views')
        .select('user_id')
        .eq('artwork_id', artworkId)

      const uniqueUserIds = new Set(
        uniqueViewsData?.map(v => v.user_id || 'anonymous') || []
      )
      const uniqueViews = uniqueUserIds.size

      // Get wishlist count
      const { count: wishlistCount } = await supabase
        .from('wishlists')
        .select('*', { count: 'exact', head: true })
        .eq('artwork_id', artworkId)

      // Get recent views (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { count: recentViews } = await supabase
        .from('artwork_views')
        .select('*', { count: 'exact', head: true })
        .eq('artwork_id', artworkId)
        .gte('viewed_at', sevenDaysAgo.toISOString())

      setAnalytics({
        totalViews: totalViews || 0,
        uniqueViews,
        wishlistCount: wishlistCount || 0,
        recentViews: recentViews || 0
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-12"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const stats = [
    {
      title: 'Total Views',
      value: analytics.totalViews.toLocaleString(),
      icon: Eye,
      color: 'text-blue-600'
    },
    {
      title: 'Unique Viewers',
      value: analytics.uniqueViews.toLocaleString(),
      icon: TrendingUp,
      color: 'text-green-600'
    },
    {
      title: 'In Wishlists',
      value: analytics.wishlistCount.toLocaleString(),
      icon: Heart,
      color: 'text-red-600'
    },
    {
      title: 'Recent Views',
      value: analytics.recentViews.toLocaleString(),
      icon: Eye,
      color: 'text-purple-600',
      subtitle: 'Last 7 days'
    }
  ]

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            {stat.subtitle && (
              <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}