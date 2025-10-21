import * as React from "react"
import { cn } from "@/lib/utils"

interface MobileContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const MobileContainer = React.forwardRef<HTMLDivElement, MobileContainerProps>(
  ({ className, size = 'lg', padding = 'md', children, ...props }, ref) => {
    const sizeClasses = {
      sm: 'max-w-sm',
      md: 'max-w-2xl',
      lg: 'max-w-4xl',
      xl: 'max-w-7xl',
      full: 'max-w-none'
    }

    const paddingClasses = {
      none: '',
      sm: 'px-3 sm:px-4',
      md: 'px-4 sm:px-6 lg:px-8',
      lg: 'px-6 sm:px-8 lg:px-12'
    }

    return (
      <div
        ref={ref}
        className={cn(
          'mx-auto w-full',
          sizeClasses[size],
          paddingClasses[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
MobileContainer.displayName = "MobileContainer"

// Section wrapper with mobile-optimized spacing
const MobileSection = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <section
      ref={ref}
      className={cn(
        'py-8 sm:py-12 lg:py-16', // Progressive spacing
        className
      )}
      {...props}
    />
  )
)
MobileSection.displayName = "MobileSection"

// Mobile-optimized page header
const MobilePageHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    title: string
    description?: string
    action?: React.ReactNode
  }
>(({ className, title, description, action, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
      'mb-6 sm:mb-8',
      className
    )}
    {...props}
  >
    <div className="space-y-1">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
        {title}
      </h1>
      {description && (
        <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
          {description}
        </p>
      )}
    </div>
    {action && (
      <div className="flex-shrink-0">
        {action}
      </div>
    )}
  </div>
))
MobilePageHeader.displayName = "MobilePageHeader"

// Mobile-friendly spacing utilities
const MobileStack = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    spacing?: 'sm' | 'md' | 'lg'
  }
>(({ className, spacing = 'md', ...props }, ref) => {
  const spacingClasses = {
    sm: 'space-y-3 sm:space-y-4',
    md: 'space-y-4 sm:space-y-6',
    lg: 'space-y-6 sm:space-y-8'
  }

  return (
    <div
      ref={ref}
      className={cn(spacingClasses[spacing], className)}
      {...props}
    />
  )
})
MobileStack.displayName = "MobileStack"

export {
  MobileContainer,
  MobileSection,
  MobilePageHeader,
  MobileStack,
}