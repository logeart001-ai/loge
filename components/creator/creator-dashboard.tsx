'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  User, 
  FileText, 
  Upload, 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle,
  Plus,
  BarChart3,
  Settings
} from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Submission {
  id: string
  title: string
  creator_type: string
  status: string
  submission_date: string
  review_date?: string
  price?: number
  currency: string
  created_at: string
}

interface DashboardStats {
  total_submissions: number
  approved_submissions: number
  pending_submissions: number
  total_views: number
  total_earnings: number
}

export function CreatorDashboard() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    total_submissions: 0,
    approved_submissions: 0,
    pending_submissions: 0,
    total_views: 0,
    total_earnings: 0
  })
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)

      // Fetch submissions
      const { data: submissionsData } = await supabase
        .from('project_submissions')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })

      if (submissionsData) {
        setSubmissions(submissionsData)
        
        // Fetch view statistics for creator's artworks
        const { data: viewStats } = await supabase
          .rpc('get_creator_total_views', { creator_user_id: user.id })
        
        // Calculate stats
        const stats = {
          total_submissions: submissionsData.length,
          approved_submissions: submissionsData.filter(s => s.status === 'approved' || s.status === 'published').length,
          pending_submissions: submissionsData.filter(s => s.status === 'submitted' || s.status === 'under_review').length,
          total_views: viewStats || 0,
          total_earnings: submissionsData
            .filter(s => s.status === 'published')
            .reduce((sum, s) => sum + (s.price || 0), 0)
        }
        setStats(stats)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      submitted: { color: 'bg-blue-100 text-blue-800', label: 'Submitted' },
      under_review: { color: 'bg-yellow-100 text-yellow-800', label: 'Under Review' },
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
      published: { color: 'bg-green-100 text-green-800', label: 'Published' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
      needs_revision: { color: 'bg-orange-100 text-orange-800', label: 'Needs Revision' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'published':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'submitted':
      case 'under_review':
        return <Clock className="w-4 h-4 text-yellow-600" />
      default:
        return <FileText className="w-4 h-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Creator Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {profile?.full_name || 'Creator'}!
          </p>
        </div>
        <Button asChild>
          <a href="/dashboard/submissions/new" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Submission
          </a>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_submissions}</p>
              </div>
              <FileText className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved_submissions}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending_submissions}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total_views}</p>
              </div>
              <Eye className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="submissions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="submissions">My Submissions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        {/* Submissions Tab */}
        <TabsContent value="submissions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Submissions</span>
                <Button asChild size="sm">
                  <a href="/dashboard/submissions/new">
                    <Plus className="w-4 h-4 mr-2" />
                    New Submission
                  </a>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No submissions yet</h3>
                  <p className="text-gray-600 mb-4">
                    Start by submitting your first project for review
                  </p>
                  <Button asChild>
                    <a href="/dashboard/submissions/new">Create Your First Submission</a>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        {getStatusIcon(submission.status)}
                        <div>
                          <h3 className="font-semibold text-gray-900">{submission.title}</h3>
                          <p className="text-sm text-gray-600">
                            {submission.creator_type.replace('_', ' ')} • 
                            Submitted {new Date(submission.submission_date || submission.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {submission.price && (
                          <span className="text-sm font-medium text-gray-900">
                            {submission.currency} {submission.price.toLocaleString()}
                          </span>
                        )}
                        {getStatusBadge(submission.status)}
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Submission Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Approval Rate</span>
                    <span className="font-semibold">
                      {stats.total_submissions > 0 
                        ? Math.round((stats.approved_submissions / stats.total_submissions) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average Review Time</span>
                    <span className="font-semibold">3-5 days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Earnings</span>
                    <span className="font-semibold">₦{stats.total_earnings.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {submissions.slice(0, 5).map((submission) => (
                    <div key={submission.id} className="flex items-center gap-3 text-sm">
                      {getStatusIcon(submission.status)}
                      <span className="flex-1">
                        <span className="font-medium">{submission.title}</span> was {submission.status}
                      </span>
                      <span className="text-gray-500">
                        {new Date(submission.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Creator Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Full Name</label>
                    <p className="text-gray-900">{profile?.full_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-gray-900">{profile?.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Discipline</label>
                    <p className="text-gray-900">{profile?.discipline || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Location</label>
                    <p className="text-gray-900">{profile?.location || 'Not specified'}</p>
                  </div>
                </div>
                
                {profile?.artist_statement && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Artist Statement</label>
                    <p className="text-gray-900 mt-1">{profile.artist_statement}</p>
                  </div>
                )}

                <div className="pt-4">
                  <Button asChild>
                    <a href="/dashboard/profile/edit">
                      <Settings className="w-4 h-4 mr-2" />
                      Edit Profile
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}