import { useEffect, useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import useLiveStore from '../stores/useLiveStore'
import useLiveEvents from '../hooks/useLiveEvents'
import LiveScoreboard from '../components/live/LiveScoreboard'
import LiveMatchCard from '../components/live/LiveMatchCard'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorDisplay from '../components/common/ErrorDisplay'
import { useToast } from '../components/common/Toast'

const TOURNAMENT_STATE_MESSAGES = {
  IDLE: { title: 'Waiting for Tournament', subtitle: 'Next tournament starts at :55', icon: '⏰' },
  SETUP: { title: 'Tournament Starting Soon', subtitle: 'Teams are being shuffled...', icon: '🎲' },
  ROUND_OF_16: { title: 'Round of 16', subtitle: '16 teams battle for 8 spots', icon: '🏟️' },
  QF_BREAK: { title: 'Quarter-Finals Up Next', subtitle: 'Short break before QF...', icon: '☕' },
  QUARTER_FINALS: { title: 'Quarter-Finals', subtitle: '8 teams fight for the semis', icon: '🔥' },
  SF_BREAK: { title: 'Semi-Finals Up Next', subtitle: 'Short break before SF...', icon: '☕' },
  SEMI_FINALS: { title: 'Semi-Finals', subtitle: '4 teams remain', icon: '⚡' },
  FINAL_BREAK: { title: 'The Final Awaits', subtitle: 'Who will lift the trophy?', icon: '🏆' },
  FINAL: { title: 'THE FINAL', subtitle: 'The ultimate showdown', icon: '🏆' },
  RESULTS: { title: 'Tournament Complete', subtitle: 'Champion crowned!', icon: '👑' },
  COMPLETE: { title: 'Tournament Complete', subtitle: 'See you next hour!', icon: '🎉' },
}

export default function LiveDashboard() {
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState('live') // 'live' | 'history' | 'events'
  
  const {
    tournament,
    matches,
    completedMatches,
    upcomingFixtures,
    recentEvents,
    simulation,
    connected,
    connecting,
    error,
    isLoading,
    isInitialLoad,
    fetchSnapshot,
    handleEvent,
    getTournamentStateLabel,
    isTournamentActive,
    isBreakPeriod,
    getCurrentRound,
    getNextRound,
    getLiveMatches,
    getRecentGoals,
  } = useLiveStore()

  // Handle incoming SSE events
  const onEvent = useCallback((event) => {
    handleEvent(event)
    
    // Show toast for goals
    if (event.type === 'goal') {
      const teamName = event.homeTeam?.id === event.teamId ? event.homeTeam?.name : event.awayTeam?.name
      addToast(
        `⚽ GOAL! ${event.displayName || ''} - ${teamName || 'Goal!'}`,
        'goal',
        5000
      )
    } else if (event.type === 'match_start') {
      addToast(
        `🏁 Kick Off: ${event.homeTeam?.name} vs ${event.awayTeam?.name}`,
        'info',
        3000
      )
    } else if (event.type === 'match_end') {
      addToast(
        `🏆 FT: ${event.homeTeam?.name} ${event.score?.home} - ${event.score?.away} ${event.awayTeam?.name}`,
        'info',
        5000
      )
    } else if (event.type === 'round_complete') {
      addToast(`✅ ${event.round || 'Round'} complete!`, 'success', 5000)
    } else if (event.type === 'tournament_end') {
      addToast(
        `👑 ${event.winner?.name || 'Winner'} wins the tournament!`,
        'goal',
        10000
      )
    }
  }, [handleEvent, addToast])

  // Connect to SSE stream
  const { 
    connected: sseConnected, 
    connecting: sseConnecting,
    reconnect 
  } = useLiveEvents({
    tournamentId: tournament?.tournamentId,
    onEvent,
    enabled: true,
  })

  // Fetch initial snapshot
  useEffect(() => {
    fetchSnapshot()
  }, [fetchSnapshot])

  // Update store connection state from SSE
  useEffect(() => {
    useLiveStore.setState({ connected: sseConnected, connecting: sseConnecting })
  }, [sseConnected, sseConnecting])

  // Get derived state
  const stateConfig = TOURNAMENT_STATE_MESSAGES[tournament?.state] || TOURNAMENT_STATE_MESSAGES.IDLE
  const isActive = isTournamentActive()
  const isBreak = isBreakPeriod()
  const currentRound = getCurrentRound()
  const nextRound = getNextRound()
  const liveMatches = getLiveMatches()
  const recentGoals = getRecentGoals()

  // Loading state
  if (isInitialLoad && isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-20">
          <LoadingSpinner size="lg" className="mb-4" />
          <p className="text-text-muted">Connecting to live tournament...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !tournament) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorDisplay 
          message={error} 
          onRetry={fetchSnapshot}
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Connection Status Bar */}
      <ConnectionBar 
        connected={connected} 
        connecting={connecting}
        onReconnect={reconnect}
      />

      {/* Tournament Header */}
      <TournamentHeader 
        tournament={tournament}
        stateConfig={stateConfig}
        isActive={isActive}
        liveMatchCount={liveMatches.length}
      />

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <TabButton 
          active={activeTab === 'live'} 
          onClick={() => setActiveTab('live')}
          badge={liveMatches.length > 0 ? liveMatches.length : null}
        >
          {isBreak ? '📋 Upcoming' : '🔴 Live'}
        </TabButton>
        <TabButton 
          active={activeTab === 'history'} 
          onClick={() => setActiveTab('history')}
          badge={completedMatches.length > 0 ? completedMatches.length : null}
        >
          📜 Results
        </TabButton>
        <TabButton 
          active={activeTab === 'events'} 
          onClick={() => setActiveTab('events')}
          badge={recentGoals.length > 0 ? recentGoals.length : null}
        >
          ⚡ Events
        </TabButton>
      </div>

      {/* Tab Content */}
      {activeTab === 'live' && (
        <LiveTab 
          matches={matches}
          liveMatches={liveMatches}
          upcomingFixtures={upcomingFixtures}
          isBreak={isBreak}
          isActive={isActive}
          tournament={tournament}
          currentRound={currentRound}
          nextRound={nextRound}
          getTournamentStateLabel={getTournamentStateLabel}
        />
      )}

      {activeTab === 'history' && (
        <HistoryTab 
          completedMatches={completedMatches}
          tournament={tournament}
        />
      )}

      {activeTab === 'events' && (
        <EventsTab 
          events={recentEvents}
          matches={[...matches, ...completedMatches]}
        />
      )}

      {/* Simulation Info (Debug) */}
      {simulation && (
        <div className="mt-8 p-4 rounded-xl bg-card/50 border border-border text-sm text-text-muted">
          <p>Simulation: {simulation.isRunning ? 'Running' : 'Stopped'} • Tick: {simulation.tickCount} • Speed: {simulation.speedMultiplier}x</p>
        </div>
      )}
    </div>
  )
}

// Tournament Header Component
function TournamentHeader({ tournament, stateConfig, isActive, liveMatchCount }) {
  return (
    <div className={`
      relative overflow-hidden rounded-3xl mb-6 p-6 sm:p-8
      bg-gradient-to-br from-card via-card to-primary/5
      border border-border
      ${isActive ? 'shadow-xl shadow-primary/10' : ''}
    `}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, currentColor 2px, transparent 0)`,
          backgroundSize: '50px 50px',
        }} />
      </div>

      <div className="relative flex flex-col sm:flex-row items-center gap-6">
        {/* Icon */}
        <div className={`
          w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-5xl
          bg-gradient-to-br from-primary/20 to-yellow-500/20 shadow-lg
          ${isActive ? 'animate-pulse' : ''}
        `}>
          {stateConfig.icon}
        </div>

        {/* Info */}
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-text mb-1">
            {stateConfig.title}
          </h1>
          <p className="text-text-muted mb-3">{stateConfig.subtitle}</p>
          
          {/* Stats Row */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm">
            {tournament?.teamsRemaining && (
              <StatBadge label="Teams" value={tournament.teamsRemaining} />
            )}
            {liveMatchCount > 0 && (
              <StatBadge 
                label="Live" 
                value={liveMatchCount}
                highlight
              />
            )}
            {tournament?.tournamentId && (
              <StatBadge 
                label="ID" 
                value={`#${tournament.tournamentId}`}
              />
            )}
          </div>
        </div>

        {/* Live Indicator */}
        {isActive && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-semibold text-primary">LIVE</span>
          </div>
        )}
      </div>

      {/* Winner Banner */}
      {tournament?.winner && (
        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-yellow-500/20 via-primary/20 to-yellow-500/20 border border-yellow-500/30 text-center">
          <p className="text-yellow-400 text-sm mb-1">🏆 Champion 🏆</p>
          <p className="text-xl font-bold text-text">{tournament.winner.name || tournament.winner}</p>
          {tournament.runnerUp && (
            <p className="text-sm text-text-muted mt-1">
              Runner-up: {tournament.runnerUp.name || tournament.runnerUp}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// Live Tab Content
function LiveTab({ matches, liveMatches, upcomingFixtures, isBreak, isActive, tournament, currentRound, nextRound, getTournamentStateLabel }) {
  // Show live matches during active rounds
  if (isActive && matches.length > 0) {
    return (
      <div className="space-y-6">
        {/* Current Round Label */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-text flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            {getTournamentStateLabel()}
          </h2>
          <span className="text-sm text-text-muted">
            {liveMatches.length} match{liveMatches.length !== 1 ? 'es' : ''} in progress
          </span>
        </div>

        {/* Live Matches Grid */}
        <div className={`grid gap-4 ${
          matches.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
          matches.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
          matches.length <= 4 ? 'grid-cols-1 sm:grid-cols-2' :
          'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
        }`}>
          {matches.map(match => (
            <LiveMatchCard key={match.fixtureId} match={match} />
          ))}
        </div>
      </div>
    )
  }

  // Show upcoming fixtures during breaks
  if (isBreak) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8 bg-card rounded-2xl border border-border">
          <span className="text-5xl block mb-4">☕</span>
          <h2 className="text-xl font-bold text-text mb-2">
            {nextRound || 'Next Round'} Coming Up
          </h2>
          <p className="text-text-muted mb-4">
            Short break between rounds...
          </p>
          
          {/* Upcoming Fixtures */}
          {upcomingFixtures.length > 0 && (
            <div className="mt-6 px-4">
              <h3 className="text-sm font-semibold text-text-muted mb-4">UPCOMING FIXTURES</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {upcomingFixtures.map((fixture, idx) => (
                  <UpcomingFixtureCard key={fixture.fixtureId || idx} fixture={fixture} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Waiting state
  return (
    <div className="text-center py-16 bg-card rounded-2xl border border-border">
      <span className="text-5xl block mb-4">
        {tournament?.state === 'RESULTS' || tournament?.state === 'COMPLETE' ? '🎉' : '⏳'}
      </span>
      <p className="text-lg text-text-muted mb-2">
        {tournament?.state === 'RESULTS' || tournament?.state === 'COMPLETE'
          ? 'Tournament has ended!'
          : 'Waiting for matches to start...'}
      </p>
      <p className="text-sm text-text-muted">
        {tournament?.state === 'IDLE' 
          ? 'A new tournament begins every hour at :55'
          : 'Matches will appear here when they kick off'}
      </p>
    </div>
  )
}

// History Tab Content
function HistoryTab({ completedMatches, tournament }) {
  if (completedMatches.length === 0) {
    return (
      <div className="text-center py-16 bg-card rounded-2xl border border-border">
        <span className="text-5xl block mb-4">📭</span>
        <p className="text-lg text-text-muted mb-2">No completed matches yet</p>
        <p className="text-sm text-text-muted">
          Results will appear here as matches finish
        </p>
      </div>
    )
  }

  // Group by round
  const rounds = ['Round of 16', 'Quarter-finals', 'Semi-finals', 'Final']
  const groupedMatches = {}
  
  completedMatches.forEach(match => {
    const round = match.round || 'Unknown'
    if (!groupedMatches[round]) groupedMatches[round] = []
    groupedMatches[round].push(match)
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text">Match Results</h2>
        <span className="text-sm text-text-muted">
          {completedMatches.length} match{completedMatches.length !== 1 ? 'es' : ''} played
        </span>
      </div>

      {rounds.map(round => {
        const roundMatches = groupedMatches[round]
        if (!roundMatches || roundMatches.length === 0) return null

        return (
          <div key={round} className="space-y-3">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
              {round}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {roundMatches.map(match => (
                <CompletedMatchCard key={match.fixtureId} match={match} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Events Tab Content
function EventsTab({ events, matches }) {
  if (events.length === 0) {
    return (
      <div className="text-center py-16 bg-card rounded-2xl border border-border">
        <span className="text-5xl block mb-4">📡</span>
        <p className="text-lg text-text-muted mb-2">No events yet</p>
        <p className="text-sm text-text-muted">
          Live events will stream here during matches
        </p>
      </div>
    )
  }

  // Sort events by time (newest first)
  const sortedEvents = [...events].reverse()

  // Get match info for event
  const getMatchInfo = (fixtureId) => {
    return matches.find(m => m.fixtureId === fixtureId)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Live Feed
        </h2>
        <span className="text-sm text-text-muted">
          {events.length} event{events.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {sortedEvents.map((event, idx) => (
          <EventCard 
            key={event.seq || idx} 
            event={event} 
            match={getMatchInfo(event.fixtureId)}
          />
        ))}
      </div>
    </div>
  )
}

// Upcoming Fixture Card
function UpcomingFixtureCard({ fixture }) {
  return (
    <div className="p-3 rounded-xl bg-card-hover border border-border text-center">
      <div className="text-sm font-medium text-text truncate">
        {fixture.homeTeam?.name || 'TBD'}
      </div>
      <div className="text-xs text-text-muted my-1">vs</div>
      <div className="text-sm font-medium text-text truncate">
        {fixture.awayTeam?.name || 'TBD'}
      </div>
    </div>
  )
}

// Completed Match Card
function CompletedMatchCard({ match }) {
  const homeWon = (match.score?.home > match.score?.away) || 
    (match.score?.home === match.score?.away && match.penaltyScore?.home > match.penaltyScore?.away)
  const awayWon = (match.score?.away > match.score?.home) ||
    (match.score?.home === match.score?.away && match.penaltyScore?.away > match.penaltyScore?.home)

  return (
    <Link 
      to={`/live/${match.fixtureId}`}
      className="block p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className={`text-sm font-medium truncate flex-1 ${homeWon ? 'text-primary' : 'text-text'}`}>
          {match.homeTeam?.name || 'Home'}
        </span>
        <span className={`text-lg font-bold ${homeWon ? 'text-primary' : 'text-text'}`}>
          {match.score?.home ?? 0}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className={`text-sm font-medium truncate flex-1 ${awayWon ? 'text-primary' : 'text-text'}`}>
          {match.awayTeam?.name || 'Away'}
        </span>
        <span className={`text-lg font-bold ${awayWon ? 'text-primary' : 'text-text'}`}>
          {match.score?.away ?? 0}
        </span>
      </div>
      {(match.penaltyScore?.home > 0 || match.penaltyScore?.away > 0) && (
        <div className="text-xs text-text-muted text-center mt-1">
          (pens: {match.penaltyScore.home} - {match.penaltyScore.away})
        </div>
      )}
      <div className="text-xs text-text-muted text-center mt-2">
        FT
      </div>
    </Link>
  )
}

// Event Card
function EventCard({ event, match }) {
  const eventIcons = {
    goal: '⚽',
    match_start: '🏁',
    halftime: '⏸️',
    second_half_start: '▶️',
    fulltime: '🏁',
    match_end: '🏆',
    penalty_scored: '⚽',
    penalty_missed: '❌',
    penalty_saved: '🧤',
    shootout_start: '🎯',
    shootout_goal: '⚽',
    shootout_miss: '❌',
    extra_time_start: '⏱️',
    round_start: '📢',
    round_complete: '✅',
    tournament_end: '👑',
  }

  const isGoal = ['goal', 'penalty_scored', 'shootout_goal'].includes(event.type)

  return (
    <div className={`
      flex items-center gap-3 p-3 rounded-xl transition-all
      ${isGoal ? 'bg-primary/15 border border-primary/30' : 'bg-card border border-border'}
    `}>
      {/* Time */}
      <div className="min-w-[45px] text-center">
        <span className={`text-sm font-mono font-bold ${isGoal ? 'text-primary' : 'text-text-muted'}`}>
          {event.minute !== undefined ? `${event.minute}'` : '--'}
        </span>
      </div>

      {/* Icon */}
      <div className={`
        w-9 h-9 rounded-full flex items-center justify-center text-lg
        ${isGoal ? 'bg-primary/30' : 'bg-card-hover'}
      `}>
        {eventIcons[event.type] || '📌'}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${isGoal ? 'text-primary' : 'text-text'}`}>
          {formatEventType(event.type)}
        </p>
        {event.displayName && (
          <p className="text-xs text-text-muted">{event.displayName}</p>
        )}
        {match && (
          <p className="text-xs text-text-muted">
            {match.homeTeam?.name} vs {match.awayTeam?.name}
          </p>
        )}
      </div>

      {/* Score */}
      {event.score && (
        <div className="text-sm font-bold text-text">
          {event.score.home} - {event.score.away}
        </div>
      )}
    </div>
  )
}

function formatEventType(type) {
  const labels = {
    goal: 'GOAL!',
    match_start: 'Kick Off',
    halftime: 'Half Time',
    second_half_start: 'Second Half',
    fulltime: 'Full Time',
    match_end: 'Match Over',
    penalty_scored: 'Penalty Scored',
    penalty_missed: 'Penalty Missed',
    penalty_saved: 'Penalty Saved',
    shootout_start: 'Shootout',
    shootout_goal: 'Shootout Goal',
    shootout_miss: 'Shootout Miss',
    extra_time_start: 'Extra Time',
    round_start: 'Round Started',
    round_complete: 'Round Complete',
    tournament_end: 'Tournament Over',
  }
  return labels[type] || type?.replace(/_/g, ' ') || 'Event'
}

function ConnectionBar({ connected, connecting, onReconnect }) {
  if (connected) {
    return (
      <div className="flex items-center justify-center gap-2 mb-4 py-2 px-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        Connected to live stream
      </div>
    )
  }

  if (connecting) {
    return (
      <div className="flex items-center justify-center gap-2 mb-4 py-2 px-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
        <LoadingSpinner size="sm" />
        Connecting...
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between mb-4 py-2 px-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
      <span className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-500" />
        Disconnected
      </span>
      <button 
        onClick={() => onReconnect(true)}
        className="text-xs underline hover:no-underline"
      >
        Reconnect
      </button>
    </div>
  )
}

function TabButton({ children, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`
        relative px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
        ${active 
          ? 'bg-primary text-bg shadow-lg shadow-primary/25' 
          : 'bg-card text-text-muted hover:text-text hover:bg-card-hover'}
      `}
    >
      {children}
      {badge && (
        <span className={`
          absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center
          ${active ? 'bg-bg text-primary' : 'bg-primary text-bg'}
        `}>
          {badge}
        </span>
      )}
    </button>
  )
}

function StatBadge({ label, value, highlight = false }) {
  return (
    <div className={`
      px-3 py-1 rounded-lg text-xs
      ${highlight ? 'bg-primary/20 text-primary' : 'bg-card-hover text-text-muted'}
    `}>
      <span className="font-semibold">{value}</span> {label}
    </div>
  )
}
