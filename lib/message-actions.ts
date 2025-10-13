'use server'

import { createServerClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  receiver_id: string
  content: string
  order_id?: string | null
  artwork_id?: string | null
  is_read: boolean
  read_at?: string | null
  created_at: string
  sender?: {
    id: string
    full_name: string
    avatar_url: string | null
    is_verified: boolean
  }
  receiver?: {
    id: string
    full_name: string
    avatar_url: string | null
    is_verified: boolean
  }
}

export interface Conversation {
  id: string
  participant_1_id: string
  participant_2_id: string
  last_message: string | null
  last_message_at: string | null
  participant_1_unread_count: number
  participant_2_unread_count: number
  created_at: string
  updated_at: string
  participant_1?: {
    id: string
    full_name: string
    avatar_url: string | null
    is_verified: boolean
  }
  participant_2?: {
    id: string
    full_name: string
    avatar_url: string | null
    is_verified: boolean
  }
  other_user?: {
    id: string
    full_name: string
    avatar_url: string | null
    is_verified: boolean
  }
  unread_count?: number
}

/**
 * Get or create a conversation between two users
 */
export async function getOrCreateConversation(otherUserId: string) {
  const supabase = await createServerClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .rpc('get_or_create_conversation', {
      user1_id: user.id,
      user2_id: otherUserId
    })

  if (error) {
    console.error('Error getting/creating conversation:', error)
    throw new Error('Failed to get or create conversation')
  }

  return data as string // Returns conversation ID
}

/**
 * Get all conversations for the current user
 */
export async function getConversations() {
  const supabase = await createServerClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  // Get conversations where user is a participant
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('*')
    .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
    .order('last_message_at', { ascending: false, nullsFirst: false })

  if (error) {
    console.error('Error fetching conversations:', error)
    throw new Error('Failed to fetch conversations')
  }

  if (!conversations || conversations.length === 0) {
    return []
  }

  // Get user profiles for all participants
  const participantIds = new Set<string>()
  conversations.forEach(conv => {
    participantIds.add(conv.participant_1_id)
    participantIds.add(conv.participant_2_id)
  })

  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('id, full_name, avatar_url, is_verified')
    .in('id', Array.from(participantIds))

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError)
  }

  const profilesMap = new Map(profiles?.map(p => [p.id, p]) || [])

  // Enrich conversations with user data
  return conversations.map(conv => {
    const otherUserId = conv.participant_1_id === user.id ? conv.participant_2_id : conv.participant_1_id
    const unreadCount = conv.participant_1_id === user.id 
      ? conv.participant_1_unread_count 
      : conv.participant_2_unread_count

    return {
      ...conv,
      participant_1: profilesMap.get(conv.participant_1_id),
      participant_2: profilesMap.get(conv.participant_2_id),
      other_user: profilesMap.get(otherUserId),
      unread_count: unreadCount
    } as Conversation
  })
}

/**
 * Get messages for a conversation
 */
export async function getMessages(conversationId: string) {
  const supabase = await createServerClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching messages:', error)
    throw new Error('Failed to fetch messages')
  }

  if (!messages || messages.length === 0) {
    return []
  }

  // Get unique user IDs from messages
  const userIds = new Set<string>()
  messages.forEach(msg => {
    userIds.add(msg.sender_id)
    userIds.add(msg.receiver_id)
  })

  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('id, full_name, avatar_url, is_verified')
    .in('id', Array.from(userIds))

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError)
  }

  const profilesMap = new Map(profiles?.map(p => [p.id, p]) || [])

  // Enrich messages with user data
  return messages.map(msg => ({
    ...msg,
    sender: profilesMap.get(msg.sender_id),
    receiver: profilesMap.get(msg.receiver_id)
  })) as Message[]
}

/**
 * Send a message
 */
export async function sendMessage(
  conversationId: string,
  receiverId: string,
  content: string,
  orderId?: string,
  artworkId?: string
) {
  const supabase = await createServerClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  // Validate content
  if (!content.trim()) {
    throw new Error('Message content cannot be empty')
  }

  if (content.length > 5000) {
    throw new Error('Message is too long (max 5000 characters)')
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      receiver_id: receiverId,
      content: content.trim(),
      order_id: orderId || null,
      artwork_id: artworkId || null
    })
    .select()
    .single()

  if (error) {
    console.error('Error sending message:', error)
    throw new Error('Failed to send message')
  }

  revalidatePath('/messages')
  revalidatePath(`/messages/${conversationId}`)

  return data
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(conversationId: string) {
  const supabase = await createServerClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .rpc('mark_messages_as_read', {
      p_conversation_id: conversationId,
      p_user_id: user.id
    })

  if (error) {
    console.error('Error marking messages as read:', error)
    throw new Error('Failed to mark messages as read')
  }

  revalidatePath('/messages')
  revalidatePath(`/messages/${conversationId}`)

  return data
}

/**
 * Get unread message count for current user
 */
export async function getUnreadMessageCount() {
  const supabase = await createServerClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return 0
  }

  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('participant_1_id, participant_2_id, participant_1_unread_count, participant_2_unread_count')
    .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)

  if (error || !conversations) {
    return 0
  }

  const totalUnread = conversations.reduce((sum, conv) => {
    const unread = conv.participant_1_id === user.id 
      ? conv.participant_1_unread_count 
      : conv.participant_2_unread_count
    return sum + (unread || 0)
  }, 0)

  return totalUnread
}

/**
 * Get conversation details
 */
export async function getConversation(conversationId: string) {
  const supabase = await createServerClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  const { data: conversation, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single()

  if (error) {
    console.error('Error fetching conversation:', error)
    throw new Error('Failed to fetch conversation')
  }

  // Verify user is a participant
  if (conversation.participant_1_id !== user.id && conversation.participant_2_id !== user.id) {
    throw new Error('Not authorized to view this conversation')
  }

  // Get both user profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('id, full_name, avatar_url, is_verified')
    .in('id', [conversation.participant_1_id, conversation.participant_2_id])

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError)
  }

  const profilesMap = new Map(profiles?.map(p => [p.id, p]) || [])
  const otherUserId = conversation.participant_1_id === user.id 
    ? conversation.participant_2_id 
    : conversation.participant_1_id
  const unreadCount = conversation.participant_1_id === user.id 
    ? conversation.participant_1_unread_count 
    : conversation.participant_2_unread_count

  return {
    ...conversation,
    participant_1: profilesMap.get(conversation.participant_1_id),
    participant_2: profilesMap.get(conversation.participant_2_id),
    other_user: profilesMap.get(otherUserId),
    unread_count: unreadCount
  } as Conversation
}
