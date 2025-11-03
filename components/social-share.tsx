'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Share2, 
  Facebook, 
  Twitter, 
  Linkedin, 
  MessageCircle,
  Mail,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react'

interface SocialShareProps {
  url: string
  title: string
  description?: string
  image?: string
  hashtags?: string[]
  showLabels?: boolean
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

export function SocialShare({ 
  url, 
  title, 
  description = '', 
  image = '',
  hashtags = [],
  showLabels = false,
  orientation = 'horizontal',
  className = ''
}: SocialShareProps) {
  const [copied, setCopied] = useState(false)

  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)
  const encodedDescription = encodeURIComponent(description)

  const shareLinks = {
    facebook: {
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`,
      icon: Facebook,
      label: 'Facebook',
      color: 'text-blue-600 hover:bg-blue-50'
    },
    twitter: {
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}&hashtags=${hashtags.join(',')}`,
      icon: Twitter,
      label: 'Twitter',
      color: 'text-blue-400 hover:bg-blue-50'
    },
    linkedin: {
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDescription}`,
      icon: Linkedin,
      label: 'LinkedIn',
      color: 'text-blue-700 hover:bg-blue-50'
    },
    whatsapp: {
      url: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      icon: MessageCircle,
      label: 'WhatsApp',
      color: 'text-green-600 hover:bg-green-50'
    },
    email: {
      url: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
      icon: Mail,
      label: 'Email',
      color: 'text-gray-600 hover:bg-gray-50'
    }
  }

  const handleShare = (platform: keyof typeof shareLinks) => {
    const shareUrl = shareLinks[platform].url
    
    if (platform === 'email') {
      window.location.href = shareUrl
    } else {
      window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes')
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url
        })
      } catch (err) {
        console.log('Native sharing cancelled or failed')
      }
    }
  }

  const containerClass = orientation === 'horizontal' 
    ? 'flex flex-wrap gap-2' 
    : 'flex flex-col gap-2'

  return (
    <div className={`${containerClass} ${className}`}>
      {/* Native Share (Mobile) */}
      {typeof navigator !== 'undefined' && navigator.share && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleNativeShare}
          className="flex items-center"
        >
          <Share2 className="w-4 h-4 mr-2" />
          {showLabels && 'Share'}
        </Button>
      )}

      {/* Social Media Buttons */}
      {Object.entries(shareLinks).map(([platform, config]) => {
        const Icon = config.icon
        return (
          <Button
            key={platform}
            variant="outline"
            size="sm"
            onClick={() => handleShare(platform as keyof typeof shareLinks)}
            className={`flex items-center ${config.color}`}
          >
            <Icon className="w-4 h-4 mr-2" />
            {showLabels && config.label}
          </Button>
        )
      })}

      {/* Copy Link Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyLink}
        className="flex items-center"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 mr-2 text-green-600" />
            {showLabels && 'Copied!'}
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 mr-2" />
            {showLabels && 'Copy Link'}
          </>
        )}
      </Button>
    </div>
  )
}

// Quick share component for floating action
export function QuickShare({ url, title, description }: { url: string, title: string, description?: string }) {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        className="rounded-full w-12 h-12 bg-orange-600 hover:bg-orange-700 shadow-lg"
        onClick={() => {
          if (navigator.share) {
            navigator.share({ title, text: description, url })
          } else {
            // Fallback to Twitter share
            window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank')
          }
        }}
      >
        <Share2 className="w-5 h-5" />
      </Button>
    </div>
  )
}