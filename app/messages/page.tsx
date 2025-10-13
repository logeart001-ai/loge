import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { getConversations } from '@/lib/message-actions'
import { ConversationList } from '@/components/conversation-list'
import { MessageCircle } from 'lucide-react'

export const metadata = {
  title: 'Messages | L\'oge Arts',
  description: 'Your messages and conversations',
}

async function MessagesContent() {
  const supabase = await createServerClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/auth/signin?redirectTo=/messages')
  }

  const conversations = await getConversations()

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-orange-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
              <p className="text-sm text-gray-600 mt-1">
                {conversations.length === 0
                  ? 'No conversations yet'
                  : `${conversations.length} conversation${
                      conversations.length === 1 ? '' : 's'
                    }`}
              </p>
            </div>
          </div>
        </div>

        {/* Conversations list */}
        <div className="min-h-[400px]">
          <ConversationList conversations={conversations} />
        </div>
      </div>

      {/* Instructions */}
      {conversations.length === 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">
            How to start a conversation
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Visit an artwork page and click &quot;Message Seller&quot;</li>
            <li>• Go to a creator&apos;s profile and click &quot;Send Message&quot;</li>
            <li>• Contact sellers about orders from your purchase history</li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default function MessagesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <Suspense
        fallback={
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        }
      >
        <MessagesContent />
      </Suspense>
    </div>
  )
}
