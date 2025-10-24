'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// Chart functionality can be added later with recharts or similar library

interface SocialMetrics {
  platform: string
  followers: number
  engagement: number
  posts: number
}

export function SocialAnalytics() {
  const [metrics, setMetrics] = useState<SocialMetrics[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSocialMetrics = async () => {
      try {
        // Mock data for social analytics
        const mockData: SocialMetrics[] = [
          { platform: 'Instagram', followers: 12500, engagement: 8.5, posts: 45 },
          { platform: 'Facebook', followers: 8200, engagement: 6.2, posts: 32 },
          { platform: 'Twitter', followers: 5800, engagement: 4.8, posts: 28 },
          { platform: 'LinkedIn', followers: 3200, engagement: 7.1, posts: 15 }
        ]
        
        setMetrics(mockData)
      } catch (error) {
        console.error('Error fetching social metrics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSocialMetrics()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Social Media Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Social Media Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric) => (
              <div key={metric.platform} className="text-center p-4 border rounded-lg">
                <h3 className="font-semibold text-lg">{metric.platform}</h3>
                <p className="text-2xl font-bold text-blue-600">{metric.followers.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Followers</p>
                <p className="text-sm text-green-600">{metric.engagement}% engagement</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Engagement Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.map((metric) => (
              <div key={metric.platform} className="flex justify-between items-center p-3 border rounded">
                <span className="font-medium">{metric.platform}</span>
                <div className="text-right">
                  <div className="text-sm text-gray-600">{metric.posts} posts</div>
                  <div className="text-green-600 font-semibold">{metric.engagement}% engagement</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}