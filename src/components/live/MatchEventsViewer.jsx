import { useRef } from 'react'

// Event type configuration
const EVENT_CONFIG = {
    // Goals - highlighted with celebration
    goal: { icon: '⚽', label: 'GOAL!', highlight: true, color: 'primary' },
    penalty_scored: { icon: '⚽', label: 'PENALTY SCORED!', highlight: true, color: 'primary' },
    shootout_goal: { icon: '⚽', label: 'SHOOTOUT GOAL!', highlight: true, color: 'primary' },

    // Shots
    shot_saved: { icon: '🧤', label: 'Save', color: 'normal' },
    shot_missed: { icon: '❌', label: 'Shot Off Target', color: 'normal' },

    // Penalties (missed/saved)
    penalty_missed: { icon: '❌', label: 'Penalty Missed', color: 'warning' },
    penalty_saved: { icon: '🧤', label: 'Penalty Saved', color: 'warning' },
    shootout_miss: { icon: '❌', label: 'Shootout Miss', color: 'warning' },
    shootout_save: { icon: '🧤', label: 'Shootout Save', color: 'warning' },

    // Set pieces
    corner: { icon: '🚩', label: 'Corner', color: 'normal' },
    foul: { icon: '⚠️', label: 'Foul', color: 'warning' },

    // Match flow (neutral - no team)
    match_start: { icon: '🏁', label: 'Kick Off', neutral: true },
    halftime: { icon: '⏸️', label: 'Half Time', neutral: true },
    second_half_start: { icon: '🏁', label: 'Second Half', neutral: true },
    fulltime: { icon: '⏱️', label: 'Full Time', neutral: true },
    match_end: { icon: '🏆', label: 'Match Over', neutral: true },

    // Extra time
    extra_time_start: { icon: '⏱️', label: 'Extra Time', neutral: true },
    extra_time_half: { icon: '⏸️', label: 'ET Half Time', neutral: true },
    et_halftime: { icon: '⏸️', label: 'ET Half Time', neutral: true },
    extra_time_end: { icon: '⏱️', label: 'Extra Time Ends', neutral: true },

    // Shootout flow
    shootout_start: { icon: '🎯', label: 'Shootout Begins', neutral: true },
    shootout_end: { icon: '🏆', label: 'Shootout Over', neutral: true },
}

const MATCH_STATE_LABELS = {
    SCHEDULED: 'Upcoming',
    FIRST_HALF: '1st Half',
    HALFTIME: 'Half Time',
    SECOND_HALF: '2nd Half',
    EXTRA_TIME_1: 'Extra Time 1st',
    ET_HALFTIME: 'ET Break',
    EXTRA_TIME_2: 'Extra Time 2nd',
    PENALTIES: 'Penalties',
    FINISHED: 'Full Time',
}

export default function MatchEventsViewer({
    events = [],
    homeTeam,
    awayTeam,
    score = { home: 0, away: 0 },
    penaltyScore,
    matchState = 'SCHEDULED',
    minute,
}) {
    const containerRef = useRef(null)

    // Sort events by newest first (using timestamp, then minute)
    const sortedEvents = [...events].sort((a, b) => {
        // If both have timestamps, use those
        if (a.timestamp && b.timestamp) {
            return b.timestamp - a.timestamp
        }
        // Fall back to minute comparison
        if (b.minute !== a.minute) {
            return (b.minute || 0) - (a.minute || 0)
        }
        // Use seq if available
        if (a.seq && b.seq) {
            return b.seq - a.seq
        }
        return 0
    })

    const isLive = ['FIRST_HALF', 'SECOND_HALF', 'EXTRA_TIME_1', 'EXTRA_TIME_2', 'PENALTIES'].includes(matchState)
    const hasPenalties = penaltyScore?.home > 0 || penaltyScore?.away > 0
    const stateLabel = MATCH_STATE_LABELS[matchState] || matchState

    return (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {/* Score Header */}
            <div className="bg-gradient-to-r from-card-hover via-card to-card-hover p-4 border-b border-border">
                <div className="flex items-center justify-between">
                    {/* Home Team */}
                    <div className="flex-1 text-center">
                        <p className={`font-bold text-lg ${score?.home > score?.away ? 'text-primary' : 'text-text'}`}>
                            {homeTeam?.name || 'Home'}
                        </p>
                    </div>

                    {/* Score */}
                    <div className="flex flex-col items-center px-4">
                        <div className="flex items-center gap-3">
                            <span className={`text-3xl font-bold score-display ${score?.home > score?.away ? 'text-primary' : 'text-text'}`}>
                                {score?.home ?? 0}
                            </span>
                            <span className="text-xl text-text-muted">-</span>
                            <span className={`text-3xl font-bold score-display ${score?.away > score?.home ? 'text-primary' : 'text-text'}`}>
                                {score?.away ?? 0}
                            </span>
                        </div>
                        {hasPenalties && (
                            <p className="text-xs text-text-muted mt-1">
                                ({penaltyScore.home} - {penaltyScore.away} pens)
                            </p>
                        )}
                        <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold ${isLive ? 'bg-live/20 text-live' : 'bg-card-hover text-text-muted'
                            }`}>
                            {isLive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse mr-1.5" />}
                            {isLive && minute !== undefined ? `${minute}'` : stateLabel}
                        </div>
                    </div>

                    {/* Away Team */}
                    <div className="flex-1 text-center">
                        <p className={`font-bold text-lg ${score?.away > score?.home ? 'text-primary' : 'text-text'}`}>
                            {awayTeam?.name || 'Away'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Events List */}
            <div
                ref={containerRef}
                className="max-h-96 overflow-y-auto p-4 space-y-2"
            >
                {sortedEvents.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-text-muted">
                        <div className="text-center">
                            <span className="text-3xl block mb-2">⏳</span>
                            <p>Waiting for events...</p>
                        </div>
                    </div>
                ) : (
                    sortedEvents.map((event, index) => (
                        <EventRow
                            key={event.seq || event.timestamp || index}
                            event={event}
                            homeTeam={homeTeam}
                            awayTeam={awayTeam}
                            isLatest={index === 0}
                        />
                    ))
                )}
            </div>
        </div>
    )
}

function EventRow({ event, homeTeam, awayTeam, isLatest }) {
    const config = EVENT_CONFIG[event.type] || { icon: '📌', label: event.type, color: 'normal' }

    // Determine which team this event belongs to
    const isHomeTeam = event.teamId === homeTeam?.id ||
        event.homeTeam?.id === homeTeam?.id && event.teamId === event.homeTeam?.id
    const isAwayTeam = event.teamId === awayTeam?.id ||
        event.awayTeam?.id === awayTeam?.id && event.teamId === event.awayTeam?.id
    const isNeutral = config.neutral || (!event.teamId && !isHomeTeam && !isAwayTeam)

    // Get team name for display
    const teamName = isHomeTeam ? homeTeam?.name : isAwayTeam ? awayTeam?.name : null

    // Style based on event type
    const getCardStyle = () => {
        if (config.highlight) {
            return 'bg-primary/15 border border-primary/40 shadow-lg shadow-primary/20'
        }
        if (config.color === 'warning') {
            return 'bg-amber-500/10 border border-amber-500/20'
        }
        if (isNeutral) {
            return 'bg-card-hover border border-transparent'
        }
        return 'bg-card border border-border hover:border-primary/20'
    }

    // Team indicator bar
    const getTeamBar = () => {
        if (isNeutral) return ''
        if (isHomeTeam) return 'border-l-4 border-l-primary'
        if (isAwayTeam) return 'border-l-4 border-l-blue-500'
        return ''
    }

    return (
        <div
            className={`
        p-3 rounded-xl transition-all duration-300
        ${getCardStyle()}
        ${getTeamBar()}
        ${isLatest ? 'animate-slide-up' : ''}
      `}
        >
            <div className="flex items-start gap-3">
                {/* Time Badge */}
                <div className="min-w-[48px] text-center">
                    <span className={`text-sm font-mono font-bold ${config.highlight ? 'text-primary' : 'text-text-muted'}`}>
                        {event.minute !== undefined ? `${event.minute}'` : '--'}
                    </span>
                </div>

                {/* Icon */}
                <div className={`
          w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0
          ${config.highlight ? 'bg-primary/30' : 'bg-card-hover'}
          ${config.highlight && isLatest ? 'animate-pulse' : ''}
        `}>
                    {config.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Event Type */}
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className={`font-semibold ${config.highlight ? 'text-primary text-lg' : 'text-text'}`}>
                            {config.label}
                        </span>
                        {config.highlight && isLatest && (
                            <span className="text-xl animate-bounce">🎉</span>
                        )}
                    </div>

                    {/* Server Description */}
                    {event.description && (
                        <p className="text-sm text-text-muted leading-relaxed">
                            {event.description}
                        </p>
                    )}

                    {/* Team Attribution (if not in description) */}
                    {teamName && !event.description && (
                        <p className={`text-xs font-medium mt-1 ${isHomeTeam ? 'text-primary' : 'text-blue-400'}`}>
                            {teamName}
                        </p>
                    )}

                    {/* Player info if available */}
                    {event.displayName && !event.description && (
                        <p className="text-sm text-text-muted mt-0.5">
                            {event.displayName}
                            {event.assistName && <span className="text-text-muted/70"> • Assist: {event.assistName}</span>}
                        </p>
                    )}

                    {/* xG for shots */}
                    {event.xg !== undefined && (
                        <p className="text-xs text-text-muted/70 mt-1">
                            xG: {event.xg.toFixed(2)}
                        </p>
                    )}

                    {/* Shootout score */}
                    {event.shootoutScore && (
                        <p className="text-xs text-text-muted mt-1">
                            Shootout: {event.shootoutScore.home} - {event.shootoutScore.away}
                        </p>
                    )}
                </div>

                {/* Score after event (for goals) */}
                {config.highlight && event.score && (
                    <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold score-display text-primary">
                            {event.score.home} - {event.score.away}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
