'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    Eye,
    Star,
    Users,
    BarChart3,
    AlertCircle,
    MessageSquare,
    Filter
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { NotificationCenter } from '@/components/notifications/notification-center'

interface Submission {
    id: string
    title: string
    description: string
    creator_type: string
    status: string
    submission_date: string
    price?: number
    currency: string
    cultural_reference?: string
    tagline?: string
    creator: {
        id: string
        full_name: string
        email: string
        discipline?: string
        avatar_url?: string
    }
    artist_details?: any
    writer_details?: any
    fashion_details?: any
    media_files?: unknown[]
}

interface ReviewData {
    status: 'approved' | 'rejected' | 'needs_revision'
    overall_score: number
    quality_score: number
    originality_score: number
    cultural_relevance_score: number
    feedback_text: string
    suggestions?: string
    rejection_reason?: string
}

export function AdminDashboard() {
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
    const [reviewData, setReviewData] = useState<ReviewData>({
        status: 'approved',
        overall_score: 5,
        quality_score: 5,
        originality_score: 5,
        cultural_relevance_score: 5,
        feedback_text: '',
        suggestions: '',
        rejection_reason: ''
    })
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [filter, setFilter] = useState('all')
    const [stats, setStats] = useState({
        total_submissions: 0,
        pending_review: 0,
        approved_today: 0,
        rejection_rate: 0
    })

    const supabase = createClient()

    useEffect(() => {
        fetchSubmissions()
    }, [filter])

    const fetchSubmissions = async () => {
        try {
            let query = supabase
                .from('project_submissions')
                .select(`
          *,
          creator:user_profiles!creator_id (
            id,
            full_name,
            email,
            discipline,
            avatar_url
          )
        `)
                .order('submission_date', { ascending: false })

            if (filter !== 'all') {
                query = query.eq('status', filter)
            }

            const { data: submissionsData, error } = await query

            if (error) throw error

            if (submissionsData) {
                // Fetch additional details for each submission
                const enrichedSubmissions = await Promise.all(
                    submissionsData.map(async (submission) => {
                        const enriched = { ...submission }

                        // Fetch type-specific details
                        if (submission.creator_type === 'artist') {
                            const { data: artistData } = await supabase
                                .from('artist_submissions')
                                .select('*')
                                .eq('submission_id', submission.id)
                                .single()
                            enriched.artist_details = artistData
                        } else if (submission.creator_type === 'writer') {
                            const { data: writerData } = await supabase
                                .from('writer_submissions')
                                .select('*')
                                .eq('submission_id', submission.id)
                                .single()
                            enriched.writer_details = writerData
                        } else if (submission.creator_type === 'fashion_designer') {
                            const { data: fashionData } = await supabase
                                .from('fashion_submissions')
                                .select('*')
                                .eq('submission_id', submission.id)
                                .single()
                            enriched.fashion_details = fashionData
                        }

                        // Fetch media files
                        const { data: mediaData } = await supabase
                            .from('submission_media')
                            .select('*')
                            .eq('submission_id', submission.id)
                            .order('display_order')
                        enriched.media_files = mediaData || []

                        return enriched
                    })
                )

                setSubmissions(enrichedSubmissions)

                // Calculate stats
                const totalSubmissions = enrichedSubmissions.length
                const pendingReview = enrichedSubmissions.filter(s =>
                    s.status === 'submitted' || s.status === 'under_review'
                ).length
                const approvedToday = enrichedSubmissions.filter(s =>
                    s.status === 'approved' &&
                    new Date(s.review_date || '').toDateString() === new Date().toDateString()
                ).length
                const rejectedCount = enrichedSubmissions.filter(s => s.status === 'rejected').length
                const rejectionRate = totalSubmissions > 0 ? (rejectedCount / totalSubmissions) * 100 : 0

                setStats({
                    total_submissions: totalSubmissions,
                    pending_review: pendingReview,
                    approved_today: approvedToday,
                    rejection_rate: Math.round(rejectionRate)
                })
            }
        } catch (error) {
            console.error('Error fetching submissions:', error)
        } finally {
            setLoading(false)
        }
    }

    const submitReview = async () => {
        if (!selectedSubmission) return

        setSubmitting(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // Create review record
            const { error: reviewError } = await supabase
                .from('submission_reviews')
                .insert({
                    submission_id: selectedSubmission.id,
                    reviewer_id: user.id,
                    status: reviewData.status,
                    overall_score: reviewData.overall_score,
                    quality_score: reviewData.quality_score,
                    originality_score: reviewData.originality_score,
                    cultural_relevance_score: reviewData.cultural_relevance_score,
                    feedback_text: reviewData.feedback_text,
                    suggestions: reviewData.suggestions,
                    rejection_reason: reviewData.rejection_reason
                })

            if (reviewError) throw reviewError

            // Update submission status
            const newStatus = reviewData.status === 'approved' ? 'published' : reviewData.status
            const { error: updateError } = await supabase
                .from('project_submissions')
                .update({
                    status: newStatus,
                    review_date: new Date().toISOString(),
                    reviewer_id: user.id,
                    review_notes: reviewData.feedback_text
                })
                .eq('id', selectedSubmission.id)

            if (updateError) throw updateError

            // If approved, create artwork/book/fashion item in main tables
            if (reviewData.status === 'approved') {
                await createMarketplaceItem(selectedSubmission)
            }

            // Send email notification to creator
            const { emailService } = await import('@/lib/email-service')
            await emailService.sendSubmissionStatusNotification(
                selectedSubmission.creator.email,
                reviewData.status,
                {
                    creatorName: selectedSubmission.creator.full_name,
                    submissionTitle: selectedSubmission.title,
                    submissionId: selectedSubmission.id,
                    reviewDate: new Date().toISOString(),
                    feedback: reviewData.feedback_text,
                    suggestions: reviewData.suggestions,
                    rejectionReason: reviewData.rejection_reason,
                    reviewerName: user.email || 'Loge Arts Team'
                }
            )

            alert('Review submitted successfully! Creator has been notified via email.')
            setSelectedSubmission(null)
            fetchSubmissions()
        } catch (error) {
            console.error('Error submitting review:', error)
            alert('Error submitting review')
        } finally {
            setSubmitting(false)
        }
    }

    const createMarketplaceItem = async (submission: Submission) => {
        try {
            if (submission.creator_type === 'artist') {
                await supabase
                    .from('artworks')
                    .insert({
                        creator_id: submission.creator_id,
                        title: submission.title,
                        description: submission.description,
                        category: submission.artist_details?.medium?.toLowerCase() || 'painting',
                        price: submission.price,
                        currency: submission.currency,
                        is_available: true,
                        is_featured: false,
                        thumbnail_url: submission.media_files?.[0]?.file_url,
                        image_urls: submission.media_files?.filter(m => m.file_type === 'image').map(m => m.file_url),
                        tags: submission.cultural_reference ? [submission.cultural_reference] : [],
                        dimensions: submission.artist_details?.dimensions,
                        materials: submission.artist_details?.materials
                    })
            }
            // TODO: Add similar logic for books and fashion items
        } catch (error) {
            console.error('Error creating marketplace item:', error)
        }
    }

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            submitted: { color: 'bg-blue-100 text-blue-800', label: 'Submitted' },
            under_review: { color: 'bg-yellow-100 text-yellow-800', label: 'Under Review' },
            approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
            published: { color: 'bg-green-100 text-green-800', label: 'Published' },
            rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
            needs_revision: { color: 'bg-orange-100 text-orange-800', label: 'Needs Revision' }
        }

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.submitted
        return <Badge className={config.color}>{config.label}</Badge>
    }

    const getCreatorTypeIcon = (type: string) => {
        switch (type) {
            case 'artist':
                return '🎨'
            case 'writer':
                return '📚'
            case 'fashion_designer':
                return '👗'
            default:
                return '📄'
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
                    <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-gray-600 mt-1">Review and manage creator submissions</p>
                </div>
                <div className="flex items-center gap-4">
                    <NotificationCenter />
                    <Button variant="outline" size="sm">
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                    </Button>
                </div>
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
                                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                                <p className="text-2xl font-bold text-yellow-600">{stats.pending_review}</p>
                            </div>
                            <Clock className="w-8 h-8 text-yellow-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Approved Today</p>
                                <p className="text-2xl font-bold text-green-600">{stats.approved_today}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Rejection Rate</p>
                                <p className="text-2xl font-bold text-red-600">{stats.rejection_rate}%</p>
                            </div>
                            <BarChart3 className="w-8 h-8 text-red-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Submissions List */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Submissions for Review</CardTitle>
                                <Select value={filter} onValueChange={setFilter}>
                                    <SelectTrigger className="w-48">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Submissions</SelectItem>
                                        <SelectItem value="submitted">Submitted</SelectItem>
                                        <SelectItem value="under_review">Under Review</SelectItem>
                                        <SelectItem value="approved">Approved</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {submissions.map((submission) => (
                                    <div
                                        key={submission.id}
                                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedSubmission?.id === submission.id
                                            ? 'border-orange-500 bg-orange-50'
                                            : 'border-gray-200 hover:bg-gray-50'
                                            }`}
                                        onClick={() => setSelectedSubmission(submission)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-lg">{getCreatorTypeIcon(submission.creator_type)}</span>
                                                    <h3 className="font-semibold text-gray-900">{submission.title}</h3>
                                                    {getStatusBadge(submission.status)}
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2">
                                                    by {submission.creator.full_name} • {submission.creator.discipline}
                                                </p>
                                                <p className="text-sm text-gray-700 line-clamp-2">
                                                    {submission.description}
                                                </p>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                    <span>Submitted {new Date(submission.submission_date).toLocaleDateString()}</span>
                                                    {submission.price && (
                                                        <span>{submission.currency} {submission.price.toLocaleString()}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm">
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                {submissions.length === 0 && (
                                    <div className="text-center py-8">
                                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600">No submissions found</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Review Panel */}
                <div>
                    {selectedSubmission ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5" />
                                    Review Submission
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">{selectedSubmission.title}</h3>
                                    <p className="text-sm text-gray-600 mb-4">{selectedSubmission.description}</p>

                                    {selectedSubmission.cultural_reference && (
                                        <div className="mb-4">
                                            <Label className="text-sm font-medium">Cultural Reference</Label>
                                            <p className="text-sm text-gray-700">{selectedSubmission.cultural_reference}</p>
                                        </div>
                                    )}

                                    {selectedSubmission.media_files && selectedSubmission.media_files.length > 0 && (
                                        <div className="mb-4">
                                            <Label className="text-sm font-medium">Media Files</Label>
                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                {selectedSubmission.media_files.slice(0, 4).map((file, index) => (
                                                    <div key={index} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                                                        {file.file_type === 'image' ? (
                                                            <img
                                                                src={file.file_url}
                                                                alt={file.caption || 'Submission media'}
                                                                className="w-full h-full object-cover rounded-lg"
                                                            />
                                                        ) : (
                                                            <FileText className="w-8 h-8 text-gray-400" />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="review_status">Review Decision</Label>
                                        <Select
                                            value={reviewData.status}
                                            onValueChange={(value) => setReviewData(prev => ({ ...prev, status: value as unknown }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="approved">Approve & Publish</SelectItem>
                                                <SelectItem value="needs_revision">Needs Revision</SelectItem>
                                                <SelectItem value="rejected">Reject</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="quality_score">Quality Score</Label>
                                            <Select
                                                value={reviewData.quality_score.toString()}
                                                onValueChange={(value) => setReviewData(prev => ({ ...prev, quality_score: parseInt(value) }))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {[1, 2, 3, 4, 5].map(score => (
                                                        <SelectItem key={score} value={score.toString()}>
                                                            {score} Star{score !== 1 ? 's' : ''}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label htmlFor="originality_score">Originality</Label>
                                            <Select
                                                value={reviewData.originality_score.toString()}
                                                onValueChange={(value) => setReviewData(prev => ({ ...prev, originality_score: parseInt(value) }))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {[1, 2, 3, 4, 5].map(score => (
                                                        <SelectItem key={score} value={score.toString()}>
                                                            {score} Star{score !== 1 ? 's' : ''}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="feedback_text">Feedback</Label>
                                        <Textarea
                                            id="feedback_text"
                                            value={reviewData.feedback_text}
                                            onChange={(e) => setReviewData(prev => ({ ...prev, feedback_text: e.target.value }))}
                                            placeholder="Provide detailed feedback for the creator..."
                                            rows={4}
                                        />
                                    </div>

                                    {reviewData.status === 'needs_revision' && (
                                        <div>
                                            <Label htmlFor="suggestions">Suggestions for Improvement</Label>
                                            <Textarea
                                                id="suggestions"
                                                value={reviewData.suggestions}
                                                onChange={(e) => setReviewData(prev => ({ ...prev, suggestions: e.target.value }))}
                                                placeholder="What changes would improve this submission?"
                                                rows={3}
                                            />
                                        </div>
                                    )}

                                    {reviewData.status === 'rejected' && (
                                        <div>
                                            <Label htmlFor="rejection_reason">Rejection Reason</Label>
                                            <Textarea
                                                id="rejection_reason"
                                                value={reviewData.rejection_reason}
                                                onChange={(e) => setReviewData(prev => ({ ...prev, rejection_reason: e.target.value }))}
                                                placeholder="Why is this submission being rejected?"
                                                rows={3}
                                            />
                                        </div>
                                    )}

                                    <Button
                                        onClick={submitReview}
                                        disabled={submitting || !reviewData.feedback_text}
                                        className="w-full"
                                    >
                                        {submitting ? 'Submitting Review...' : 'Submit Review'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="p-6 text-center">
                                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">Select a submission to review</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}