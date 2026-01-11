/**
 * LiveEventsFeed - Shows all live events from the current tournament round
 * Events appear in real-time as they happen via SSE
 */

// Event configuration
const EVENT_CONFIG = {
    goal: { icon: '⚽', label: 'GOAL!', highlight: true },
    penalty_scored: { icon: '⚽', label: 'PENALTY!', highlight: true },
    shootout_goal: { icon: '⚽', label: 'SHOOTOUT GOAL!', highlight: true },
    shot_saved: { icon: '🧤', label: 'Save' },
    shot_missed: { icon: '❌', label: 'Miss' },
    penalty_missed: { icon: '❌', label: 'Penalty Missed' },
    penalty_saved: { icon: '🧤', label: 'Penalty Saved' },
    shootout_miss: { icon: '❌', label: 'Shootout Miss' },
    shootout_save: { icon: '🧤', label: 'Shootout Save' },
    corner: { icon: '🚩', label: 'Corner' },
    foul: { icon: '⚠️', label: 'Foul' },
    match_start: { icon: '🏁', label: 'Kick Off', neutral: true },
    halftime: { icon: '⏸️', label: 'Half Time', neutral: true },
    second_half_start: { icon: '▶️', label: '2nd Half', neutral: true },
    fulltime: { icon: '⏱️', label: 'Full Time', neutral: true },
    match_end: { icon: '🏆', label: 'Match Over', neutral: true },
    extra_time_start: { icon: '⏱️', label: 'Extra Time', neutral: true },
    shootout_start: { icon: '🎯', label: 'Shootout', neutral: true },
    shootout_end: { icon: '🏆', label: 'Shootout End', neutral: true },
}

export default function LiveEventsFeed({ events = [], isLive = false }) {
    // Sort events by newest first
    const sortedEvents = [...events].sort((a, b) => {
        if (a.timestamp && b.timestamp) return b.timestamp - a.timestamp
        if (b.minute !== a.minute) return (b.minute || 0) - (a.minute || 0)
        if (a.seq && b.seq) return b.seq - a.seq
        return 0
    })

    // Take only the most recent 15 events
    const displayEvents = sortedEvents.slice(0, 15)

    if (!isLive) {
        return null
    }

    return (
        <div className="bg-card rounded-2xl border border-border overflow-hidden mb-6">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-card-hover border-b border-border">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-live animate-pulse" />
                    <h3 className="font-bold text-text">Live Events</h3>
                </div>
                <span className="text-xs text-text-muted">
                    {displayEvents.length} events
                </span>
            </div>

            {/* Events list */}
            <div className="max-h-64 overflow-y-auto">
                {displayEvents.length === 0 ? (
                    <div className="p-6 text-center text-text-muted">
                        <span className="text-2xl block mb-2">⏳</span>
                        <p className="text-sm">Waiting for events...</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border/50">
                        {displayEvents.map((event, idx) => (
                            <EventRow key={event.seq || event.timestamp || idx} event={event} isLatest={idx === 0} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function EventRow({ event, isLatest }) {
    const config = EVENT_CONFIG[event.type] || { icon: '📌', label: event.type }
    const isGoal = config.highlight

    // Get team name from event
    const teamName = event.homeTeam?.id === event.teamId
        ? event.homeTeam?.name
        : event.awayTeam?.id === event.teamId
            ? event.awayTeam?.name
            : null

    return (
        <div className={`
      flex items-center gap-3 px-4 py-2.5 transition-all
      ${isGoal ? 'bg-primary/10' : 'hover:bg-card-hover'}
      ${isLatest ? 'animate-slide-up' : ''}
    `}>
            {/* Time */}
            <span className={`text-xs font-mono font-bold min-w-[32px] ${isGoal ? 'text-primary' : 'text-text-muted'}`}>
                {event.minute !== undefined ? `${event.minute}'` : '--'}
            </span>

            {/* Icon */}
            <span className={`text-lg ${isGoal && isLatest ? 'animate-bounce' : ''}`}>
                {config.icon}
            </span>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className={`font-semibold text-sm ${isGoal ? 'text-primary' : 'text-text'}`}>
                        {config.label}
                    </span>
                    {teamName && !config.neutral && (
                        <span className="text-xs text-text-muted">• {teamName}</span>
                    )}
                </div>
                {event.description && (
                    <p className="text-xs text-text-muted truncate">{event.description}</p>
                )}
                {!event.description && event.displayName && (
                    <p className="text-xs text-text-muted truncate">{event.displayName}</p>
                )}
            </div>

            {/* Score (for goals) */}
            {isGoal && event.score && (
                <span className="text-sm font-bold text-primary score-display">
                    {event.score.home}-{event.score.away}
                </span>
            )}
        </div>
    )
}
