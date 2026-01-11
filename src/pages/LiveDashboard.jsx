import { useEffect, useCallback, useState } from 'react'
import useLiveStore from '../stores/useLiveStore'
import useLiveEvents from '../hooks/useLiveEvents'
import RoundSection from '../components/live/RoundSection'
import TeamStatsPanel from '../components/live/TeamStatsPanel'
import GoalTicker from '../components/live/GoalTicker'
import LiveEventsFeed from '../components/live/LiveEventsFeed'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorDisplay from '../components/common/ErrorDisplay'
import { useToast } from '../components/common/Toast'

const ROUNDS = ['Round of 16', 'Quarter-finals', 'Semi-finals', 'Final']

const ROUND_NORMALIZATION = [
  { keys: ['roundof16', 'r16', 'round16', 'roundofsixteen'], value: 'Round of 16' },
  { keys: ['quarterfinals', 'quarter-finals', 'quarterfinal', 'quarter finals', 'qf'], value: 'Quarter-finals' },
  { keys: ['semifinals', 'semi-finals', 'semifinal', 'semi finals', 'sf'], value: 'Semi-finals' },
  { keys: ['final', 'finals'], value: 'Final' },
]

function normalizeRound(name) {
  if (!name) return null
  // Remove spaces, hyphens, AND underscores to handle backend names like ROUND_OF_16, QUARTER_FINALS
  const key = name.toString().toLowerCase().replace(/[\s\-_]/g, '')
  const found = ROUND_NORMALIZATION.find(entry => entry.keys.includes(key))
  return found ? found.value : null
}

const TOURNAMENT_STATE_CONFIG = {
  IDLE: { title: 'Waiting for Tournament', subtitle: 'Next tournament starts at :55', icon: '⏰', phase: 'idle' },
  SETUP: { title: 'Tournament Starting', subtitle: 'Teams are being shuffled...', icon: '🎲', phase: 'setup' },
  ROUND_OF_16: { title: 'Round of 16', subtitle: '16 teams battle for 8 spots', icon: '🏟️', phase: 'Round of 16' },
  QF_BREAK: { title: 'Quarter-Finals Starting', subtitle: 'Brief intermission...', icon: '☕', phase: 'break' },
  QUARTER_FINALS: { title: 'Quarter-Finals', subtitle: '8 teams fight for the semis', icon: '🔥', phase: 'Quarter-finals' },
  SF_BREAK: { title: 'Semi-Finals Starting', subtitle: 'Brief intermission...', icon: '☕', phase: 'break' },
  SEMI_FINALS: { title: 'Semi-Finals', subtitle: '4 teams remain', icon: '⚡', phase: 'Semi-finals' },
  FINAL_BREAK: { title: 'The Final Awaits', subtitle: 'Who will lift the trophy?', icon: '🏆', phase: 'break' },
  FINAL: { title: 'THE FINAL', subtitle: 'The ultimate showdown', icon: '🏆', phase: 'Final' },
  RESULTS: { title: 'Tournament Complete', subtitle: 'Champion crowned!', icon: '👑', phase: 'complete' },
  COMPLETE: { title: 'Tournament Complete', subtitle: 'See you next hour!', icon: '🎉', phase: 'complete' },
}

// Map state to current round
const STATE_TO_ROUND = {
  ROUND_OF_16: 'Round of 16',
  QF_BREAK: 'Quarter-finals',
  QUARTER_FINALS: 'Quarter-finals',
  SF_BREAK: 'Semi-finals',
  SEMI_FINALS: 'Semi-finals',
  FINAL_BREAK: 'Final',
  FINAL: 'Final',
}

export default function LiveDashboard() {
  const { addToast } = useToast()
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [showTeamPanel, setShowTeamPanel] = useState(false)

  const {
    tournament,
    fixtures,
    matches,
    completedMatches,
    lastCompletedTournament,
    lastCompletedFixtures,
    recentEvents,
    connected,
    connecting,
    error,
    isLoading,
    isInitialLoad,
    fetchSnapshot,
    handleEvent,
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
        `🏁 FT: ${event.homeTeam?.name} ${event.score?.home} - ${event.score?.away} ${event.awayTeam?.name}`,
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

  // Fetch initial snapshot and poll for updates
  useEffect(() => {
    // Initial fetch
    fetchSnapshot().catch(err => {
      console.error('Failed to fetch snapshot:', err)
    })

    // Poll every 10 seconds to keep data fresh
    const pollInterval = setInterval(() => {
      fetchSnapshot().catch(err => {
        console.error('Poll failed:', err)
      })
    }, 10000)

    return () => clearInterval(pollInterval)
  }, [fetchSnapshot])

  // Update store connection state from SSE
  useEffect(() => {
    useLiveStore.setState({ connected: sseConnected, connecting: sseConnecting })
  }, [sseConnected, sseConnecting])

  // Show celebration when there's a winner (handled below after derivedWinner is computed)

  // Get state config
  const liveTournament = tournament?.state && tournament.state !== 'IDLE'
    ? tournament
    : (lastCompletedTournament || tournament)

  const stateConfig = TOURNAMENT_STATE_CONFIG[liveTournament?.state] || TOURNAMENT_STATE_CONFIG.IDLE
  const currentRound = normalizeRound(STATE_TO_ROUND[liveTournament?.state])

  // Organize matches by round - use fixtures array if available
  const baseFixtures = fixtures.length > 0 ? fixtures : (liveTournament === lastCompletedTournament ? (lastCompletedFixtures || []) : [])
  const allMatches = baseFixtures.length > 0 ? baseFixtures : [...(completedMatches || []), ...(matches || [])]
  const matchesByRound = ROUNDS.reduce((acc, round) => {
    acc[round] = []
    return acc
  }, {})
  allMatches.forEach(match => {
    const round = normalizeRound(match?.round)
    if (round && matchesByRound[round]) {
      matchesByRound[round].push(match)
    }
  })

  // Determine round states
  const getRoundState = (round) => {
    const roundMatches = matchesByRound[round]
    const allFinished = roundMatches.length > 0 && roundMatches.every(m => m.isFinished || m.state === 'FINISHED')
    const anyInProgress = roundMatches.some(m =>
      ['FIRST_HALF', 'SECOND_HALF', 'EXTRA_TIME_1', 'EXTRA_TIME_2', 'PENALTIES', 'HALFTIME', 'ET_HALFTIME'].includes(m.state)
    )

    return {
      isCompleted: allFinished,
      isCurrent: currentRound === round || anyInProgress,
      isPending: !allFinished && !anyInProgress && roundMatches.length === 0
    }
  }

  // WORKAROUND: Derive tournament winner from Final match if backend hasn't set it
  // This handles the case where the Final is finished but tournament.state hasn't transitioned yet
  const derivedWinner = (() => {
    // If backend already set the winner, use that
    if (tournament?.winner) return tournament.winner

    // Find the Final match
    const finalMatch = allMatches.find(m =>
      normalizeRound(m.round) === 'Final' || m.bracketSlot === 'FINAL'
    )

    // If Final is finished, derive winner from it
    if (finalMatch && (finalMatch.state === 'FINISHED' || finalMatch.isFinished)) {
      const winnerId = finalMatch.winnerId || finalMatch.winner?.id
      if (winnerId) {
        if (finalMatch.homeTeam?.id == winnerId) return finalMatch.homeTeam
        if (finalMatch.awayTeam?.id == winnerId) return finalMatch.awayTeam
      }
      // Fall back to score comparison
      if (finalMatch.score?.home > finalMatch.score?.away) return finalMatch.homeTeam
      if (finalMatch.score?.away > finalMatch.score?.home) return finalMatch.awayTeam
    }
    return null
  })()

  const derivedRunnerUp = (() => {
    if (tournament?.runnerUp) return tournament.runnerUp
    if (!derivedWinner) return null

    const finalMatch = allMatches.find(m =>
      normalizeRound(m.round) === 'Final' || m.bracketSlot === 'FINAL'
    )
    if (finalMatch) {
      // Runner-up is whichever team isn't the winner
      if (finalMatch.homeTeam?.id == derivedWinner?.id) return finalMatch.awayTeam
      if (finalMatch.awayTeam?.id == derivedWinner?.id) return finalMatch.homeTeam
    }
    return null
  })()

  // Check if tournament is effectively complete (Final finished, even if state hasn't transitioned)
  const isEffectivelyComplete = derivedWinner != null

  // Handle team click
  const handleTeamClick = (team) => {
    if (team?.name) {
      setSelectedTeam(team)
      setShowTeamPanel(true)
    }
  }

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

  // Note: Error state is now handled inline with an error banner

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      {/* Team Stats Panel */}
      <TeamStatsPanel
        team={selectedTeam}
        isOpen={showTeamPanel}
        onClose={() => setShowTeamPanel(false)}
      />

      {/* Error Banner (if API failed) */}
      {error && (
        <div className="mb-4 p-4 rounded-xl bg-live/10 border border-live/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="text-live font-medium">Unable to connect to tournament server</p>
                <p className="text-sm text-text-muted">{error}</p>
              </div>
            </div>
            <button
              onClick={() => fetchSnapshot().catch(() => { })}
              className="btn btn-secondary text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Connection Status */}
      {!error && (
        <ConnectionStatus
          connected={connected}
          connecting={connecting}
          onReconnect={reconnect}
        />
      )}

      {/* Tournament Header */}
      <TournamentHeader
        tournament={tournament}
        stateConfig={stateConfig}
        currentRound={currentRound}
      />

      {/* Goal Ticker - Shows scores and announces goals during live rounds */}
      <GoalTicker
        goalEvents={recentEvents}
        matches={currentRound ? matchesByRound[currentRound] || [] : []}
        isLive={['ROUND_OF_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'].includes(tournament?.state)}
        isBreak={['QF_BREAK', 'SF_BREAK', 'FINAL_BREAK', 'SETUP'].includes(tournament?.state)}
        currentRound={currentRound || ''}
        nextRound={stateConfig?.phase === 'break' ? stateConfig?.title?.replace(' Starting', '') : ''}
      />

      {/* Live Events Feed - Shows all events in real-time */}
      <LiveEventsFeed
        events={recentEvents}
        isLive={['ROUND_OF_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'].includes(tournament?.state)}
      />

      {/* Current Round Highlight (when live) */}
      {currentRound && matchesByRound[currentRound]?.length > 0 && (
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full bg-live animate-pulse" />
            <h2 className="text-xl font-bold text-text">Now Playing</h2>
          </div>
          <RoundSection
            round={currentRound}
            matches={matchesByRound[currentRound]}
            isCurrentRound={true}
            onTeamClick={handleTeamClick}
          />
        </div>
      )}

      {/* Tournament Progress / All Rounds */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-text-muted uppercase tracking-wider">
          Tournament Progress
        </h2>

        <div className="space-y-4">
          {ROUNDS.map((round, idx) => {
            const { isCompleted, isCurrent, isPending } = getRoundState(round)
            // Skip showing current round again if already shown above
            if (isCurrent && currentRound === round && matchesByRound[round]?.length > 0) {
              return null
            }

            return (
              <div
                key={round}
                className="animate-slide-up"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <RoundSection
                  round={round}
                  matches={matchesByRound[round]}
                  isCompleted={isCompleted}
                  isCurrentRound={isCurrent}
                  isPending={isPending}
                  onTeamClick={handleTeamClick}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Tournament Winner Section (persisted after celebration closes) */}
      {(tournament?.winner || derivedWinner) && (tournament?.state === 'RESULTS' || tournament?.state === 'COMPLETE' || isEffectivelyComplete) && (
        <div className="mt-8 animate-slide-up">
          <div className="bg-gradient-to-br from-gold/10 via-card to-gold/10 rounded-3xl border border-gold/30 p-8 text-center glow-gold">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-400 via-gold to-yellow-500 flex items-center justify-center text-5xl shadow-xl shadow-gold/30">
              🏆
            </div>
            <p className="text-gold text-sm font-semibold uppercase tracking-wider mb-2">Tournament Champion</p>
            <h3 className="text-3xl font-bold text-text mb-2">
              {(tournament?.winner || derivedWinner)?.name || tournament?.winner || derivedWinner}
            </h3>
            {(tournament?.runnerUp || derivedRunnerUp) && (
              <p className="text-text-muted">
                Runner-up: <span className="text-text">{(tournament?.runnerUp || derivedRunnerUp)?.name || tournament?.runnerUp || derivedRunnerUp}</span>
              </p>
            )}
            <button
              onClick={() => handleTeamClick(tournament?.winner || derivedWinner)}
              className="mt-4 btn btn-ghost text-gold hover:bg-gold/10"
            >
              View Champion Stats →
            </button>
          </div>
        </div>
      )}

      {/* Waiting State (No tournament) */}
      {(!tournament || tournament?.state === 'IDLE') && (
        <div className="mt-8 text-center py-12 bg-card rounded-2xl border border-border">
          <span className="text-6xl block mb-4">⏳</span>
          <h3 className="text-xl font-bold text-text mb-2">Waiting for Next Tournament</h3>
          <p className="text-text-muted mb-4">
            Tournaments run every hour starting at :55
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card-hover text-text-muted">
            <span>Next tournament starts at</span>
            <span className="font-mono font-bold text-primary">:55</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Connection Status Component
function ConnectionStatus({ connected, connecting, onReconnect }) {
  if (connected) {
    return (
      <div className="flex items-center justify-center gap-2 mb-4 py-2 px-4 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        Connected to live stream
      </div>
    )
  }

  if (connecting) {
    return (
      <div className="flex items-center justify-center gap-2 mb-4 py-2 px-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
        <LoadingSpinner size="sm" />
        Connecting...
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between mb-4 py-2 px-4 rounded-xl bg-live/10 border border-live/20 text-live text-sm">
      <span className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-live" />
        Disconnected
      </span>
      <button
        onClick={() => onReconnect(true)}
        className="text-xs font-medium underline hover:no-underline"
      >
        Reconnect
      </button>
    </div>
  )
}

// Tournament Header Component
function TournamentHeader({ tournament, stateConfig, currentRound }) {
  const isLive = ['ROUND_OF_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'].includes(tournament?.state)
  const isComplete = tournament?.state === 'RESULTS' || tournament?.state === 'COMPLETE'

  return (
    <div className={`
      relative overflow-hidden rounded-3xl mb-8 p-6 sm:p-8
      bg-gradient-to-br from-card via-card to-primary/5
      border transition-all duration-500
      ${isLive ? 'border-live/30 shadow-xl shadow-live/10' : isComplete ? 'border-gold/30' : 'border-border'}
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
          w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-5xl shadow-xl
          ${isComplete
            ? 'bg-gradient-to-br from-gold/30 to-yellow-500/20 shadow-gold/20'
            : isLive
              ? 'bg-gradient-to-br from-live/30 to-live/10 shadow-live/20 animate-pulse'
              : 'bg-gradient-to-br from-primary/20 to-primary/10 shadow-primary/20'}
        `}>
          {stateConfig.icon}
        </div>

        {/* Info */}
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-3 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-text">
              {stateConfig.title}
            </h1>
            {isLive && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-live/20 border border-live/30">
                <span className="w-2 h-2 rounded-full bg-live animate-pulse" />
                <span className="text-sm font-bold text-live">LIVE</span>
              </div>
            )}
          </div>
          <p className="text-text-muted">{stateConfig.subtitle}</p>

          {/* Round Progress Indicator */}
          {tournament && !['IDLE', 'SETUP', 'RESULTS', 'COMPLETE'].includes(tournament.state) && (
            <div className="mt-4 flex items-center gap-2">
              {ROUNDS.map((round, idx) => {
                const isPast = ROUNDS.indexOf(currentRound) > idx
                const isCurrent = currentRound === round

                return (
                  <div key={round} className="flex items-center gap-2">
                    <div className={`
                      w-3 h-3 rounded-full transition-all duration-300
                      ${isCurrent
                        ? 'bg-live w-4 h-4 animate-pulse'
                        : isPast
                          ? 'bg-primary'
                          : 'bg-border'}
                    `} />
                    {idx < ROUNDS.length - 1 && (
                      <div className={`
                        w-8 h-0.5 rounded-full transition-all duration-300
                        ${isPast ? 'bg-primary' : 'bg-border'}
                      `} />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Tournament ID */}
        {tournament?.tournamentId && (
          <div className="text-sm text-text-muted font-mono">
            #{tournament.tournamentId}
          </div>
        )}
      </div>
    </div>
  )
}
