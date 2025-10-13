'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Message, Conversation } from '@/lib/message-actions'
import { MessageList } from '@/components/message-list'
import { MessageInput } from '@/components/message-input'
import { Button } from '@/components/ui/button'
import { ArrowLeft, BadgeCheck } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'

interface ConversationClientProps {
  initialMessages: Message[]
  conversation: Conversation
  currentUserId: string
}

export function ConversationClient({
  initialMessages,
  conversation,
  currentUserId,
}: ConversationClientProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const router = useRouter()
  const supabase = createClient()
  const otherUser = conversation.other_user

  // Set up real-time subscription for new messages
  useEffect(() => {
    const channel = supabase
      .channel(`conversation:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message
          setMessages((current) => [...current, newMessage])
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversation.id, supabase, router])

  const handleMessageSent = () => {
    router.refresh()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-white px-4 py-3 flex items-center gap-3">
        <Link href="/messages">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>

        {/* Other user info */}
        <div className="flex items-center gap-3 flex-1">
          {otherUser?.avatar_url ? (
            <Image
              src={otherUser.avatar_url}
              alt={otherUser.full_name}
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-600 font-medium">
                {otherUser?.full_name?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
          )}
          <div>
            <div className="flex items-center gap-1">
              <span className="font-medium text-gray-900">
                {otherUser?.full_name || 'Unknown User'}
              </span>
              {otherUser?.is_verified && (
                <BadgeCheck className="w-4 h-4 text-blue-500" />
              )}
            </div>
            <span className="text-xs text-gray-500">Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden bg-gray-50">
        <MessageList messages={messages} currentUserId={currentUserId} />
      </div>

      {/* Input */}
      <MessageInput
        conversationId={conversation.id}
        receiverId={
          conversation.participant_1_id === currentUserId
            ? conversation.participant_2_id
            : conversation.participant_1_id
        }
        onMessageSent={handleMessageSent}
      />
    </div>
  )
}
