'use client'

import { NotificationProvider } from '@/components/notifications/notification-provider'

interface LayoutWrapperProps {
  children: React.ReactNode
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  return (
    <NotificationProvider>
      {children}
    </NotificationProvider>
  )
}