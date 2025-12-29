import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import useLiveStore from '../stores/useLiveStore'
import useLiveEvents from '../hooks/useLiveEvents'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { useToast } from '../components/common/Toast'

const ROUNDS_ORDER = ['Round of 16', 'Quarter-finals', 'Semi-finals', 'Final']

const ROUND_NORMALIZATION = [
  { keys: ['roundof16', 'r16', 'round16', 'roundofsixteen'], value: 'Round of 16' },
  { keys: ['quarterfinals', 'quarter-finals', 'quarterfinal', 'quarter-finals', 'quarterfinals', 'quarter finals', 'qf'], value: 'Quarter-finals' },
  { keys: ['semifinals', 'semi-finals', 'semifinal', 'semi final', 'sf'], value: 'Semi-finals' },
  { keys: ['final', 'finals'], value: 'Final' },
]

function normalizeRound(name) {
  if (!name) return null
  const key = name.toString().toLowerCase().replace(/[\s-]/g, '')
  const found = ROUND_NORMALIZATION.find(entry => entry.keys.includes(key))
  return found ? found.value : null
}

const MATCH_STATE_CONFIG = {
  SCHEDULED: { label: 'Upcoming', color: 'bg-card-hover text-text-muted', dot: 'bg-text-muted' },
  FIRST_HALF: { label: '1H', color: 'bg-live/20 text-live', dot: 'bg-live', live: true },
  HALFTIME: { label: 'HT', color: 'bg-amber-500/20 text-amber-400', dot: 'bg-amber-400' },
  SECOND_HALF: { label: '2H', color: 'bg-live/20 text-live', dot: 'bg-live', live: true },
  EXTRA_TIME_1: { label: 'ET1', color: 'bg-orange-500/20 text-orange-400', dot: 'bg-orange-400', live: true },
  ET_HALFTIME: { label: 'ET-HT', color: 'bg-amber-500/20 text-amber-400', dot: 'bg-amber-400' },
  EXTRA_TIME_2: { label: 'ET2', color: 'bg-orange-500/20 text-orange-400', dot: 'bg-orange-400', live: true },
  PENALTIES: { label: 'PENS', color: 'bg-live/20 text-live', dot: 'bg-live', live: true },
  FINISHED: { label: 'FT', color: 'bg-primary/20 text-primary', dot: 'bg-primary' },
}

const TOURNAMENT_STATE_TO_ROUND = {
  ROUND_OF_16: 'Round of 16',
  QF_BREAK: 'Quarter-finals',
  QUARTER_FINALS: 'Quarter-finals',
  SF_BREAK: 'Semi-finals',
  SEMI_FINALS: 'Semi-finals',
  FINAL_BREAK: 'Final',
  FINAL: 'Final',
}

export default function FixtureList() {
  const { addToast } = useToast()
  
  const {
    tournament,
    fixtures,
    matches,
    completedMatches,
    lastCompletedTournament,
    lastCompletedFixtures,
    upcomingFixtures,
    error,
    isLoading,
    isInitialLoad,
    fetchSnapshot,
    handleEvent,
  } = useLiveStore()

  // Handle SSE events
  const onEvent = useCallback((event) => {
    handleEvent(event)
    
    if (event.type === 'goal') {
      const teamName = event.homeTeam?.id === event.teamId ? event.homeTeam?.name : event.awayTeam?.name
      addToast(`⚽ GOAL! ${event.displayName || ''} - ${teamName || ''}`, 'goal', 4000)
    } else if (event.type === 'match_end') {
      addToast(`🏁 Full Time: ${event.homeTeam?.name} ${event.score?.home}-${event.score?.away} ${event.awayTeam?.name}`, 'info', 5000)
    }
  }, [handleEvent, addToast])

  // Connect to SSE
  const { connected } = useLiveEvents({
    tournamentId: tournament?.tournamentId,
    onEvent,
    enabled: true,
  })

  // Fetch and poll for updates
  useEffect(() => {
    fetchSnapshot().catch(() => {})
    
    const pollInterval = setInterval(() => {
      fetchSnapshot().catch(() => {})
    }, 8000) // Poll every 8 seconds

    return () => clearInterval(pollInterval)
  }, [fetchSnapshot])

  // Prefer live tournament; if idle, fall back to last completed tournament/results
  const liveTournament = tournament?.state && tournament.state !== 'IDLE'
    ? tournament
    : (lastCompletedTournament || tournament)

  // Use fixtures array from store; if empty but we have last completed, use that
  const baseFixtures = fixtures.length > 0 ? fixtures : (liveTournament === lastCompletedTournament ? (lastCompletedFixtures || []) : [])
  const allMatches = baseFixtures.length > 0 ? baseFixtures : [...(completedMatches || []), ...(matches || [])]

  // Debug logging
  useEffect(() => {
    console.log('[Fixtures] State:', {
      tournamentState: liveTournament?.state,
      tournamentId: liveTournament?.tournamentId,
      fixtures: fixtures?.length,
      lastCompletedFixtures: lastCompletedFixtures?.length,
      activeMatches: matches?.length,
      completedMatches: completedMatches?.length,
      totalMatches: allMatches.length,
      upcomingFixtures: upcomingFixtures?.length,
    })
  }, [liveTournament, fixtures, lastCompletedFixtures, matches, completedMatches, allMatches.length, upcomingFixtures])
  
  // Get current round from tournament state
  const currentRound = normalizeRound(TOURNAMENT_STATE_TO_ROUND[liveTournament?.state])
  const isRoundActive = ['ROUND_OF_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'].includes(liveTournament?.state)
  const isBreak = liveTournament?.state?.includes('BREAK') || liveTournament?.state === 'SETUP'
  
  // Determine next round during breaks
  const nextRound = isBreak ? normalizeRound(getNextRound(liveTournament?.state)) : null

  // Group matches by round
  const matchesByRound = ROUNDS_ORDER.reduce((acc, round) => {
    acc[round] = []
    return acc
  }, {})

  allMatches.forEach(match => {
    const round = normalizeRound(match?.round)
    if (round && matchesByRound[round]) {
      matchesByRound[round].push(match)
    }
  })

  // Add upcoming fixtures to next round if available
  if (nextRound && upcomingFixtures?.length > 0) {
    matchesByRound[nextRound] = [...(matchesByRound[nextRound] || []), ...upcomingFixtures.filter(f => 
      !matchesByRound[nextRound]?.some(m => m.fixtureId === f.fixtureId)
    )]
  }

  // Calculate stats
  const liveMatches = allMatches.filter(m => MATCH_STATE_CONFIG[m.state]?.live)
  const completedCount = allMatches.filter(m => m.state === 'FINISHED' || m.isFinished).length
  const totalGoals = allMatches.reduce((sum, m) => sum + (m.score?.home || 0) + (m.score?.away || 0), 0)

  // Find current round index
  const currentRoundIndex = currentRound ? ROUNDS_ORDER.indexOf(currentRound) : -1
  const nextRoundIndex = nextRound ? ROUNDS_ORDER.indexOf(nextRound) : -1
  const activeRoundIndex = isRoundActive ? currentRoundIndex : nextRoundIndex

  if (isInitialLoad && isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-20">
          <LoadingSpinner size="lg" className="mb-4" />
          <p className="text-text-muted">Loading championship...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Championship Header */}
      <div className="bg-gradient-to-br from-card via-card to-primary/5 rounded-3xl border border-border p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
              <span className="text-3xl">🏆</span>
              <h1 className="text-2xl font-bold text-text">Championship</h1>
              {connected && (
                <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  LIVE
                </span>
              )}
            </div>
            <p className="text-text-muted">
              {tournament?.tournamentId 
                ? `Tournament #${tournament.tournamentId}`
                : 'Waiting for tournament...'}
              {tournament?.state && ` • ${formatTournamentState(tournament.state)}`}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4">
            <QuickStat value={liveMatches.length} label="Live" icon="🔴" highlight={liveMatches.length > 0} />
            <QuickStat value={completedCount} label="Played" icon="✅" />
            <QuickStat value={totalGoals} label="Goals" icon="⚽" />
          </div>
        </div>

        {/* Round Progress Bar */}
        <div className="mt-6 flex items-center justify-between gap-2">
          {ROUNDS_ORDER.map((round, idx) => {
            const roundMatches = matchesByRound[round] || []
            const isComplete = roundMatches.length > 0 && roundMatches.every(m => m.state === 'FINISHED' || m.isFinished)
            const isCurrent = currentRound === round && isRoundActive
            const isNext = nextRound === round
            const hasMatches = roundMatches.length > 0

            return (
              <div key={round} className="flex-1 flex items-center gap-2">
                <div className={`
                  flex-1 h-2 rounded-full transition-all
                  ${isComplete ? 'bg-primary' : 
                    isCurrent ? 'bg-live animate-pulse' : 
                    isNext ? 'bg-amber-500/50' : 
                    'bg-border'}
                `} />
                {idx < ROUNDS_ORDER.length - 1 && (
                  <div className={`w-2 h-2 rounded-full ${isComplete ? 'bg-primary' : 'bg-border'}`} />
                )}
              </div>
            )
          })}
        </div>
        <div className="mt-2 flex justify-between text-xs text-text-muted">
          {ROUNDS_ORDER.map(round => (
            <span key={round} className="text-center flex-1">{round.replace('Quarter-finals', 'QF').replace('Semi-finals', 'SF').replace('Round of 16', 'R16')}</span>
          ))}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-live/10 border border-live/20">
          <div className="flex items-center justify-between">
            <p className="text-live text-sm">{error}</p>
            <button onClick={() => fetchSnapshot()} className="btn btn-secondary text-xs">Retry</button>
          </div>
        </div>
      )}

      {/* Debug Info (temporary) */}
      {allMatches.length === 0 && liveTournament && (
        <div className="mb-6 p-4 rounded-xl bg-card border border-border text-sm">
          <p className="font-bold text-text mb-2">🔍 Debug Info:</p>
          <div className="space-y-1 text-text-muted font-mono text-xs">
            <p>• Tournament State: <span className="text-primary">{liveTournament.state}</span></p>
            <p>• Tournament ID: <span className="text-text">{liveTournament.tournamentId}</span></p>
            <p>• All Fixtures: <span className="text-text">{fixtures?.length || 0}</span></p>
            <p>• Active Matches: <span className="text-text">{matches?.length || 0}</span></p>
            <p>• Completed Matches: <span className="text-text">{completedMatches?.length || 0}</span></p>
            <p>• Current Round: <span className="text-text">{liveTournament.currentRound || 'N/A'}</span></p>
            <p>• Teams Remaining: <span className="text-text">{liveTournament.teamsRemaining || 'N/A'}</span></p>
          </div>
          <p className="text-xs text-text-muted mt-2">
            {liveTournament.state === 'SETUP' && 'Tournament is setting up - matches will appear when round starts'}
            {liveTournament.state?.includes('BREAK') && 'Between rounds - next round will start soon'}
            {liveTournament.state === 'IDLE' && 'Tournament hasn\'t started yet'}
          </p>
        </div>
      )}

      {/* Current/Next Round - Featured Section */}
      {(isRoundActive || isBreak) && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            {isRoundActive && <span className="w-3 h-3 rounded-full bg-live animate-pulse" />}
            <h2 className="text-xl font-bold text-text">
              {isRoundActive ? `🔴 ${currentRound} - Live` : `📋 ${nextRound || 'Next Round'} - Coming Up`}
            </h2>
          </div>

          <div className={`
            rounded-2xl border p-4
            ${isRoundActive ? 'bg-card border-live/30 shadow-lg shadow-live/10' : 'bg-card border-border'}
          `}>
            {(() => {
              const roundToShow = isRoundActive ? currentRound : nextRound
              const roundMatches = matchesByRound[roundToShow] || []
              
              if (roundMatches.length === 0) {
                return (
                  <div className="text-center py-8 text-text-muted">
                    <span className="text-4xl block mb-2">{isBreak ? '☕' : '⏳'}</span>
                    <p>{isBreak ? 'Fixtures will appear when the round starts' : 'Waiting for matches...'}</p>
                  </div>
                )
              }

              return (
                <div className={`grid gap-3 ${
                  roundMatches.length === 1 ? 'max-w-lg mx-auto' :
                  roundMatches.length === 2 ? 'sm:grid-cols-2' :
                  'sm:grid-cols-2 lg:grid-cols-4'
                }`}>
                  {roundMatches.map((match, idx) => (
                    <MatchCard key={match.fixtureId || idx} match={match} featured />
                  ))}
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Tournament Winner */}
      {tournament?.winner && (
        <div className="mb-8 bg-gradient-to-br from-gold/10 via-card to-gold/10 rounded-2xl border border-gold/30 p-6 text-center">
          <span className="text-5xl mb-3 block">🏆</span>
          <p className="text-gold text-sm font-semibold uppercase tracking-wider mb-1">Champion</p>
          <h3 className="text-2xl font-bold text-text mb-1">
            {tournament.winner?.name || tournament.winner}
          </h3>
          {tournament.runnerUp && (
            <p className="text-text-muted text-sm">
              Runner-up: {tournament.runnerUp?.name || tournament.runnerUp}
            </p>
          )}
        </div>
      )}

      {/* Previous Rounds Results */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-text-muted uppercase tracking-wider">
          {allMatches.length > 0 ? 'All Rounds' : 'Tournament Rounds'}
        </h2>

        {[...ROUNDS_ORDER].reverse().map((round, roundIdx) => {
          const roundMatches = matchesByRound[round] || []
          const isCurrentlyFeatured = (isRoundActive && currentRound === round) || (!isRoundActive && nextRound === round)
          
          // Skip if already shown in featured section and has matches
          if (isCurrentlyFeatured && roundMatches.length > 0) return null

          const isComplete = roundMatches.length > 0 && roundMatches.every(m => m.state === 'FINISHED' || m.isFinished)
          const hasLive = roundMatches.some(m => MATCH_STATE_CONFIG[m.state]?.live)

          return (
            <div 
              key={round}
              className={`
                rounded-2xl border overflow-hidden
                ${hasLive ? 'border-live/30' : isComplete ? 'border-primary/20' : 'border-border'}
              `}
            >
              {/* Round Header */}
              <div className={`
                px-4 py-3 flex items-center justify-between
                ${hasLive ? 'bg-live/10' : isComplete ? 'bg-primary/5' : 'bg-card-hover/50'}
              `}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{getRoundIcon(round)}</span>
                  <h3 className="font-bold text-text">{round}</h3>
                  {hasLive && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-live/20 text-live text-xs font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-live animate-pulse" />
                      LIVE
                    </span>
                  )}
                  {isComplete && !hasLive && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-semibold">
                      Complete
                    </span>
                  )}
                </div>
                <span className="text-sm text-text-muted">
                  {roundMatches.length} {roundMatches.length === 1 ? 'match' : 'matches'}
                </span>
              </div>

              {/* Matches */}
              <div className="p-4">
                {roundMatches.length === 0 ? (
                  <div className="text-center py-6 text-text-muted">
                    <p>Waiting for previous round to complete...</p>
                  </div>
                ) : (
                  <div className={`grid gap-3 ${
                    roundMatches.length === 1 ? 'max-w-lg mx-auto' :
                    roundMatches.length === 2 ? 'sm:grid-cols-2' :
                    'sm:grid-cols-2 lg:grid-cols-4'
                  }`}>
                    {roundMatches.map((match, idx) => (
                      <MatchCard key={match.fixtureId || idx} match={match} />
                    ))}
                  </div>
                )}
              </div>

              {/* Winners Summary */}
              {isComplete && roundMatches.length > 0 && (
                <div className="px-4 pb-4">
                  <div className="bg-primary/5 rounded-xl p-3">
                    <p className="text-xs text-text-muted mb-2">
                      {round === 'Final' ? '🏆 Winner' : '➡️ Advanced'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {roundMatches.map((m, idx) => {
                        const winner = getMatchWinner(m)
                        return winner ? (
                          <span key={idx} className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-sm font-medium">
                            {winner}
                          </span>
                        ) : null
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* No Tournament State */}
      {(!tournament || tournament?.state === 'IDLE') && allMatches.length === 0 && (
        <div className="text-center py-12 bg-card rounded-2xl border border-border">
          <span className="text-6xl block mb-4">⏳</span>
          <h3 className="text-xl font-bold text-text mb-2">Waiting for Tournament</h3>
          <p className="text-text-muted mb-4">
            New tournaments start every hour at :55
          </p>
          <Link to="/live" className="btn btn-primary">
            Go to Live Dashboard
          </Link>
        </div>
      )}
    </div>
  )
}

// Helper Components
function QuickStat({ value, label, icon, highlight }) {
  return (
    <div className={`text-center px-3 py-2 rounded-xl ${highlight ? 'bg-live/10' : 'bg-card-hover/50'}`}>
      <span className="text-sm">{icon}</span>
      <p className={`text-xl font-bold ${highlight ? 'text-live' : 'text-text'}`}>{value}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </div>
  )
}

function MatchCard({ match, featured = false }) {
  const { fixtureId, state, minute, score, penaltyScore, homeTeam, awayTeam } = match
  const stateConfig = MATCH_STATE_CONFIG[state] || MATCH_STATE_CONFIG.SCHEDULED
  const isLive = stateConfig.live
  const isFinished = state === 'FINISHED' || match.isFinished

  const homeWon = isFinished && (
    (score?.home > score?.away) || 
    (score?.home === score?.away && penaltyScore?.home > penaltyScore?.away)
  )
  const awayWon = isFinished && (
    (score?.away > score?.home) || 
    (score?.home === score?.away && penaltyScore?.away > penaltyScore?.home)
  )

  return (
    <Link
      to={`/live/${fixtureId}`}
      className={`
        block p-3 rounded-xl border transition-all
        ${isLive 
          ? 'bg-card border-live/40 shadow-md shadow-live/10' 
          : 'bg-card border-border hover:border-primary/30'}
        ${featured ? 'p-4' : ''}
      `}
    >
      {/* Status */}
      <div className="flex items-center justify-between mb-2">
        <span className={`
          inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold
          ${stateConfig.color}
        `}>
          {isLive && <span className={`w-1.5 h-1.5 rounded-full ${stateConfig.dot} animate-pulse`} />}
          {isLive && minute !== undefined ? `${minute}'` : stateConfig.label}
        </span>
        
        {(penaltyScore?.home > 0 || penaltyScore?.away > 0) && (
          <span className="text-xs text-text-muted">
            P: {penaltyScore.home}-{penaltyScore.away}
          </span>
        )}
      </div>

      {/* Teams & Score */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className={`
            flex-1 text-sm font-medium truncate
            ${homeWon ? 'text-primary' : isFinished && awayWon ? 'text-text-muted' : 'text-text'}
          `}>
            {homeWon && '✓ '}{homeTeam?.name || 'TBD'}
          </span>
          <span className={`
            text-lg font-bold font-mono min-w-[24px] text-right
            ${homeWon ? 'text-primary' : isFinished && awayWon ? 'text-text-muted' : 'text-text'}
            ${isLive ? 'animate-pulse' : ''}
          `}>
            {score?.home ?? '-'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className={`
            flex-1 text-sm font-medium truncate
            ${awayWon ? 'text-primary' : isFinished && homeWon ? 'text-text-muted' : 'text-text'}
          `}>
            {awayWon && '✓ '}{awayTeam?.name || 'TBD'}
          </span>
          <span className={`
            text-lg font-bold font-mono min-w-[24px] text-right
            ${awayWon ? 'text-primary' : isFinished && homeWon ? 'text-text-muted' : 'text-text'}
            ${isLive ? 'animate-pulse' : ''}
          `}>
            {score?.away ?? '-'}
          </span>
        </div>
      </div>
    </Link>
  )
}

// Helper Functions
function getNextRound(state) {
  const map = {
    SETUP: 'Round of 16',
    QF_BREAK: 'Quarter-finals',
    SF_BREAK: 'Semi-finals',
    FINAL_BREAK: 'Final',
  }
  return map[state] || null
}

function getRoundIcon(round) {
  const icons = {
    'Round of 16': '🏟️',
    'Quarter-finals': '🔥',
    'Semi-finals': '⚡',
    'Final': '🏆',
  }
  return icons[round] || '📋'
}

function formatTournamentState(state) {
  const labels = {
    IDLE: 'Waiting',
    SETUP: 'Starting Soon',
    ROUND_OF_16: 'Round of 16',
    QF_BREAK: 'QF Starting',
    QUARTER_FINALS: 'Quarter-Finals',
    SF_BREAK: 'SF Starting',
    SEMI_FINALS: 'Semi-Finals',
    FINAL_BREAK: 'Final Starting',
    FINAL: 'The Final',
    RESULTS: 'Complete',
    COMPLETE: 'Complete',
  }
  return labels[state] || state
}

function getMatchWinner(match) {
  if (match.state !== 'FINISHED' && !match.isFinished) return null

  // Prefer explicit winnerId if provided by backend
  const winnerId = match.winnerId || match.winner?.id
  if (winnerId) {
    if (match.homeTeam?.id === winnerId) return match.homeTeam?.name
    if (match.awayTeam?.id === winnerId) return match.awayTeam?.name
  }
  
  const homeScore = Number(match.score?.home ?? 0)
  const awayScore = Number(match.score?.away ?? 0)
  const homePens = Number(match.penaltyScore?.home ?? 0)
  const awayPens = Number(match.penaltyScore?.away ?? 0)
  const homeWon = (homeScore > awayScore) || (homeScore === awayScore && homePens > awayPens)
  
  return homeWon ? match.homeTeam?.name : match.awayTeam?.name
}
