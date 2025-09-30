import { createClient } from '@/lib/supabase'

export interface NotificationData {
  recipient_email: string
  subject: string
  content: string
  type?: string
  metadata?: Record<string, any>
}

export class NotificationService {
  private supabase = createClient()

  /**
   * Create a new notification
   */
  async createNotification(data: NotificationData) {
    try {
      const { data: notification, error } = await this.supabase
        .from('notifications')
        .insert({
          recipient_email: data.recipient_email,
          subject: data.subject,
          content: data.content,
          type: data.type || 'general',
          status: 'pending',
          metadata: data.metadata || {}
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating notification:', error)
        throw error
      }

      return notification
    } catch (error) {
      console.error('NotificationService.createNotification error:', error)
      throw error
    }
  }

  /**
   * Update notification status
   */
  async updateNotificationStatus(
    notificationId: string, 
    status: 'pending' | 'sent' | 'delivered' | 'failed' | 'opened',
    metadata?: Record<string, any>
  ) {
    try {
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      }

      // Set timestamp based on status
      if (status === 'sent') {
        updateData.sent_at = new Date().toISOString()
      } else if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString()
      } else if (status === 'opened') {
        updateData.opened_at = new Date().toISOString()
      }

      // Merge metadata if provided
      if (metadata) {
        const { data: current } = await this.supabase
          .from('notifications')
          .select('metadata')
          .eq('id', notificationId)
          .single()

        updateData.metadata = {
          ...(current?.metadata || {}),
          ...metadata
        }
      }

      const { error } = await this.supabase
        .from('notifications')
        .update(updateData)
        .eq('id', notificationId)

      if (error) {
        console.error('Error updating notification status:', error)
        throw error
      }

      return true
    } catch (error) {
      console.error('NotificationService.updateNotificationStatus error:', error)
      throw error
    }
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(userEmail: string, limit = 50) {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('recipient_email', userEmail)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching user notifications:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('NotificationService.getUserNotifications error:', error)
      throw error
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string) {
    return this.updateNotificationStatus(notificationId, 'opened')
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userEmail: string) {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ 
          opened_at: new Date().toISOString(),
          status: 'opened',
          updated_at: new Date().toISOString()
        })
        .eq('recipient_email', userEmail)
        .is('opened_at', null)

      if (error) {
        console.error('Error marking all notifications as read:', error)
        throw error
      }

      return true
    } catch (error) {
      console.error('NotificationService.markAllAsRead error:', error)
      throw error
    }
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userEmail: string) {
    try {
      const { count, error } = await this.supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_email', userEmail)
        .is('opened_at', null)

      if (error) {
        console.error('Error getting unread count:', error)
        throw error
      }

      return count || 0
    } catch (error) {
      console.error('NotificationService.getUnreadCount error:', error)
      throw error
    }
  }

  /**
   * Delete old notifications (cleanup)
   */
  async cleanupOldNotifications(daysOld = 90) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .lt('created_at', cutoffDate.toISOString())

      if (error) {
        console.error('Error cleaning up old notifications:', error)
        throw error
      }

      return true
    } catch (error) {
      console.error('NotificationService.cleanupOldNotifications error:', error)
      throw error
    }
  }

  /**
   * Create submission status notification
   */
  async createSubmissionNotification(
    creatorEmail: string,
    submissionTitle: string,
    status: 'approved' | 'rejected' | 'feedback',
    feedback?: string
  ) {
    const notifications = {
      approved: {
        subject: `🎉 Your submission "${submissionTitle}" has been approved!`,
        content: `Great news! Your artwork submission "${submissionTitle}" has been approved and is now live on Loge Arts. Customers can now discover and purchase your work.`,
        type: 'submission_approved'
      },
      rejected: {
        subject: `Your submission "${submissionTitle}" needs revision`,
        content: `Your artwork submission "${submissionTitle}" requires some adjustments before it can be published. ${feedback ? `Feedback: ${feedback}` : 'Please review our submission guidelines and resubmit.'}`,
        type: 'submission_rejected'
      },
      feedback: {
        subject: `Feedback on your submission "${submissionTitle}"`,
        content: `We've provided feedback on your submission "${submissionTitle}". ${feedback || 'Please check your submission for detailed comments.'}`,
        type: 'submission_feedback'
      }
    }

    const notification = notifications[status]
    
    return this.createNotification({
      recipient_email: creatorEmail,
      subject: notification.subject,
      content: notification.content,
      type: notification.type,
      metadata: {
        submission_title: submissionTitle,
        submission_status: status,
        feedback: feedback
      }
    })
  }

  /**
   * Create payment notification
   */
  async createPaymentNotification(
    creatorEmail: string,
    amount: number,
    orderDetails: any
  ) {
    return this.createNotification({
      recipient_email: creatorEmail,
      subject: `💰 Payment received: ₦${amount.toLocaleString()}`,
      content: `You've received a payment of ₦${amount.toLocaleString()} for your artwork sale. The funds will be processed and transferred to your account within 2-3 business days.`,
      type: 'payment_received',
      metadata: {
        amount: amount,
        order_id: orderDetails.id,
        order_details: orderDetails
      }
    })
  }

  /**
   * Subscribe to real-time notifications
   */
  subscribeToNotifications(userEmail: string, callback: (notification: any) => void) {
    const channel = this.supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_email=eq.${userEmail}`
        },
        callback
      )
      .subscribe()

    return () => {
      this.supabase.removeChannel(channel)
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService()