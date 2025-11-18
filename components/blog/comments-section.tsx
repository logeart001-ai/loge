'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { OptimizedImage } from '@/components/optimized-image'
import { MessageCircle, Reply, Send } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase-client'

interface Comment {
  id: string
  content: string
  created_at: string
  user: {
    full_name: string
    avatar_url: string | null
  }
  replies?: Comment[]
}

interface CommentsSectionProps {
  postId: string
}

export function CommentsSection({ postId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    // Load comments
    loadComments()
  }, [postId])

  const loadComments = async () => {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('blog_comments')
        .select(`
          id,
          content,
          created_at,
          parent_id,
          user:user_profiles!user_id (
            full_name,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .eq('is_approved', true)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Organize comments into threads
      const commentMap = new Map()
      const rootComments: Comment[] = []

      data?.forEach((comment: any) => {
        const commentObj = {
          id: comment.id,
          content: comment.content,
          created_at: comment.created_at,
          user: comment.user,
          replies: []
        }
        
        commentMap.set(comment.id, commentObj)
        
        if (comment.parent_id) {
          const parent = commentMap.get(comment.parent_id)
          if (parent) {
            parent.replies.push(commentObj)
          }
        } else {
          rootComments.push(commentObj)
        }
      })

      setComments(rootComments)
    } catch (error) {
      console.error('Error loading comments:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      // Don't show error toast if table doesn't exist yet
      if (error && typeof error === 'object' && 'code' in error && error.code !== '42P01') {
        toast.error('Failed to load comments')
      }
    }
  }

  const handleSubmitComment = async () => {
    if (!user) {
      toast.error('Please sign in to comment')
      return
    }

    if (!newComment.trim()) {
      toast.error('Please enter a comment')
      return
    }

    try {
      setSubmitting(true)
      const supabase = createClient()

      const { error } = await supabase
        .from('blog_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment.trim()
        })

      if (error) throw error

      setNewComment('')
      toast.success('Comment posted successfully!')
      loadComments()
    } catch (error) {
      console.error('Error posting comment:', error)
      toast.error('Failed to post comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!user) {
      toast.error('Please sign in to reply')
      return
    }

    if (!replyContent.trim()) {
      toast.error('Please enter a reply')
      return
    }

    try {
      setSubmitting(true)
      const supabase = createClient()

      const { error } = await supabase
        .from('blog_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: replyContent.trim(),
          parent_id: parentId
        })

      if (error) throw error

      setReplyContent('')
      setReplyTo(null)
      toast.success('Reply posted successfully!')
      loadComments()
    } catch (error) {
      console.error('Error posting reply:', error)
      toast.error('Failed to post reply')
    } finally {
      setSubmitting(false)
    }
  }

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`${isReply ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
      <div className="flex items-start gap-3 mb-4">
        <OptimizedImage
          src={comment.user.avatar_url || "/image/Blog%20Author%20Avatars.png"}
          alt={comment.user.full_name}
          width={40}
          height={40}
          className="rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900">{comment.user.full_name}</span>
            <span className="text-sm text-gray-500">
              {new Date(comment.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="text-gray-700 mb-2">{comment.content}</p>
          {!isReply && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
              className="text-orange-600 hover:text-orange-700 p-0 h-auto"
            >
              <Reply className="w-4 h-4 mr-1" />
              Reply
            </Button>
          )}
        </div>
      </div>

      {/* Reply form */}
      {replyTo === comment.id && (
        <div className="ml-11 mb-4">
          <Textarea
            placeholder="Write a reply..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            className="mb-2"
            rows={3}
          />
          <div className="flex gap-2">
            <Button
              onClick={() => handleSubmitReply(comment.id)}
              disabled={submitting}
              size="sm"
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Send className="w-4 h-4 mr-2" />
              Reply
            </Button>
            <Button
              onClick={() => {
                setReplyTo(null)
                setReplyContent('')
              }}
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} isReply={true} />
          ))}
        </div>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-12">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <MessageCircle className="w-6 h-6" />
        Comments ({comments.length})
      </h3>

      {/* Comment form */}
      {user ? (
        <div className="mb-8 p-6 bg-gray-50 rounded-lg">
          <div className="flex items-start gap-3">
            <OptimizedImage
              src={user.user_metadata?.avatar_url || "/image/Blog%20Author%20Avatars.png"}
              alt={user.user_metadata?.full_name || 'Your avatar'}
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
            <div className="flex-1">
              <Textarea
                placeholder="Share your thoughts..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="mb-3"
                rows={4}
              />
              <Button
                onClick={handleSubmitComment}
                disabled={submitting || !newComment.trim()}
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Send className="w-4 h-4 mr-2" />
                Post Comment
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8 p-6 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-600 mb-4">Sign in to join the conversation</p>
          <Button asChild className="bg-orange-500 hover:bg-orange-600">
            <a href="/auth/signin">Sign In</a>
          </Button>
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-6">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        )}
      </div>
    </div>
  )
}