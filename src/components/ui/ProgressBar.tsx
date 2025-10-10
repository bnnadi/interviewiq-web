import React from 'react'

interface ProgressBarProps {
  value: number
  max?: number
  className?: string
  showValue?: boolean
  variant?: 'default' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ 
    value, 
    max = 100, 
    className = '', 
    showValue = false, 
    variant = 'default',
    size = 'md',
    ...props 
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
    
    const baseClasses = 'w-full bg-gray-200 rounded-full overflow-hidden'
    
    const sizeClasses = {
      sm: 'h-2',
      md: 'h-3',
      lg: 'h-4'
    }

    const variantClasses = {
      default: 'bg-blue-600',
      success: 'bg-green-600',
      warning: 'bg-yellow-600',
      error: 'bg-red-600'
    }

    return (
      <div className={`${baseClasses} ${sizeClasses[size]} ${className}`} ref={ref} {...props}>
        <div
          className={`h-full transition-all duration-300 ease-in-out ${variantClasses[variant]}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={`Progress: ${percentage.toFixed(0)}%`}
        />
        {showValue && (
          <div className="mt-1 text-sm text-gray-600 text-center">
            {value}/{max} ({percentage.toFixed(0)}%)
          </div>
        )}
      </div>
    )
  }
)

ProgressBar.displayName = 'ProgressBar'

export { ProgressBar }
