'use client'

import { useState, useEffect } from 'react'
import { Bell, X, Check, AlertCircle, Info, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { createClient } from '@/lib/supabase'
// import { formatDistanceToNow } from 'date-fns'

interface Notification {
  id: string
  recipient_email: string
  subject: string
  content: string
  type: string
  status: string
  metadata: any
  sent_at: string | null
  delivered_at: string | null
  opened_at: string | null
  created_at: string
  updated_at: string
}

interface NotificationCenterProps {
  userId?: string
}

export function NotificationCenter({ userId }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchNotifications()
    setupRealtimeSubscription()
  }, [userId])

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user email
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('email')
        .eq('id', user.id)
        .single()

      if (!profile?.email) return

      // Fetch notifications for this user
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_email', profile.email)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching notifications:', error)
        return
      }

      setNotifications(data || [])
      
      // Count unread notifications (not opened)
      const unread = (data || []).filter(n => !n.opened_at).length
      setUnreadCount(unread)

    } catch (error) {
      console.error('Error in fetchNotifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          console.log('Notification change:', payload)
          
          if (payload.eventType === 'INSERT') {
            const newNotification = payload.new as Notification
            setNotifications(prev => [newNotification, ...prev])
            setUnreadCount(prev => prev + 1)
          } else if (payload.eventType === 'UPDATE') {
            const updatedNotification = payload.new as Notification
            setNotifications(prev => 
              prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          opened_at: new Date().toISOString(),
          status: 'opened'
        })
        .eq('id', notificationId)

      if (error) {
        console.error('Error marking notification as read:', error)
        return
      }

      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, opened_at: new Date().toISOString(), status: 'opened' }
            : n
        )
      )
      
      setUnreadCount(prev => Math.max(0, prev - 1))

    } catch (error) {
      console.error('Error in markAsRead:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('email')
        .eq('id', user.id)
        .single()

      if (!profile?.email) return

      const { error } = await supabase
        .from('notifications')
        .update({ 
          opened_at: new Date().toISOString(),
          status: 'opened'
        })
        .eq('recipient_email', profile.email)
        .is('opened_at', null)

      if (error) {
        console.error('Error marking all as read:', error)
        return
      }

      // Update local state
      setNotifications(prev =>
        prev.map(n => ({
          ...n,
          opened_at: n.opened_at || new Date().toISOString(),
          status: n.opened_at ? n.status : 'opened'
        }))
      )
      
      setUnreadCount(0)

    } catch (error) {
      console.error('Error in markAllAsRead:', error)
    }
  }

  const getNotificationIcon = (type: string, status: string) => {
    if (status === 'failed') return <XCircle className="w-4 h-4 text-red-500" />
    if (status === 'delivered' || status === 'opened') return <CheckCircle className="w-4 h-4 text-green-500" />
    
    switch (type) {
      case 'submission_approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'submission_rejected':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'submission_feedback':
        return <Info className="w-4 h-4 text-blue-500" />
      case 'payment_received':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      default:
        return <Bell className="w-4 h-4 text-gray-500" />
    }
  }

  const getNotificationColor = (type: string, status: string) => {
    if (status === 'failed') return 'border-l-red-500'
    if (status === 'delivered' || status === 'opened') return 'border-l-green-500'
    
    switch (type) {
      case 'submission_approved':
      case 'payment_received':
        return 'border-l-green-500'
      case 'submission_rejected':
        return 'border-l-red-500'
      case 'submission_feedback':
        return 'border-l-blue-500'
      default:
        return 'border-l-gray-300'
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-96">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer border-l-4 ${getNotificationColor(
                    notification.metadata?.type || notification.type,
                    notification.status
                  )} ${!notification.opened_at ? 'bg-blue-50' : ''}`}
                  onClick={() => !notification.opened_at && markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    {getNotificationIcon(
                      notification.metadata?.type || notification.type,
                      notification.status
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {notification.subject}
                        </p>
                        {!notification.opened_at && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.content.replace(/<[^>]*>/g, '')} {/* Strip HTML */}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-500">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </p>
                        
                        <div className="flex items-center gap-1">
                          {notification.status === 'sent' && (
                            <Badge variant="secondary" className="text-xs">
                              Sent
                            </Badge>
                          )}
                          {notification.status === 'delivered' && (
                            <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                              Delivered
                            </Badge>
                          )}
                          {notification.status === 'failed' && (
                            <Badge variant="destructive" className="text-xs">
                              Failed
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full text-sm"
              onClick={() => {
                setOpen(false)
                // Navigate to full notifications page if you have one
              }}
            >
              View all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}