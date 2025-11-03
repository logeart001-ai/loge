'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  Share2, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram, 
  MessageCircle,
  Mail,
  Copy,
  Check
} from 'lucide-react'

interface ShareButtonProps {
  url: string
  title: string
  description?: string
  image?: string
  hashtags?: string[]
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

export function ShareButton({ 
  url, 
  title, 
  description = '', 
  image = '',
  hashtags = [],
  className = '',
  variant = 'outline',
  size = 'sm'
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)
  const encodedDescription = encodeURIComponent(description)
  const encodedImage = encodeURIComponent(image)
  const hashtagString = hashtags.map(tag => `#${tag}`).join(' ')
  const encodedHashtags = encodeURIComponent(hashtagString)

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}&hashtags=${hashtags.join(',')}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDescription}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
  }

  const handleShare = (platform: keyof typeof shareLinks) => {
    const shareUrl = shareLinks[platform]
    
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {/* Native Share (Mobile) */}
        {typeof navigator !== 'undefined' && navigator.share && (
          <DropdownMenuItem onClick={handleNativeShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Share...
          </DropdownMenuItem>
        )}
        
        {/* Social Media Platforms */}
        <DropdownMenuItem onClick={() => handleShare('facebook')}>
          <Facebook className="w-4 h-4 mr-2 text-blue-600" />
          Facebook
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleShare('twitter')}>
          <Twitter className="w-4 h-4 mr-2 text-blue-400" />
          Twitter
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleShare('linkedin')}>
          <Linkedin className="w-4 h-4 mr-2 text-blue-700" />
          LinkedIn
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleShare('whatsapp')}>
          <MessageCircle className="w-4 h-4 mr-2 text-green-600" />
          WhatsApp
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleShare('telegram')}>
          <MessageCircle className="w-4 h-4 mr-2 text-blue-500" />
          Telegram
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleShare('email')}>
          <Mail className="w-4 h-4 mr-2 text-gray-600" />
          Email
        </DropdownMenuItem>
        
        {/* Copy Link */}
        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2 text-green-600" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Convenience component for event sharing
interface EventShareButtonProps {
  event: {
    id: string
    title: string
    description?: string | null
    event_date?: string | null
    city?: string | null
    country?: string | null
    venue_name?: string | null
    image_url?: string | null
    event_type: string
  }
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

export function EventShareButton({ event, className, variant, size }: EventShareButtonProps) {
  const eventUrl = `${window.location.origin}/events/${event.id}`
  const eventDate = event.event_date ? new Date(event.event_date).toLocaleDateString() : ''
  const location = [event.venue_name, event.city, event.country].filter(Boolean).join(', ')
  
  const shareTitle = `${event.title} - African Cultural Event`
  const shareDescription = `Join us for ${event.title}${eventDate ? ` on ${eventDate}` : ''}${location ? ` at ${location}` : ''}. ${event.description || 'Discover amazing African cultural experiences!'}`
  
  const hashtags = [
    'AfricanCulture',
    'Events',
    event.event_type.replace('_', ''),
    event.city?.replace(/\s+/g, '') || 'Africa'
  ]

  return (
    <ShareButton
      url={eventUrl}
      title={shareTitle}
      description={shareDescription}
      image={event.image_url || ''}
      hashtags={hashtags}
      className={className}
      variant={variant}
      size={size}
    />
  )
}