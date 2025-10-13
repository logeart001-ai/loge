'use client'

import { useEffect, useRef } from 'react'
import { Message } from '@/lib/message-actions'
import { formatDistanceToNow } from 'date-fns'
import { BadgeCheck } from 'lucide-react'
import Image from 'next/image'

interface MessageListProps {
  messages: Message[]
  currentUserId: string
}

export function MessageList({ messages, currentUserId }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <p className="text-lg font-medium">No messages yet</p>
          <p className="text-sm">Start the conversation by sending a message below</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => {
        const isSent = message.sender_id === currentUserId
        const user = isSent ? message.sender : message.receiver

        return (
          <div
            key={message.id}
            className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex gap-3 max-w-[70%] ${
                isSent ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                {user?.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={user.full_name}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-600 font-medium">
                      {user?.full_name?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                )}
              </div>

              {/* Message content */}
              <div className="flex flex-col">
                {/* Sender name and verification */}
                {!isSent && (
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {user?.full_name}
                    </span>
                    {user?.is_verified && (
                      <BadgeCheck className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                )}

                {/* Message bubble */}
                <div
                  className={`rounded-2xl px-4 py-2 ${
                    isSent
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                </div>

                {/* Timestamp and read status */}
                <div
                  className={`flex items-center gap-2 mt-1 text-xs text-gray-500 ${
                    isSent ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <span>
                    {formatDistanceToNow(new Date(message.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                  {isSent && (
                    <span>
                      {message.is_read ? '✓✓ Read' : '✓ Sent'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
      <div ref={messagesEndRef} />
    </div>
  )
}
