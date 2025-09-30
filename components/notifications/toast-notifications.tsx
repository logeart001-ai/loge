'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase'

interface Toast {
  id: string
  title: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastNotificationsProps {
  userId?: string
}

export function ToastNotifications({ userId }: ToastNotificationsProps) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const supabase = createClient()

  useEffect(() => {
    setupRealtimeToasts()
  }, [userId])

  const setupRealtimeToasts = async () => {
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

      // Subscribe to new notifications for this user
      const channel = supabase
        .channel('toast-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_email=eq.${profile.email}`
          },
          (payload) => {
            const notification = payload.new
            showToastFromNotification(notification)
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    } catch (error) {
      console.error('Error setting up realtime toasts:', error)
    }
  }

  const showToastFromNotification = (notification: any) => {
    const toastType = getToastType(notification.type, notification.status)
    const toast: Toast = {
      id: notification.id,
      title: notification.subject,
      message: notification.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...',
      type: toastType,
      duration: 5000
    }

    addToast(toast)
  }

  const getToastType = (notificationType: string, status: string): Toast['type'] => {
    if (status === 'failed') return 'error'
    
    switch (notificationType) {
      case 'submission_approved':
      case 'payment_received':
        return 'success'
      case 'submission_rejected':
        return 'error'
      case 'submission_feedback':
        return 'info'
      default:
        return 'info'
    }
  }

  const addToast = (toast: Toast) => {
    setToasts(prev => [...prev, toast])

    // Auto remove after duration
    if (toast.duration) {
      setTimeout(() => {
        removeToast(toast.id)
      }, toast.duration)
    }
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const getToastIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const getToastStyles = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return 'border-l-4 border-l-green-500 bg-green-50'
      case 'error':
        return 'border-l-4 border-l-red-500 bg-red-50'
      case 'warning':
        return 'border-l-4 border-l-yellow-500 bg-yellow-50'
      case 'info':
      default:
        return 'border-l-4 border-l-blue-500 bg-blue-50'
    }
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <Card 
          key={toast.id} 
          className={`shadow-lg animate-in slide-in-from-right-full ${getToastStyles(toast.type)}`}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {getToastIcon(toast.type)}
              
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">
                  {toast.title}
                </h4>
                <p className="text-sm text-gray-700">
                  {toast.message}
                </p>
                
                {toast.action && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-8 px-2 text-xs"
                    onClick={toast.action.onClick}
                  >
                    {toast.action.label}
                  </Button>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-gray-200"
                onClick={() => removeToast(toast.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Hook for programmatically showing toasts
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }
    
    setToasts(prev => [...prev, newToast])

    if (toast.duration !== 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, toast.duration || 5000)
    }

    return id
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const success = (title: string, message: string, options?: Partial<Toast>) => {
    return showToast({ title, message, type: 'success', ...options })
  }

  const error = (title: string, message: string, options?: Partial<Toast>) => {
    return showToast({ title, message, type: 'error', ...options })
  }

  const info = (title: string, message: string, options?: Partial<Toast>) => {
    return showToast({ title, message, type: 'info', ...options })
  }

  const warning = (title: string, message: string, options?: Partial<Toast>) => {
    return showToast({ title, message, type: 'warning', ...options })
  }

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    info,
    warning
  }
}