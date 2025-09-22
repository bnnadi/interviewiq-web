import React from 'react'

const Button = React.memo(function Button({ 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  loading = false,
  children, 
  ...props 
}) {
  const baseClasses = 'font-medium rounded-md transition-colors focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  )
})

export default Button
