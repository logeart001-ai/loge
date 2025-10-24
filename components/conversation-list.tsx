'use client'

import { Conversation } from '@/lib/message-actions'
import { formatDistanceToNow } from 'date-fns'
import { BadgeCheck, MessageCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

interface ConversationListProps {
  conversations: Conversation[]
  currentConversationId?: string
}

export function ConversationList({
  conversations,
  currentConversationId,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
        <MessageCircle className="w-16 h-16 mb-4 text-gray-300" />
        <p className="text-lg font-medium">No conversations yet</p>
        <p className="text-sm text-center mt-2">
          Start a conversation by visiting an artwork or creator profile
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-200">
      {conversations.map((conversation) => {
        const otherUser = conversation.other_user
        const isActive = conversation.id === currentConversationId
        const hasUnread = (conversation.unread_count || 0) > 0

        return (
          <Link
            key={conversation.id}
            href={`/messages/${conversation.id}`}
            className={`block hover:bg-gray-50 transition-colors ${
              isActive ? 'bg-orange-50' : ''
            }`}
          >
            <div className="p-4 flex gap-3">
              {/* Avatar */}
              <div className="shrink-0">
                {otherUser?.avatar_url ? (
                  <Image
                    src={otherUser.avatar_url}
                    alt={otherUser.full_name}
                    width={48}
                    height={48}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-600 font-medium text-lg">
                      {otherUser?.full_name?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                )}
              </div>

              {/* Conversation info */}
              <div className="flex-1 min-w-0">
                {/* Name and verification */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <span
                      className={`font-medium text-gray-900 truncate ${
                        hasUnread ? 'font-bold' : ''
                      }`}
                    >
                      {otherUser?.full_name || 'Unknown User'}
                    </span>
                    {otherUser?.is_verified && (
                      <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />
                    )}
                  </div>
                  {hasUnread && (
                    <Badge className="bg-orange-500 text-white text-xs">
                      {conversation.unread_count}
                    </Badge>
                  )}
                </div>

                {/* Last message */}
                <p
                  className={`text-sm text-gray-600 truncate ${
                    hasUnread ? 'font-semibold' : ''
                  }`}
                >
                  {conversation.last_message || 'No messages yet'}
                </p>

                {/* Timestamp */}
                {conversation.last_message_at && (
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(conversation.last_message_at), {
                      addSuffix: true,
                    })}
                  </p>
                )}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
