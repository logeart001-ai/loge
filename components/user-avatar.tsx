'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  user: {
    id?: string
    full_name?: string | null
    avatar_url?: string | null
    email?: string
  }
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
  showOnlineStatus?: boolean
  isOnline?: boolean
}

const sizeClasses = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm', 
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
  xl: 'h-16 w-16 text-xl',
  '2xl': 'h-24 w-24 text-2xl'
}

export function UserAvatar({ 
  user, 
  size = 'md', 
  className,
  showOnlineStatus = false,
  isOnline = false
}: UserAvatarProps) {
  // Generate initials from name or email
  const getInitials = () => {
    if (user.full_name) {
      return user.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    
    if (user.email) {
      return user.email[0].toUpperCase()
    }
    
    return 'U'
  }

  const initials = getInitials()

  return (
    <div className="relative inline-block">
      <Avatar className={cn(sizeClasses[size], className)}>
        <AvatarImage 
          src={user.avatar_url || undefined} 
          alt={user.full_name || user.email || 'User avatar'}
        />
        <AvatarFallback className="bg-orange-100 text-orange-600 font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>
      
      {/* Online Status Indicator */}
      {showOnlineStatus && (
        <div 
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-white",
            size === 'xs' && "h-2 w-2",
            size === 'sm' && "h-2.5 w-2.5", 
            size === 'md' && "h-3 w-3",
            size === 'lg' && "h-3.5 w-3.5",
            size === 'xl' && "h-4 w-4",
            size === '2xl' && "h-5 w-5",
            isOnline ? "bg-green-500" : "bg-gray-400"
          )}
          aria-label={isOnline ? "Online" : "Offline"}
        />
      )}
    </div>
  )
}

// Convenience components for common use cases
export function CreatorAvatar({ user, ...props }: Omit<UserAvatarProps, 'user'> & { user: UserAvatarProps['user'] }) {
  return <UserAvatar user={user} {...props} />
}

export function CollectorAvatar({ user, ...props }: Omit<UserAvatarProps, 'user'> & { user: UserAvatarProps['user'] }) {
  return <UserAvatar user={user} {...props} />
}

export function AdminAvatar({ user, ...props }: Omit<UserAvatarProps, 'user'> & { user: UserAvatarProps['user'] }) {
  return (
    <div className="relative">
      <UserAvatar user={user} {...props} />
      {/* Admin badge */}
      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
        A
      </div>
    </div>
  )
}