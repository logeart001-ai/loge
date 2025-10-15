'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Flag, 
  Eye, 
  MessageSquare,
  Image as ImageIcon,
  FileText,
  Star
} from 'lucide-react'

interface ReportedContent {
  id: string
  content_type: 'artwork' | 'comment' | 'review' | 'message'
  content_id: string
  reporter_id: string
  reason: string
  description: string
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  created_at: string
  reporter: {
    full_name: string
    email: string
  }
  content_details?: {
    title?: string
    description?: string
    content?: string
    comment?: string
    rating?: number
    image_urls?: string[]
    creator?: { full_name: string }
    author?: { full_name: string }
    reviewer?: { full_name: string }
  }
}

interface ModerationAction {
  action: 'approve' | 'remove' | 'warn' | 'suspend_user'
  reason: string
  notes?: string
}

export function ContentModeration() {
  const [reports, setReports] = useState<ReportedContent[]>([])
  const [selectedReport, setSelectedReport] = useState<ReportedContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [filter, setFilter] = useState('pending')
  const [moderationAction, setModerationAction] = useState<ModerationAction>({
    action: 'approve',
    reason: '',
    notes: ''
  })
  const supabase = createClient()

  useEffect(() => {
    fetchReports()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const fetchReports = async () => {
    try {
      let query = supabase
        .from('content_reports')
        .select(`
          *,
          reporter:user_profiles!reporter_id (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error

      // Fetch content details for each report
      const enrichedReports = await Promise.all(
        (data || []).map(async (report) => {
          let contentDetails = null

          try {
            switch (report.content_type) {
              case 'artwork':
                const { data: artworkData } = await supabase
                  .from('artworks')
                  .select('title, description, image_urls, creator:user_profiles(full_name)')
                  .eq('id', report.content_id)
                  .single()
                contentDetails = artworkData
                break

              case 'comment':
                const { data: commentData } = await supabase
                  .from('comments')
                  .select('content, author:user_profiles(full_name)')
                  .eq('id', report.content_id)
                  .single()
                contentDetails = commentData
                break

              case 'review':
                const { data: reviewData } = await supabase
                  .from('reviews')
                  .select('comment, rating, reviewer:user_profiles(full_name)')
                  .eq('id', report.content_id)
                  .single()
                contentDetails = reviewData
                break
            }
          } catch (error) {
            console.error('Error fetching content details:', error)
          }

          return {
            ...report,
            content_details: contentDetails
          }
        })
      )

      setReports(enrichedReports)
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleModerationAction = async () => {
    if (!selectedReport) return

    setActionLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Update report status
      const { error: reportError } = await supabase
        .from('content_reports')
        .update({
          status: 'reviewed',
          moderator_id: user.id,
          moderation_action: moderationAction.action,
          moderation_reason: moderationAction.reason,
          moderation_notes: moderationAction.notes,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', selectedReport.id)

      if (reportError) throw reportError

      // Take action based on decision
      switch (moderationAction.action) {
        case 'remove':
          await removeContent(selectedReport)
          break
        case 'warn':
          await warnUser(selectedReport)
          break
        case 'suspend_user':
          await suspendUser(selectedReport)
          break
      }

      alert('Moderation action completed successfully')
      setSelectedReport(null)
      fetchReports()
    } catch (error) {
      console.error('Error taking moderation action:', error)
      alert('Failed to complete moderation action')
    } finally {
      setActionLoading(false)
    }
  }

  const removeContent = async (report: ReportedContent) => {
    // Mark content as removed/hidden
    const table = getTableName(report.content_type)
    if (table) {
      await supabase
        .from(table)
        .update({ is_removed: true, removal_reason: moderationAction.reason })
        .eq('id', report.content_id)
    }
  }

  const warnUser = async (report: ReportedContent) => {
    // Send warning notification to content creator
    const contentCreatorId = await getContentCreatorId(report)
    if (contentCreatorId) {
      await supabase
        .from('notifications')
        .insert({
          user_id: contentCreatorId,
          type: 'warning',
          title: 'Content Warning',
          message: `Your ${report.content_type} has received a warning: ${moderationAction.reason}`,
          data: {
            content_type: report.content_type,
            content_id: report.content_id,
            reason: moderationAction.reason
          }
        })
    }
  }

  const suspendUser = async (report: ReportedContent) => {
    const contentCreatorId = await getContentCreatorId(report)
    if (contentCreatorId) {
      await supabase
        .from('user_profiles')
        .update({ 
          status: 'suspended',
          suspension_reason: moderationAction.reason,
          suspended_at: new Date().toISOString()
        })
        .eq('id', contentCreatorId)
    }
  }

  const getTableName = (contentType: string) => {
    const tableMap = {
      artwork: 'artworks',
      comment: 'comments',
      review: 'reviews',
      message: 'messages'
    }
    return tableMap[contentType as keyof typeof tableMap]
  }

  const getContentCreatorId = async (report: ReportedContent) => {
    const table = getTableName(report.content_type)
    if (!table) return null

    const creatorField = report.content_type === 'artwork' ? 'creator_id' : 'user_id'
    const { data } = await supabase
      .from(table)
      .select(creatorField)
      .eq('id', report.content_id)
      .single()

    return data ? (data as Record<string, string>)[creatorField] : null
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      reviewed: { color: 'bg-blue-100 text-blue-800', label: 'Reviewed' },
      resolved: { color: 'bg-green-100 text-green-800', label: 'Resolved' },
      dismissed: { color: 'bg-gray-100 text-gray-800', label: 'Dismissed' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'artwork':
        return <ImageIcon className="w-4 h-4" />
      case 'comment':
        return <MessageSquare className="w-4 h-4" />
      case 'review':
        return <Star className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Content Moderation</h2>
          <p className="text-gray-600">Review reported content and take moderation actions</p>
        </div>
      </div>

      {/* Tabs for filtering */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="pending">Pending ({reports.filter(r => r.status === 'pending').length})</TabsTrigger>
          <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="all">All Reports</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getContentTypeIcon(report.content_type)}
                      <h3 className="font-semibold text-gray-900 capitalize">
                        {report.content_type} Report
                      </h3>
                      {getStatusBadge(report.status)}
                      <Badge variant="outline" className="text-red-600 border-red-200">
                        <Flag className="w-3 h-3 mr-1" />
                        {report.reason}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">
                      Reported by {report.reporter.full_name} • {new Date(report.created_at).toLocaleDateString()}
                    </p>

                    <p className="text-gray-700 mb-4">{report.description}</p>

                    {report.content_details && (
                      <div className="bg-gray-50 p-3 rounded-lg mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Reported Content:</h4>
                        {report.content_type === 'artwork' && (
                          <div>
                            <p className="font-medium">{report.content_details.title}</p>
                            <p className="text-sm text-gray-600">{report.content_details.description}</p>
                            <p className="text-xs text-gray-500">by {report.content_details.creator?.full_name}</p>
                          </div>
                        )}
                        {(report.content_type === 'comment' || report.content_type === 'review') && (
                          <div>
                            <p className="text-sm">{report.content_details.content || report.content_details.comment}</p>
                            <p className="text-xs text-gray-500">by {report.content_details.author?.full_name || report.content_details.reviewer?.full_name}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedReport(report)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Moderate Content Report</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="moderation-action">Moderation Action</Label>
                            <select
                              id="moderation-action"
                              aria-label="Select moderation action"
                              value={moderationAction.action}
                              onChange={(e) => setModerationAction(prev => ({ 
                                ...prev, 
                                action: e.target.value as ModerationAction['action']
                              }))}
                              className="w-full p-2 border rounded-md"
                            >
                              <option value="approve">Approve Content (Dismiss Report)</option>
                              <option value="remove">Remove Content</option>
                              <option value="warn">Warn Content Creator</option>
                              <option value="suspend_user">Suspend User</option>
                            </select>
                          </div>

                          <div>
                            <Label>Reason</Label>
                            <Textarea
                              value={moderationAction.reason}
                              onChange={(e) => setModerationAction(prev => ({ 
                                ...prev, 
                                reason: e.target.value 
                              }))}
                              placeholder="Explain the reason for this action..."
                              rows={3}
                            />
                          </div>

                          <div>
                            <Label>Additional Notes (Optional)</Label>
                            <Textarea
                              value={moderationAction.notes}
                              onChange={(e) => setModerationAction(prev => ({ 
                                ...prev, 
                                notes: e.target.value 
                              }))}
                              placeholder="Any additional notes for internal use..."
                              rows={2}
                            />
                          </div>

                          <div className="flex justify-end space-x-2">
                            <Button variant="outline">Cancel</Button>
                            <Button 
                              onClick={handleModerationAction}
                              disabled={actionLoading || !moderationAction.reason}
                            >
                              {actionLoading ? 'Processing...' : 'Take Action'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {reports.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Flag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reports Found</h3>
                <p className="text-gray-600">No content reports match the current filter.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}