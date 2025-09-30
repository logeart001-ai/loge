import { createClient } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface NotificationEvent {
  id: string
  type: 'submission_update' | 'new_order' | 'payment_received' | 'review_completed'
  title: string
  message: string
  data?: any
  timestamp: string
  read: boolean
}

export class RealtimeService {
  private supabase = createClient()
  private channels: Map<string, RealtimeChannel> = new Map()
  private listeners: Map<string, Set<(event: NotificationEvent) => void>> = new Map()

  /**
   * Subscribe to real-time notifications for a user
   */
  subscribeToUserNotifications(
    userId: string,
    callback: (event: NotificationEvent) => void
  ): () => void {
    const channelName = `user_notifications:${userId}`
    
    // Add callback to listeners
    if (!this.listeners.has(channelName)) {
      this.listeners.set(channelName, new Set())
    }
    this.listeners.get(channelName)!.add(callback)

    // Create channel if it doesn't exist
    if (!this.channels.has(channelName)) {
      const channel = this.supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'real_time_notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            const notification: NotificationEvent = {
              id: payload.new.id,
              type: payload.new.type,
              title: payload.new.title,
              message: payload.new.message,
              data: payload.new.data,
              timestamp: payload.new.created_at,
              read: false
            }
            
            // Notify all listeners
            this.listeners.get(channelName)?.forEach(listener => {
              listener(notification)
            })
          }
        )
        .subscribe()

      this.channels.set(channelName, channel)
    }

    // Return unsubscribe function
    return () => {
      this.listeners.get(channelName)?.delete(callback)
      
      // If no more listeners, unsubscribe from channel
      if (this.listeners.get(channelName)?.size === 0) {
        this.channels.get(channelName)?.unsubscribe()
        this.channels.delete(channelName)
        this.listeners.delete(channelName)
      }
    }
  }

  /**
   * Subscribe to submission status changes
   */
  subscribeToSubmissionUpdates(
    creatorId: string,
    callback: (submission: any) => void
  ): () => void {
    const channelName = `submission_updates:${creatorId}`
    
    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'project_submissions',
          filter: `creator_id=eq.${creatorId}`
        },
        (payload) => {
          callback(payload.new)
        }
      )
      .subscribe()

    this.channels.set(channelName, channel)

    return () => {
      channel.unsubscribe()
      this.channels.delete(channelName)
    }
  }

  /**
   * Subscribe to new orders for creators
   */
  subscribeToNewOrders(
    sellerId: string,
    callback: (order: any) => void
  ): () => void {
    const channelName = `new_orders:${sellerId}`
    
    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `seller_id=eq.${sellerId}`
        },
        (payload) => {
          callback(payload.new)
        }
      )
      .subscribe()

    this.channels.set(channelName, channel)

    return () => {
      channel.unsubscribe()
      this.channels.delete(channelName)
    }
  }

  /**
   * Subscribe to admin notifications (new submissions, etc.)
   */
  subscribeToAdminNotifications(
    callback: (event: any) => void
  ): () => void {
    const channelName = 'admin_notifications'
    
    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_submissions'
        },
        (payload) => {
          if (payload.new.status === 'submitted') {
            callback({
              type: 'new_submission',
              data: payload.new
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          callback({
            type: 'new_order',
            data: payload.new
          })
        }
      )
      .subscribe()

    this.channels.set(channelName, channel)

    return () => {
      channel.unsubscribe()
      this.channels.delete(channelName)
    }
  }

  /**
   * Send real-time notification to user
   */
  async sendNotification(
    userId: string,
    type: NotificationEvent['type'],
    title: string,
    message: string,
    data?: any
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('real_time_notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          data,
          read: false
        })

      return !error
    } catch (error) {
      console.error('Error sending notification:', error)
      return false
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('real_time_notifications')
        .update({ read: true })
        .eq('id', notificationId)

      return !error
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return false
    }
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('real_time_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false)

      return error ? 0 : (count || 0)
    } catch (error) {
      console.error('Error getting unread count:', error)
      return 0
    }
  }

  /**
   * Get recent notifications
   */
  async getRecentNotifications(
    userId: string,
    limit: number = 10
  ): Promise<NotificationEvent[]> {
    try {
      const { data, error } = await this.supabase
        .from('real_time_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return data.map(item => ({
        id: item.id,
        type: item.type,
        title: item.title,
        message: item.message,
        data: item.data,
        timestamp: item.created_at,
        read: item.read
      }))
    } catch (error) {
      console.error('Error getting recent notifications:', error)
      return []
    }
  }

  /**
   * Cleanup - unsubscribe from all channels
   */
  cleanup(): void {
    this.channels.forEach(channel => {
      channel.unsubscribe()
    })
    this.channels.clear()
    this.listeners.clear()
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService()