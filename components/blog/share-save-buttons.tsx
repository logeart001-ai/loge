'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Share2, Heart, Check, Copy, Facebook, Twitter, Linkedin } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { saveArticle, unsaveArticle, checkIfArticleSaved } from '@/lib/blog-actions'

interface ShareSaveButtonsProps {
  title: string
  slug: string
  excerpt?: string
  postId: string
  initialSaved?: boolean
}

export function ShareSaveButtons({ title, slug, excerpt, postId, initialSaved = false }: ShareSaveButtonsProps) {
  const [isSaved, setIsSaved] = useState(initialSaved)
  const [isSharing, setIsSharing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [canShare, setCanShare] = useState(false)

  const currentUrl = typeof window !== 'undefined' ? `${window.location.origin}/blog/${slug}` : ''
  const shareText = `${title} - ${excerpt || 'Check out this article on L\'oge Arts'}`

  useEffect(() => {
    // Check if native sharing is available
    setCanShare(typeof window !== 'undefined' && 'share' in navigator)
  }, [])

  useEffect(() => {
    // Check if article is saved when component mounts
    const checkSaved = async () => {
      const { isSaved: saved } = await checkIfArticleSaved(postId)
      setIsSaved(saved)
    }
    checkSaved()
  }, [postId])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      if (isSaved) {
        const result = await unsaveArticle(postId)
        if (result.success) {
          setIsSaved(false)
          toast.success('Article removed from saved')
        } else {
          toast.error(result.error || 'Failed to unsave article')
        }
      } else {
        const result = await saveArticle(postId)
        if (result.success) {
          setIsSaved(true)
          toast.success('Article saved successfully!')
        } else {
          if (result.error === 'Article already saved') {
            setIsSaved(true)
            toast.info('Article is already saved')
          } else if (result.error === 'User not authenticated') {
            toast.error('Please sign in to save articles')
          } else {
            toast.error(result.error || 'Failed to save article')
          }
        }
      }
    } catch (error) {
      toast.error('Failed to save article')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl)
      toast.success('Link copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const handleNativeShare = async () => {
    if (canShare && navigator.share) {
      try {
        setIsSharing(true)
        await navigator.share({
          title,
          text: shareText,
          url: currentUrl,
        })
      } catch (error) {
        // User cancelled sharing
      } finally {
        setIsSharing(false)
      }
    }
  }

  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isSharing}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {canShare && (
            <DropdownMenuItem onClick={handleNativeShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Share via...
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleCopyLink}>
            <Copy className="w-4 h-4 mr-2" />
            Copy link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => window.open(shareUrls.twitter, '_blank')}>
            <Twitter className="w-4 h-4 mr-2" />
            Share on Twitter
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => window.open(shareUrls.facebook, '_blank')}>
            <Facebook className="w-4 h-4 mr-2" />
            Share on Facebook
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => window.open(shareUrls.linkedin, '_blank')}>
            <Linkedin className="w-4 h-4 mr-2" />
            Share on LinkedIn
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
        {isSaved ? (
          <>
            <Check className="w-4 h-4 mr-2 text-green-600" />
            Saved
          </>
        ) : (
          <>
            <Heart className="w-4 h-4 mr-2" />
            Save
          </>
        )}
      </Button>
    </div>
  )
}