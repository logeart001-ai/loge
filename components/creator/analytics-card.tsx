'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, TrendingUp, Users, Calendar } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase'

interface AnalyticsData {
  total_views: number
  views_today: number
  views_this_week: number
  views_this_month: number
  trending_artworks: Array<{
    id: string
    title: string
    views: number
  }>
}

export function AnalyticsCard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const supabase = createBrowserClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) return

        // Get total views
        const { data: totalViews } = await supabase
          .rpc('get_creator_total_views', { creator_user_id: user.id })

        // Get artworks with view counts
        const { data: artworks } = await supabase
          .from('artworks')
          .select(`
            id,
            title,
            created_at
          `)
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false })

        if (!artworks) {
          setLoading(false)
          return
        }

        const artworkIds = artworks.map(a => a.id)

        // Get view counts for time periods
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

        const [todayResult, weekResult, monthResult] = await Promise.all([
          supabase
            .from('artwork_views')
            .select('id', { count: 'exact', head: true })
            .in('artwork_id', artworkIds)
            .gte('viewed_at', today),
          supabase
            .from('artwork_views')
            .select('id', { count: 'exact', head: true })
            .in('artwork_id', artworkIds)
            .gte('viewed_at', weekAgo),
          supabase
            .from('artwork_views')
            .select('id', { count: 'exact', head: true })
            .in('artwork_id', artworkIds)
            .gte('viewed_at', monthAgo),
        ])

        // Get trending artworks (most views this week)
        const { data: weeklyViews } = await supabase
          .from('artwork_views')
          .select('artwork_id')
          .in('artwork_id', artworkIds)
          .gte('viewed_at', weekAgo)

        const viewCounts = weeklyViews?.reduce((acc, view) => {
          acc[view.artwork_id] = (acc[view.artwork_id] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {}

        const trending = Object.entries(viewCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([id, views]) => ({
            id,
            title: artworks.find(a => a.id === id)?.title || 'Unknown',
            views,
          }))

        setAnalytics({
          total_views: totalViews || 0,
          views_today: todayResult.count || 0,
          views_this_week: weekResult.count || 0,
          views_this_month: monthResult.count || 0,
          trending_artworks: trending,
        })
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>Loading your performance metrics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>Unable to load analytics</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-brand-red" />
          Analytics Overview
        </CardTitle>
        <CardDescription>Your artwork performance metrics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* View Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Eye className="w-4 h-4" />
              <span className="text-sm">Total Views</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {analytics.total_views.toLocaleString()}
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Today</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {analytics.views_today.toLocaleString()}
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">This Week</span>
            </div>
            <div className="text-2xl font-bold text-green-900">
              {analytics.views_this_week.toLocaleString()}
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-purple-600 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-sm">This Month</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {analytics.views_this_month.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Trending Artworks */}
        {analytics.trending_artworks.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-red" />
              Trending This Week
            </h4>
            <div className="space-y-2">
              {analytics.trending_artworks.map((artwork, index) => (
                <div
                  key={artwork.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-red text-white flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                      {artwork.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm font-semibold">{artwork.views}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {analytics.trending_artworks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No views yet this week</p>
            <p className="text-xs mt-1">Share your artworks to get more visibility!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
