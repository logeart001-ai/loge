import * as React from "react"
import { cn } from "@/lib/utils"

interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

const ResponsiveGrid = React.forwardRef<HTMLDivElement, ResponsiveGridProps>(
  ({ className, cols = { default: 1, sm: 2, lg: 3 }, gap = 'md', children, ...props }, ref) => {
    const gapClasses = {
      sm: 'gap-3',
      md: 'gap-4 sm:gap-6',
      lg: 'gap-6 sm:gap-8'
    }

    const getGridCols = () => {
      const classes = ['grid']
      
      if (cols.default) classes.push(`grid-cols-${cols.default}`)
      if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`)
      if (cols.md) classes.push(`md:grid-cols-${cols.md}`)
      if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`)
      if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`)
      
      return classes.join(' ')
    }

    return (
      <div
        ref={ref}
        className={cn(
          getGridCols(),
          gapClasses[gap],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ResponsiveGrid.displayName = "ResponsiveGrid"

// Preset grid configurations for common use cases
const ArtworkGrid = React.forwardRef<HTMLDivElement, Omit<ResponsiveGridProps, 'cols'>>(
  ({ className, ...props }, ref) => (
    <ResponsiveGrid
      ref={ref}
      cols={{ default: 1, sm: 2, lg: 3, xl: 4 }}
      gap="md"
      className={className}
      {...props}
    />
  )
)
ArtworkGrid.displayName = "ArtworkGrid"

const CreatorGrid = React.forwardRef<HTMLDivElement, Omit<ResponsiveGridProps, 'cols'>>(
  ({ className, ...props }, ref) => (
    <ResponsiveGrid
      ref={ref}
      cols={{ default: 1, sm: 2, md: 3, lg: 4 }}
      gap="md"
      className={className}
      {...props}
    />
  )
)
CreatorGrid.displayName = "CreatorGrid"

const DashboardGrid = React.forwardRef<HTMLDivElement, Omit<ResponsiveGridProps, 'cols'>>(
  ({ className, ...props }, ref) => (
    <ResponsiveGrid
      ref={ref}
      cols={{ default: 1, md: 2, lg: 3 }}
      gap="lg"
      className={className}
      {...props}
    />
  )
)
DashboardGrid.displayName = "DashboardGrid"

const StatsGrid = React.forwardRef<HTMLDivElement, Omit<ResponsiveGridProps, 'cols'>>(
  ({ className, ...props }, ref) => (
    <ResponsiveGrid
      ref={ref}
      cols={{ default: 2, sm: 2, md: 4 }}
      gap="sm"
      className={className}
      {...props}
    />
  )
)
StatsGrid.displayName = "StatsGrid"

export {
  ResponsiveGrid,
  ArtworkGrid,
  CreatorGrid,
  DashboardGrid,
  StatsGrid,
}