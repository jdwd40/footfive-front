export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} relative`}>
        <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
        <div className="absolute inset-0 border-2 border-transparent border-t-primary rounded-full animate-spin" />
      </div>
    </div>
  )
}

