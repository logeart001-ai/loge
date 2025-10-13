'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send } from 'lucide-react'
import { sendMessage } from '@/lib/message-actions'
import { toast } from 'sonner'

interface MessageInputProps {
  conversationId: string
  receiverId: string
  orderId?: string
  artworkId?: string
  onMessageSent?: () => void
}

export function MessageInput({
  conversationId,
  receiverId,
  orderId,
  artworkId,
  onMessageSent,
}: MessageInputProps) {
  const [content, setContent] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      return
    }

    if (content.length > 5000) {
      toast.error('Message is too long (max 5000 characters)')
      return
    }

    startTransition(async () => {
      try {
        await sendMessage(conversationId, receiverId, content, orderId, artworkId)
        setContent('')
        onMessageSent?.()
        toast.success('Message sent')
      } catch (error) {
        console.error('Error sending message:', error)
        toast.error('Failed to send message. Please try again.')
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Ctrl+Enter or Cmd+Enter
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t bg-white p-4">
      <div className="flex gap-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message... (Ctrl+Enter to send)"
          className="resize-none min-h-[60px] max-h-[200px]"
          disabled={isPending}
          maxLength={5000}
        />
        <Button
          type="submit"
          disabled={isPending || !content.trim()}
          className="bg-orange-500 hover:bg-orange-600 self-end"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs text-gray-500">
          Press Ctrl+Enter to send
        </span>
        <span className="text-xs text-gray-500">
          {content.length}/5000
        </span>
      </div>
    </form>
  )
}
