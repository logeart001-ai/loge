'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Star,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Artwork {
  id: string
  title: string
  description: string | null
  category: string
  price: number
  currency: string
  thumbnail_url: string | null
  image_urls: string[]
  approval_status: string
  is_available: boolean
  is_featured: boolean
  created_at: string
  creator: {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
  }
}

export function ArtworksManagement() {
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [filter, setFilter] = useState('pending')
  const [reviewNotes, setReviewNotes] = useState('')
  const [setAsFeatured, setSetAsFeatured] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchArtworks()
  }, [filter])

  const fetchArtworks = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('artworks')
        .select(`
          id,
          title,
          description,
          category,
          price,
          currency,
          thumbnail_url,
          image_urls,
          approval_status,
          is_available,
          is_featured,
          created_at,
          creator:user_profiles!creator_id (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('approval_status', filter)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching artworks:', error)
        throw error
      }

      setArtworks(data || [])
    } catch (error) {
      console.error('Error in fetchArtworks:', error)
      setArtworks([])
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!selectedArtwork) return

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('artworks')
        .update({
          approval_status: 'approved',
          is_available: true,
          is_featured: setAsFeatured,
          approved_at: new Date().toISOString(),
          review_notes: reviewNotes
        })
        .eq('id', selectedArtwork.id)

      if (error) throw error

      alert(`Artwork approved successfully!${setAsFeatured ? ' It is now featured on the homepage.' : ''}`)
      setSelectedArtwork(null)
      setReviewNotes('')
      setSetAsFeatured(false)
      fetchArtworks()
    } catch (error) {
      console.error('Error approving artwork:', error)
      alert('Failed to approve artwork. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!selectedArtwork) return
    if (!reviewNotes.trim()) {
      alert('Please provide a reason for rejection')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('artworks')
        .update({
          approval_status: 'rejected',
          is_available: false,
          is_featured: false,
          review_notes: reviewNotes
        })
        .eq('id', selectedArtwork.id)

      if (error) throw error

      alert('Artwork rejected. Creator will be notified.')
      setSelectedArtwork(null)
      setReviewNotes('')
      fetchArtworks()
    } catch (error) {
      console.error('Error rejecting artwork:', error)
      alert('Failed to reject artwork. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const stats = {
    pending: artworks.filter(a => a.approval_status === 'pending').length,
    approved: artworks.filter(a => a.approval_status === 'approved').length,
    rejected: artworks.filter(a => a.approval_status === 'rejected').length,
    featured: artworks.filter(a => a.is_featured).length
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
          <h1 className="text-3xl font-bold text-gray-900">Artwork Management</h1>
          <p className="text-gray-600 mt-1">Review and approve creator uploads</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Featured</p>
                <p className="text-2xl font-bold text-orange-600">{stats.featured}</p>
              </div>
              <Star className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Artworks List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Artworks for Review</CardTitle>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="all">All Artworks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {artworks.map((artwork) => (
                  <div
                    key={artwork.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedArtwork?.id === artwork.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedArtwork(artwork)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-24 h-24 shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                        {artwork.thumbnail_url ? (
                          <Image
                            src={artwork.thumbnail_url}
                            alt={artwork.title}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 truncate">{artwork.title}</h3>
                          {getStatusBadge(artwork.approval_status)}
                          {artwork.is_featured && (
                            <Badge className="bg-orange-100 text-orange-800">
                              <Star className="w-3 h-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          by {artwork.creator.full_name} • {artwork.category}
                        </p>
                        {artwork.description && (
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {artwork.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>{new Date(artwork.created_at).toLocaleDateString()}</span>
                          <span>{artwork.currency} {artwork.price.toLocaleString()}</span>
                          {artwork.image_urls.length > 0 && (
                            <span>{artwork.image_urls.length} image{artwork.image_urls.length !== 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </div>
                      
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {artworks.length === 0 && (
                  <div className="text-center py-8">
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">No artworks found</p>
                    <p className="text-sm text-gray-500">
                      {filter === 'pending' 
                        ? 'No pending artworks to review' 
                        : 'Try adjusting your filter'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Review Panel */}
        <div>
          {selectedArtwork ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Review Artwork
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{selectedArtwork.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {selectedArtwork.description || 'No description provided'}
                  </p>

                  <div className="mb-4">
                    <Label className="text-sm font-medium">Creator</Label>
                    <p className="text-sm text-gray-700">{selectedArtwork.creator.full_name}</p>
                    <p className="text-xs text-gray-500">{selectedArtwork.creator.email}</p>
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Category</Label>
                      <p className="text-sm text-gray-700 capitalize">{selectedArtwork.category.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Price</Label>
                      <p className="text-sm text-gray-700">{selectedArtwork.currency} {selectedArtwork.price.toLocaleString()}</p>
                    </div>
                  </div>

                  {selectedArtwork.image_urls.length > 0 && (
                    <div className="mb-4">
                      <Label className="text-sm font-medium">Images ({selectedArtwork.image_urls.length})</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {selectedArtwork.image_urls.slice(0, 4).map((url, index) => (
                          <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                            <Image
                              src={url}
                              alt={`${selectedArtwork.title} - Image ${index + 1}`}
                              width={200}
                              height={200}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {selectedArtwork.approval_status === 'pending' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="review_notes">Review Notes</Label>
                      <Textarea
                        id="review_notes"
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="Add notes about this artwork..."
                        rows={4}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="set_featured"
                        checked={setAsFeatured}
                        onChange={(e) => setSetAsFeatured(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="set_featured" className="text-sm cursor-pointer">
                        Set as featured (will appear on homepage)
                      </Label>
                    </div>

                    <div className="space-y-2">
                      <Button
                        onClick={handleApprove}
                        disabled={submitting}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {submitting ? 'Approving...' : 'Approve & Publish'}
                      </Button>
                      
                      <Button
                        onClick={handleReject}
                        disabled={submitting}
                        variant="outline"
                        className="w-full border-red-600 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        {submitting ? 'Rejecting...' : 'Reject'}
                      </Button>
                    </div>
                  </div>
                )}

                {selectedArtwork.approval_status !== 'pending' && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {selectedArtwork.approval_status === 'approved' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className="font-medium">
                        {selectedArtwork.approval_status === 'approved' ? 'Approved' : 'Rejected'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      This artwork has already been reviewed.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Select an artwork to review</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
