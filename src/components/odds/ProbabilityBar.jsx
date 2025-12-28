export default function ProbabilityBar({ 
  home, 
  draw, 
  away, 
  homeLabel = 'Home',
  awayLabel = 'Away',
  showLabels = true 
}) {
  const homePercent = (home * 100).toFixed(0)
  const drawPercent = (draw * 100).toFixed(0)
  const awayPercent = (away * 100).toFixed(0)

  return (
    <div>
      {/* Probability labels */}
      {showLabels && (
        <div className="flex justify-between text-xs mb-1">
          <span className="text-primary font-medium">{homePercent}%</span>
          <span className="text-text-muted">{drawPercent}%</span>
          <span className="text-blue-400 font-medium">{awayPercent}%</span>
        </div>
      )}

      {/* Bar */}
      <div className="h-3 rounded-full overflow-hidden flex bg-card-hover">
        <div 
          className="bg-gradient-to-r from-primary to-primary-light transition-all duration-500 ease-out"
          style={{ width: `${home * 100}%` }}
          title={`${homeLabel}: ${homePercent}%`}
        />
        <div 
          className="bg-gray-500 transition-all duration-500 ease-out"
          style={{ width: `${draw * 100}%` }}
          title={`Draw: ${drawPercent}%`}
        />
        <div 
          className="bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500 ease-out"
          style={{ width: `${away * 100}%` }}
          title={`${awayLabel}: ${awayPercent}%`}
        />
      </div>

      {/* Team labels */}
      {showLabels && (
        <div className="flex justify-between text-xs mt-1 text-text-muted">
          <span className="truncate max-w-[40%]">{homeLabel}</span>
          <span className="truncate max-w-[40%] text-right">{awayLabel}</span>
        </div>
      )}
    </div>
  )
}

export function SimpleProbabilityBar({ value, color = 'primary', className = '' }) {
  const percent = (value * 100).toFixed(0)
  
  return (
    <div className={`relative ${className}`}>
      <div className="h-2 rounded-full bg-card-hover overflow-hidden">
        <div 
          className={`h-full rounded-full bg-${color} transition-all duration-500 ease-out`}
          style={{ width: `${value * 100}%` }}
        />
      </div>
      <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xs font-medium text-text-muted ml-2">
        {percent}%
      </span>
    </div>
  )
}

