import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { liveApi } from '../api/client'
import useLiveStore from '../stores/useLiveStore'
import useLiveEvents from '../hooks/useLiveEvents'
import MatchClock from '../components/live/MatchClock'
import LiveScore from '../components/live/LiveScore'
import EventFeed from '../components/live/EventFeed'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorDisplay from '../components/common/ErrorDisplay'
import { useToast } from '../components/common/Toast'

const MATCH_STATE_LABELS = {
  SCHEDULED: 'Scheduled',
  FIRST_HALF: '1st Half',
  HALFTIME: 'Half Time',
  SECOND_HALF: '2nd Half',
  EXTRA_TIME_1: 'Extra Time 1st',
  ET_HALFTIME: 'ET Break',
  EXTRA_TIME_2: 'Extra Time 2nd',
  PENALTIES: 'Penalty Shootout',
  FINISHED: 'Full Time',
}

export default function LiveMatchDetail() {
  const { fixtureId } = useParams()
  const { addToast } = useToast()
  
  const [match, setMatch] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check store for existing match data
  const storeMatch = useLiveStore(state => 
    state.matches.find(m => m.fixtureId === parseInt(fixtureId))
  )

  // SSE event handler for this specific match
  const onEvent = useCallback((event) => {
    if (event.fixtureId !== parseInt(fixtureId)) return

    // Add event to local events list
    setEvents(prev => {
      // Avoid duplicates
      if (prev.some(e => e.seq === event.seq)) return prev
      return [...prev, event].sort((a, b) => {
        if (b.minute !== a.minute) return b.minute - a.minute
        return (b.seq || 0) - (a.seq || 0)
      })
    })

    // Update match state based on event
    if (event.type === 'goal') {
      setMatch(prev => prev ? { ...prev, score: event.score } : prev)
      addToast(
        `⚽ GOAL! ${event.displayName || 'Goal scored'}`,
        'goal',
        5000
      )
    } else if (event.type === 'halftime') {
      setMatch(prev => prev ? { ...prev, state: 'HALFTIME' } : prev)
    } else if (event.type === 'second_half_start') {
      setMatch(prev => prev ? { ...prev, state: 'SECOND_HALF' } : prev)
    } else if (event.type === 'fulltime' || event.type === 'match_end') {
      setMatch(prev => prev ? { ...prev, state: 'FINISHED', isFinished: true } : prev)
      addToast('🏆 Full Time!', 'info', 5000)
    }
  }, [fixtureId, addToast])

  // Connect to SSE stream filtered by this fixture
  const { connected, connecting, reconnect } = useLiveEvents({
    fixtureId: parseInt(fixtureId),
    onEvent,
    enabled: true,
  })

  // Fetch match details
  const fetchMatch = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Try to get from live API
      const data = await liveApi.getMatch(fixtureId)
      setMatch(data)

      // Also fetch recent events for this match
      const eventsData = await liveApi.getRecentEvents({ 
        fixtureId: parseInt(fixtureId),
        limit: 50 
      })
      
      if (eventsData.events) {
        setEvents(eventsData.events.sort((a, b) => {
          if (b.minute !== a.minute) return b.minute - a.minute
          return (b.seq || 0) - (a.seq || 0)
        }))
      }
    } catch (err) {
      // Fall back to store match if API fails
      if (storeMatch) {
        setMatch(storeMatch)
      } else {
        setError(err.message || 'Failed to load match')
      }
    } finally {
      setLoading(false)
    }
  }, [fixtureId, storeMatch])

  // Initial fetch
  useEffect(() => {
    fetchMatch()
  }, [fetchMatch])

  // Update from store if available
  useEffect(() => {
    if (storeMatch && !match) {
      setMatch(storeMatch)
    }
  }, [storeMatch, match])

  const isLive = match && ['FIRST_HALF', 'SECOND_HALF', 'EXTRA_TIME_1', 'EXTRA_TIME_2', 'PENALTIES'].includes(match.state)
  const stateLabel = match?.state ? MATCH_STATE_LABELS[match.state] : 'Loading...'

  if (loading && !match) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-20">
          <LoadingSpinner size="lg" className="mb-4" />
          <p className="text-text-muted">Loading match...</p>
        </div>
      </div>
    )
  }

  if (error && !match) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ErrorDisplay message={error} onRetry={fetchMatch} />
        <div className="text-center mt-4">
          <Link to="/live" className="text-primary hover:underline">
            ← Back to Live Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link 
          to="/live"
          className="inline-flex items-center gap-2 text-text-muted hover:text-primary transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Live Dashboard
        </Link>
        
        <ConnectionIndicator 
          connected={connected} 
          connecting={connecting}
          onReconnect={() => reconnect(true)}
        />
      </div>

      {/* Match Card */}
      <div className={`
        rounded-2xl bg-card border p-6 mb-6
        ${isLive ? 'border-primary/50 shadow-xl shadow-primary/20' : 'border-border'}
      `}>
        {/* Status Badge */}
        <div className="flex items-center justify-center mb-4">
          <span className={`
            inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold
            ${isLive 
              ? 'bg-primary/20 text-primary' 
              : match?.state === 'FINISHED' 
                ? 'bg-slate-500/20 text-slate-400'
                : 'bg-amber-500/20 text-amber-400'}
          `}>
            {isLive && <span className="w-2 h-2 rounded-full bg-current animate-pulse" />}
            {match?.minute !== undefined && isLive ? `${match.minute}' - ${stateLabel}` : stateLabel}
          </span>
        </div>

        {/* Teams and Score */}
        <div className="flex items-center justify-between gap-4">
          {/* Home Team */}
          <div className="flex-1 text-center">
            <div className="w-20 h-20 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-4xl shadow-lg">
              ⚽
            </div>
            <h2 className={`text-lg font-bold truncate px-2 ${
              match?.score?.home > match?.score?.away ? 'text-primary' : 'text-text'
            }`}>
              {match?.homeTeam?.name || 'Home Team'}
            </h2>
          </div>

          {/* Score */}
          <div className="text-center px-4">
            <div className="flex items-center gap-4">
              <ScoreDigit 
                value={match?.score?.home ?? 0} 
                isWinning={match?.score?.home > match?.score?.away}
              />
              <span className="text-3xl text-text-muted">-</span>
              <ScoreDigit 
                value={match?.score?.away ?? 0}
                isWinning={match?.score?.away > match?.score?.home}
              />
            </div>
            
            {/* Penalty Score */}
            {(match?.penaltyScore?.home > 0 || match?.penaltyScore?.away > 0) && (
              <p className="text-sm text-text-muted mt-2">
                ({match.penaltyScore.home} - {match.penaltyScore.away} pens)
              </p>
            )}
          </div>

          {/* Away Team */}
          <div className="flex-1 text-center">
            <div className="w-20 h-20 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-blue-500/30 to-blue-500/10 flex items-center justify-center text-4xl shadow-lg">
              ⚽
            </div>
            <h2 className={`text-lg font-bold truncate px-2 ${
              match?.score?.away > match?.score?.home ? 'text-primary' : 'text-text'
            }`}>
              {match?.awayTeam?.name || 'Away Team'}
            </h2>
          </div>
        </div>

        {/* Match Stats */}
        {match?.stats && (
          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="text-sm font-semibold text-text-muted text-center mb-4">Match Stats</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <StatRow 
                label="Shots"
                home={match.stats.home?.shots}
                away={match.stats.away?.shots}
              />
              <StatRow 
                label="On Target"
                home={match.stats.home?.shotsOnTarget}
                away={match.stats.away?.shotsOnTarget}
              />
              <StatRow 
                label="Corners"
                home={match.stats.home?.corners}
                away={match.stats.away?.corners}
              />
              <StatRow 
                label="Fouls"
                home={match.stats.home?.fouls}
                away={match.stats.away?.fouls}
              />
              <StatRow 
                label="xG"
                home={match.stats.home?.xg?.toFixed(2)}
                away={match.stats.away?.xg?.toFixed(2)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Events Feed */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-text">Match Events</h3>
          {isLive && (
            <span className="flex items-center gap-2 text-sm text-text-muted">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Live updates
            </span>
          )}
        </div>
        
        {events.length > 0 ? (
          <LiveEventsList events={events} match={match} />
        ) : (
          <div className="text-center py-12 text-text-muted">
            <span className="text-3xl block mb-2">⏳</span>
            <p>Waiting for events...</p>
          </div>
        )}
      </div>

      {/* Back Link */}
      {match?.state === 'FINISHED' && (
        <div className="mt-6 text-center">
          <Link 
            to="/live" 
            className="text-primary hover:underline"
          >
            ← Back to Live Dashboard
          </Link>
        </div>
      )}
    </div>
  )
}

function ConnectionIndicator({ connected, connecting, onReconnect }) {
  if (connected) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-400">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        Live
      </div>
    )
  }

  if (connecting) {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-400">
        <LoadingSpinner size="sm" />
        Connecting...
      </div>
    )
  }

  return (
    <button 
      onClick={onReconnect}
      className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300"
    >
      <span className="w-2 h-2 rounded-full bg-red-500" />
      Reconnect
    </button>
  )
}

function ScoreDigit({ value, isWinning }) {
  return (
    <div className={`
      w-16 h-20 rounded-xl flex items-center justify-center
      text-5xl font-bold transition-all duration-300
      ${isWinning ? 'bg-primary/20 text-primary shadow-lg shadow-primary/25' : 'bg-card-hover text-text'}
    `}>
      {value}
    </div>
  )
}

function StatRow({ label, home, away }) {
  return (
    <>
      <div className="text-right text-text">{home ?? '-'}</div>
      <div className="text-center text-text-muted">{label}</div>
      <div className="text-left text-text">{away ?? '-'}</div>
    </>
  )
}

function LiveEventsList({ events, match }) {
  const eventIcons = {
    goal: '⚽',
    match_start: '🏁',
    halftime: '⏸️',
    second_half_start: '▶️',
    fulltime: '🏆',
    match_end: '🏆',
    penalty_scored: '⚽',
    penalty_missed: '❌',
    penalty_saved: '🧤',
    shootout_start: '🎯',
    shootout_goal: '⚽',
    shootout_miss: '❌',
    shootout_save: '🧤',
    extra_time_start: '⏱️',
  }

  const eventLabels = {
    goal: 'GOAL!',
    match_start: 'Kick Off',
    halftime: 'Half Time',
    second_half_start: 'Second Half',
    fulltime: 'Full Time',
    match_end: 'Match Over',
    penalty_scored: 'Penalty Scored',
    penalty_missed: 'Penalty Missed',
    penalty_saved: 'Penalty Saved',
    shootout_start: 'Shootout Begins',
    shootout_goal: 'Shootout Goal',
    shootout_miss: 'Shootout Miss',
    shootout_save: 'Shootout Save',
    extra_time_start: 'Extra Time',
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {events.map((event, idx) => {
        const isGoal = event.type === 'goal' || event.type === 'penalty_scored' || event.type === 'shootout_goal'
        const isHomeTeam = event.teamId === match?.homeTeam?.id

        return (
          <div 
            key={event.seq || idx}
            className={`
              flex items-center gap-3 p-3 rounded-xl transition-all
              ${isGoal 
                ? 'bg-primary/15 border border-primary/40' 
                : 'bg-card-hover'}
            `}
          >
            {/* Time */}
            <div className="min-w-[45px] text-center">
              <span className={`text-sm font-mono font-bold ${isGoal ? 'text-primary' : 'text-text-muted'}`}>
                {event.minute !== undefined ? `${event.minute}'` : '--'}
              </span>
            </div>

            {/* Icon */}
            <div className={`
              w-9 h-9 rounded-full flex items-center justify-center text-lg
              ${isGoal ? 'bg-primary/30' : 'bg-card'}
            `}>
              {eventIcons[event.type] || '📌'}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <p className={`font-semibold ${isGoal ? 'text-primary' : 'text-text'}`}>
                {eventLabels[event.type] || event.type}
              </p>
              {event.displayName && (
                <p className="text-sm text-text-muted">{event.displayName}</p>
              )}
              {event.assistName && (
                <p className="text-xs text-text-muted">Assist: {event.assistName}</p>
              )}
            </div>

            {/* Score after event */}
            {event.score && (
              <div className="text-sm text-text-muted">
                {event.score.home} - {event.score.away}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

