/**
 * Notification Triggers
 * 
 * Helper functions to create notifications for various events
 * Use these throughout your app to notify users of important actions
 */

import { createClient } from '@/lib/supabase'

export class NotificationTriggers {
  private static async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    data: Record<string, unknown> = {}
  ) {
    const supabase = createClient()
    
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          data,
          is_read: false
        })

      if (error) {
        console.error('Error creating notification:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Exception in createNotification:', error)
      return false
    }
  }

  /**
   * Notify creator when their artwork receives a new order
   */
  static async notifyCreatorOfOrder(
    creatorId: string,
    orderId: string,
    orderNumber: string,
    artworkTitle: string,
    buyerName: string
  ) {
    return this.createNotification(
      creatorId,
      'order',
      'New Order Received! 🎉',
      `${buyerName} purchased "${artworkTitle}". Order #${orderNumber}`,
      { orderId, orderNumber, artworkTitle }
    )
  }

  /**
   * Notify buyer when their order is confirmed
   */
  static async notifyBuyerOrderConfirmed(
    buyerId: string,
    orderId: string,
    orderNumber: string
  ) {
    return this.createNotification(
      buyerId,
      'order',
      'Order Confirmed ✅',
      `Your order #${orderNumber} has been confirmed and is being prepared for shipment.`,
      { orderId, orderNumber, status: 'confirmed' }
    )
  }

  /**
   * Notify buyer when order is shipped
   */
  static async notifyBuyerOrderShipped(
    buyerId: string,
    orderId: string,
    orderNumber: string,
    trackingNumber?: string
  ) {
    const message = trackingNumber
      ? `Your order #${orderNumber} has been shipped! Tracking: ${trackingNumber}`
      : `Your order #${orderNumber} has been shipped!`

    return this.createNotification(
      buyerId,
      'order',
      'Order Shipped 📦',
      message,
      { orderId, orderNumber, trackingNumber, status: 'shipped' }
    )
  }

  /**
   * Notify buyer when order is delivered
   */
  static async notifyBuyerOrderDelivered(
    buyerId: string,
    orderId: string,
    orderNumber: string
  ) {
    return this.createNotification(
      buyerId,
      'order',
      'Order Delivered 🎁',
      `Your order #${orderNumber} has been delivered! We hope you love it.`,
      { orderId, orderNumber, status: 'delivered' }
    )
  }

  /**
   * Notify creator when their artwork submission is approved
   */
  static async notifyCreatorArtworkApproved(
    creatorId: string,
    artworkId: string,
    artworkTitle: string
  ) {
    return this.createNotification(
      creatorId,
      'event',
      'Artwork Approved! 🎨',
      `Your artwork "${artworkTitle}" has been approved and is now live on the marketplace.`,
      { artworkId, artworkTitle, status: 'approved' }
    )
  }

  /**
   * Notify creator when their artwork submission is rejected
   */
  static async notifyCreatorArtworkRejected(
    creatorId: string,
    artworkId: string,
    artworkTitle: string,
    reason?: string
  ) {
    const message = reason
      ? `Your artwork "${artworkTitle}" was not approved. Reason: ${reason}`
      : `Your artwork "${artworkTitle}" was not approved. Please review our guidelines.`

    return this.createNotification(
      creatorId,
      'event',
      'Artwork Needs Review',
      message,
      { artworkId, artworkTitle, status: 'rejected', reason }
    )
  }

  /**
   * Notify user when someone follows them
   */
  static async notifyNewFollower(
    userId: string,
    followerId: string,
    followerName: string
  ) {
    return this.createNotification(
      userId,
      'follow',
      'New Follower! 👤',
      `${followerName} started following you.`,
      { followerId, followerName }
    )
  }

  /**
   * Notify creator when someone likes their artwork
   */
  static async notifyArtworkLiked(
    creatorId: string,
    artworkId: string,
    artworkTitle: string,
    likerName: string
  ) {
    return this.createNotification(
      creatorId,
      'like',
      'New Like! ❤️',
      `${likerName} liked your artwork "${artworkTitle}".`,
      { artworkId, artworkTitle, likerName }
    )
  }

  /**
   * Notify creator when someone comments on their artwork
   */
  static async notifyArtworkComment(
    creatorId: string,
    artworkId: string,
    artworkTitle: string,
    commenterName: string,
    commentPreview: string
  ) {
    return this.createNotification(
      creatorId,
      'comment',
      'New Comment 💬',
      `${commenterName} commented on "${artworkTitle}": "${commentPreview}"`,
      { artworkId, artworkTitle, commenterName }
    )
  }

  /**
   * Notify user about an upcoming event they're registered for
   */
  static async notifyEventReminder(
    userId: string,
    eventId: string,
    eventTitle: string,
    eventDate: string
  ) {
    return this.createNotification(
      userId,
      'event',
      'Event Reminder 📅',
      `"${eventTitle}" is coming up on ${eventDate}. Don't miss it!`,
      { eventId, eventTitle, eventDate }
    )
  }

  /**
   * Notify user about a system-wide announcement
   */
  static async notifySystemAnnouncement(
    userId: string,
    title: string,
    message: string,
    data: Record<string, unknown> = {}
  ) {
    return this.createNotification(
      userId,
      'event',
      title,
      message,
      data
    )
  }

  /**
   * Notify creator when their payout is processed
   */
  static async notifyPayoutProcessed(
    creatorId: string,
    amount: number,
    currency: string = 'NGN'
  ) {
    return this.createNotification(
      creatorId,
      'order',
      'Payout Processed 💰',
      `Your payout of ${currency} ${amount.toFixed(2)} has been processed and is on its way.`,
      { amount, currency, type: 'payout' }
    )
  }

  /**
   * Notify buyer about a price drop on wishlist item
   */
  static async notifyPriceDrop(
    buyerId: string,
    artworkId: string,
    artworkTitle: string,
    oldPrice: number,
    newPrice: number
  ) {
    const discount = Math.round(((oldPrice - newPrice) / oldPrice) * 100)
    
    return this.createNotification(
      buyerId,
      'event',
      'Price Drop Alert! 🔥',
      `"${artworkTitle}" is now ${discount}% off! Was ₦${oldPrice}, now ₦${newPrice}`,
      { artworkId, artworkTitle, oldPrice, newPrice, discount }
    )
  }
}
