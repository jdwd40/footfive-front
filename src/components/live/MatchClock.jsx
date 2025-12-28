import { useState, useEffect } from 'react'
import { formatMatchTime } from '../../utils/formatters'

export default function MatchClock({ events, isLive }) {
  const [displayTime, setDisplayTime] = useState({ minute: 0, second: 0 })

  useEffect(() => {
    if (!events || events.length === 0) {
      setDisplayTime({ minute: 0, second: 0 })
      return
    }

    // Find the latest event
    const latestEvent = events.reduce((latest, event) => {
      if (event.minute > latest.minute) return event
      if (event.minute === latest.minute && (event.second || 0) > (latest.second || 0)) return event
      return latest
    }, events[0])

    setDisplayTime({
      minute: latestEvent.minute || 0,
      second: latestEvent.second || 0
    })
  }, [events])

  // Determine match period
  const getPeriod = () => {
    if (!events || events.length === 0) return 'Pre-Match'
    
    const hasKickoff = events.some(e => e.event_type === 'kickoff')
    const hasHalftime = events.some(e => e.event_type === 'halftime')
    const hasFulltime = events.some(e => e.event_type === 'fulltime')
    const hasShootout = events.some(e => e.event_type === 'shootout_start')
    const hasShootoutEnd = events.some(e => e.event_type === 'shootout_end')

    if (hasShootoutEnd) return 'Match Ended'
    if (hasShootout) return 'Penalty Shootout'
    if (hasFulltime) return 'Full Time'
    if (hasHalftime && displayTime.minute < 46) return 'Half Time'
    if (hasHalftime) return '2nd Half'
    if (hasKickoff) return '1st Half'
    return 'Pre-Match'
  }

  const period = getPeriod()
  const isMatchOver = period === 'Full Time' || period === 'Match Ended'

  return (
    <div className="text-center">
      {/* Time Display */}
      <div className={`
        inline-flex items-center justify-center
        px-6 py-3 rounded-2xl
        ${isLive && !isMatchOver ? 'bg-primary/20 border border-primary/50' : 'bg-card border border-border'}
        transition-all duration-300
      `}>
        <span className={`
          text-4xl font-mono font-bold tracking-wider
          ${isLive && !isMatchOver ? 'text-primary' : 'text-text'}
        `}>
          {formatMatchTime(displayTime.minute, displayTime.second)}
        </span>
        
        {isLive && !isMatchOver && (
          <span className="ml-3 w-3 h-3 rounded-full bg-red-500 animate-pulse" />
        )}
      </div>

      {/* Period Label */}
      <div className={`
        mt-2 text-sm font-medium uppercase tracking-wide
        ${isLive && !isMatchOver ? 'text-primary' : 'text-text-muted'}
      `}>
        {period}
      </div>
    </div>
  )
}

