import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'outlined' | 'elevated'
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = '', variant = 'default', ...props }, ref) => {
    const baseClasses = 'rounded-lg border bg-white shadow-sm'
    
    const variantClasses = {
      default: 'border-gray-200',
      outlined: 'border-gray-300 border-2',
      elevated: 'border-gray-200 shadow-lg'
    }

    return (
      <div
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`flex flex-col space-y-1.5 p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
)

CardHeader.displayName = 'CardHeader'

interface CardContentProps {
  children: React.ReactNode
  className?: string
}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ children, className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`p-6 pt-0 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
)

CardContent.displayName = 'CardContent'

export { Card, CardHeader, CardContent }
