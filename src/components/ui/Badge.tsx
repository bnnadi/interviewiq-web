import React from 'react'

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ children, variant = 'default', size = 'md', className = '', ...props }, ref) => {
    const baseClasses = 'inline-flex items-center rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
    
    const variantClasses = {
      default: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
      destructive: 'bg-red-100 text-red-800 hover:bg-red-200',
      outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
      success: 'bg-green-100 text-green-800 hover:bg-green-200',
      warning: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
      error: 'bg-red-100 text-red-800 hover:bg-red-200'
    }

    const sizeClasses = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-2.5 py-0.5 text-sm',
      lg: 'px-3 py-1 text-base'
    }

    return (
      <div
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Badge.displayName = 'Badge'

export { Badge }
