import { useRef, useEffect } from 'react'
import { getEventIcon, formatMatchTime } from '../../utils/formatters'

export default function EventFeed({ events, homeTeam, awayTeam, autoScroll = true }) {
  const feedRef = useRef(null)

  // Auto-scroll to latest event
  useEffect(() => {
    if (autoScroll && feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [events, autoScroll])

  if (!events || events.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-text-muted">
        <div className="text-center">
          <span className="text-3xl block mb-2">⏳</span>
          <p>Waiting for events...</p>
        </div>
      </div>
    )
  }

  // Reverse for latest-first view
  const sortedEvents = [...events].sort((a, b) => {
    if (b.minute !== a.minute) return b.minute - a.minute
    return (b.second || 0) - (a.second || 0)
  })

  return (
    <div 
      ref={feedRef}
      className="space-y-2 max-h-96 overflow-y-auto pr-2 scroll-smooth"
    >
      {sortedEvents.map((event, index) => (
        <EventItem 
          key={event.event_id || index} 
          event={event}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          isLatest={index === 0}
        />
      ))}
    </div>
  )
}

function EventItem({ event, homeTeam, awayTeam, isLatest }) {
  const isHomeTeam = event.team_name === homeTeam
  const isNeutral = !event.team_name || ['kickoff', 'halftime', 'fulltime', 'shootout_start', 'shootout_end', 'extra_time_start'].includes(event.event_type)
  const isGoal = event.event_type === 'goal' || event.event_type === 'penalty_goal'
  const isImportant = isGoal || event.event_type === 'red_card' || event.event_type === 'penalty_awarded'

  return (
    <div 
      className={`
        flex items-center gap-3 p-3 rounded-xl transition-all duration-300
        ${isLatest ? 'animate-slide-up' : ''}
        ${isGoal ? 'bg-primary/15 border border-primary/40 shadow-lg shadow-primary/20' : 
          isImportant ? 'bg-yellow-500/10 border border-yellow-500/30' :
          'bg-card hover:bg-card-hover'}
        ${isNeutral ? '' : isHomeTeam ? 'border-l-4 border-l-primary' : 'border-r-4 border-r-blue-500'}
      `}
    >
      {/* Time */}
      <div className="min-w-[50px] text-center">
        <span className={`
          text-sm font-mono font-bold
          ${isGoal ? 'text-primary' : 'text-text-muted'}
        `}>
          {formatMatchTime(event.minute, event.second)}
        </span>
      </div>

      {/* Icon */}
      <div className={`
        w-10 h-10 rounded-full flex items-center justify-center text-xl
        ${isGoal ? 'bg-primary/30 animate-pulse' : 'bg-card-hover'}
      `}>
        {getEventIcon(event.event_type)}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold ${isGoal ? 'text-primary text-lg' : 'text-text'}`}>
          {formatEventLabel(event.event_type)}
        </p>
        {event.player_name && (
          <p className="text-sm text-text-muted truncate">{event.player_name}</p>
        )}
        {event.team_name && !isNeutral && (
          <p className={`text-xs ${isHomeTeam ? 'text-primary' : 'text-blue-400'}`}>
            {event.team_name}
          </p>
        )}
      </div>

      {/* Goal indicator */}
      {isGoal && (
        <div className="text-2xl animate-bounce">
          🎉
        </div>
      )}
    </div>
  )
}

function formatEventLabel(type) {
  const labels = {
    goal: 'GOAL!!!',
    shot_saved: 'Shot Saved',
    shot_missed: 'Shot Off Target',
    yellow_card: 'Yellow Card',
    red_card: 'RED CARD!',
    foul: 'Foul',
    corner: 'Corner Kick',
    penalty_awarded: 'PENALTY!',
    penalty_goal: 'PENALTY SCORED!',
    penalty_saved: 'Penalty Saved',
    penalty_missed: 'Penalty Missed',
    kickoff: '⚽ Kick Off',
    halftime: '⏸️ Half Time',
    fulltime: '🏆 Full Time',
    shootout_start: '🎯 Shootout Begins',
    shootout_end: '🏆 Match Over',
    extra_time_start: '⏱️ Extra Time',
    substitution: 'Substitution',
    offside: 'Offside',
    var_check: 'VAR Review',
  }
  return labels[type] || type?.replace(/_/g, ' ') || 'Event'
}

