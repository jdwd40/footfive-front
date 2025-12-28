import { getFormColor } from '../../utils/formatters'

export default function FormIndicator({ form, maxDisplay = 10 }) {
  if (!form || form.length === 0) {
    return (
      <div className="text-sm text-text-muted">
        No recent form
      </div>
    )
  }

  // Take last N results
  const recentForm = form.slice(-maxDisplay)

  return (
    <div className="flex items-center gap-1">
      {recentForm.map((result, index) => (
        <div
          key={index}
          className={`
            w-6 h-6 rounded flex items-center justify-center text-xs font-bold
            ${getFormColor(result)}
            transition-transform hover:scale-110
          `}
          title={getResultLabel(result)}
        >
          {result?.toUpperCase() || '?'}
        </div>
      ))}
    </div>
  )
}

function getResultLabel(result) {
  switch (result?.toUpperCase()) {
    case 'W': return 'Win'
    case 'L': return 'Loss'
    case 'D': return 'Draw'
    default: return 'Unknown'
  }
}

export function FormSummary({ form }) {
  if (!form || form.length === 0) return null

  const wins = form.filter(r => r?.toUpperCase() === 'W').length
  const draws = form.filter(r => r?.toUpperCase() === 'D').length
  const losses = form.filter(r => r?.toUpperCase() === 'L').length

  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="text-win font-medium">{wins}W</span>
      <span className="text-draw font-medium">{draws}D</span>
      <span className="text-loss font-medium">{losses}L</span>
    </div>
  )
}

