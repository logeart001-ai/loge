import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { getMessages, getConversation, markMessagesAsRead } from '@/lib/message-actions'
import { ConversationClient } from '@/components/conversation-client'

async function ConversationContent({ conversationId }: { conversationId: string }) {
  const supabase = await createServerClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/auth/signin?redirectTo=/messages')
  }

  try {
    // Fetch conversation and messages
    const [conversation, messages] = await Promise.all([
      getConversation(conversationId),
      getMessages(conversationId),
    ])

    // Mark messages as read
    await markMessagesAsRead(conversationId)

    return (
      <ConversationClient
        initialMessages={messages}
        conversation={conversation}
        currentUserId={user.id}
      />
    )
  } catch (error) {
    console.error('Error loading conversation:', error)
    redirect('/messages')
  }
}

export default async function ConversationPage({
  params,
}: {
  params: Promise<Record<string, string | string[]>>
}) {
  const resolvedParams = await params
  const conversationId = Array.isArray(resolvedParams.conversationId)
    ? resolvedParams.conversationId[0]
    : resolvedParams.conversationId

  if (!conversationId) {
    redirect('/messages')
  }

  return (
    <div className="h-screen flex flex-col">
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading conversation...</p>
            </div>
          </div>
        }
      >
        <ConversationContent conversationId={conversationId} />
      </Suspense>
    </div>
  )
}
