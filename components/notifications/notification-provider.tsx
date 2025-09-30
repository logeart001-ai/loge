'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { ToastNotifications } from './toast-notifications'
import { notificationService } from '@/lib/notification-service'
import { createClient } from '@/lib/supabase'

interface NotificationContextType {
  unreadCount: number
  refreshNotifications: () => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: React.ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    initializeNotifications()
  }, [])

  const initializeNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('email')
        .eq('id', user.id)
        .single()

      if (!profile?.email) return

      setUserEmail(profile.email)
      
      // Get initial unread count
      const count = await notificationService.getUnreadCount(profile.email)
      setUnreadCount(count)

      // Set up real-time subscription for unread count updates
      const unsubscribe = notificationService.subscribeToNotifications(
        profile.email,
        (notification) => {
          // Increment unread count for new notifications
          setUnreadCount(prev => prev + 1)
        }
      )

      return unsubscribe
    } catch (error) {
      console.error('Error initializing notifications:', error)
    }
  }

  const refreshNotifications = async () => {
    if (!userEmail) return
    
    try {
      const count = await notificationService.getUnreadCount(userEmail)
      setUnreadCount(count)
    } catch (error) {
      console.error('Error refreshing notifications:', error)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id)
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!userEmail) return
    
    try {
      await notificationService.markAllAsRead(userEmail)
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const contextValue: NotificationContextType = {
    unreadCount,
    refreshNotifications,
    markAsRead,
    markAllAsRead
  }

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <ToastNotifications />
    </NotificationContext.Provider>
  )
}