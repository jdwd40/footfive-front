import { Link } from 'react-router-dom'

/**
 * Tournament bracket visualization
 * Shows R16 → QF → SF → Final progression
 */
export default function TournamentBracket({ matches = [], winner = null }) {
  // Group matches by round
  const rounds = {
    r16: matches.filter(m => m.round === 'Round of 16' || m.round === 'R16'),
    qf: matches.filter(m => m.round === 'Quarter-finals' || m.round === 'QF'),
    sf: matches.filter(m => m.round === 'Semi-finals' || m.round === 'SF'),
    final: matches.filter(m => m.round === 'Final'),
  }

  // Calculate winner from match score
  const getMatchWinner = (match) => {
    if (!match?.isFinished && match?.state !== 'FINISHED') return null
    const { score, penaltyScore, homeTeam, awayTeam } = match
    
    if (!score) return null
    
    // Check penalty score first
    if (penaltyScore?.home > penaltyScore?.away) return homeTeam
    if (penaltyScore?.away > penaltyScore?.home) return awayTeam
    
    // Regular score
    if (score.home > score.away) return homeTeam
    if (score.away > score.home) return awayTeam
    
    return null
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="min-w-[900px] flex items-stretch gap-4">
        {/* Round of 16 */}
        <BracketRound 
          title="Round of 16" 
          matches={rounds.r16} 
          getWinner={getMatchWinner}
          expectedCount={8}
        />

        {/* Quarter-Finals */}
        <BracketRound 
          title="Quarter-Finals" 
          matches={rounds.qf}
          getWinner={getMatchWinner}
          expectedCount={4}
        />

        {/* Semi-Finals */}
        <BracketRound 
          title="Semi-Finals" 
          matches={rounds.sf}
          getWinner={getMatchWinner}
          expectedCount={2}
        />

        {/* Final */}
        <BracketRound 
          title="Final" 
          matches={rounds.final}
          getWinner={getMatchWinner}
          expectedCount={1}
          isFinal
        />

        {/* Winner */}
        <div className="flex-shrink-0 w-40 flex flex-col justify-center">
          <div className="text-center">
            <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Champion</div>
            <div className={`
              p-4 rounded-xl border-2
              ${winner 
                ? 'bg-gradient-to-br from-yellow-500/20 to-primary/20 border-yellow-500/50' 
                : 'bg-card border-dashed border-border'}
            `}>
              {winner ? (
                <>
                  <div className="text-3xl mb-2">🏆</div>
                  <div className="font-bold text-text">{winner.name || winner}</div>
                </>
              ) : (
                <>
                  <div className="text-3xl mb-2 opacity-30">🏆</div>
                  <div className="text-text-muted text-sm">TBD</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BracketRound({ title, matches, getWinner, expectedCount, isFinal = false }) {
  // Pad with placeholder matches if needed
  const paddedMatches = [...matches]
  while (paddedMatches.length < expectedCount) {
    paddedMatches.push(null)
  }

  return (
    <div className={`flex-shrink-0 ${isFinal ? 'w-44' : 'w-48'}`}>
      <div className="text-xs text-text-muted uppercase tracking-wider text-center mb-3">
        {title}
      </div>
      <div className={`flex flex-col justify-around h-full gap-2 ${isFinal ? 'py-24' : ''}`}>
        {paddedMatches.map((match, idx) => (
          <BracketMatch 
            key={match?.fixtureId || `placeholder-${idx}`}
            match={match}
            winner={match ? getWinner(match) : null}
            isFinal={isFinal}
          />
        ))}
      </div>
    </div>
  )
}

function BracketMatch({ match, winner, isFinal }) {
  if (!match) {
    // Placeholder for TBD match
    return (
      <div className={`
        rounded-lg border border-dashed border-border bg-card/30 p-2
        ${isFinal ? 'p-3' : ''}
      `}>
        <div className="flex items-center justify-between text-xs text-text-muted py-1">
          <span>TBD</span>
          <span>-</span>
        </div>
        <div className="flex items-center justify-between text-xs text-text-muted py-1">
          <span>TBD</span>
          <span>-</span>
        </div>
      </div>
    )
  }

  const { fixtureId, homeTeam, awayTeam, score, penaltyScore, state, isFinished } = match
  const isLive = ['FIRST_HALF', 'SECOND_HALF', 'EXTRA_TIME_1', 'EXTRA_TIME_2', 'PENALTIES', 'HALFTIME'].includes(state)
  const isComplete = state === 'FINISHED' || isFinished
  const hasPens = penaltyScore?.home > 0 || penaltyScore?.away > 0

  const homeWon = winner?.id === homeTeam?.id || winner?.name === homeTeam?.name
  const awayWon = winner?.id === awayTeam?.id || winner?.name === awayTeam?.name

  return (
    <Link
      to={`/live/${fixtureId}`}
      className={`
        block rounded-lg border transition-all
        ${isLive 
          ? 'border-primary/50 bg-primary/10 shadow-md shadow-primary/20' 
          : isComplete 
            ? 'border-border bg-card/80' 
            : 'border-border bg-card hover:border-primary/30'}
        ${isFinal ? 'p-3' : 'p-2'}
      `}
    >
      {/* Home Team */}
      <div className={`
        flex items-center justify-between text-xs py-1
        ${homeWon ? 'text-primary font-semibold' : 'text-text'}
      `}>
        <span className="truncate flex-1">{homeTeam?.name || 'TBD'}</span>
        <span className="ml-2 tabular-nums">
          {score?.home ?? '-'}
          {hasPens && homeWon && <span className="text-[10px] ml-1">({penaltyScore.home})</span>}
        </span>
      </div>

      {/* Away Team */}
      <div className={`
        flex items-center justify-between text-xs py-1
        ${awayWon ? 'text-primary font-semibold' : 'text-text'}
      `}>
        <span className="truncate flex-1">{awayTeam?.name || 'TBD'}</span>
        <span className="ml-2 tabular-nums">
          {score?.away ?? '-'}
          {hasPens && awayWon && <span className="text-[10px] ml-1">({penaltyScore.away})</span>}
        </span>
      </div>

      {/* Status Indicator */}
      {isLive && (
        <div className="mt-1 flex items-center justify-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] text-primary font-medium">LIVE</span>
        </div>
      )}
    </Link>
  )
}

// Compact version for sidebar or mobile
export function BracketCompact({ matches = [], currentRound = '' }) {
  const roundOrder = ['Round of 16', 'Quarter-finals', 'Semi-finals', 'Final']
  const currentIndex = roundOrder.findIndex(r => 
    currentRound.toLowerCase().includes(r.toLowerCase().replace('-', ''))
  )

  return (
    <div className="space-y-2">
      {roundOrder.map((round, idx) => {
        const isComplete = idx < currentIndex
        const isCurrent = idx === currentIndex
        const roundMatches = matches.filter(m => 
          m.round?.toLowerCase().includes(round.toLowerCase().replace('-', ''))
        )

        return (
          <div 
            key={round}
            className={`
              flex items-center gap-3 p-2 rounded-lg
              ${isCurrent ? 'bg-primary/10 border border-primary/30' : 'bg-card/50'}
            `}
          >
            <div className={`
              w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
              ${isComplete ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-primary text-white' : 'bg-card-hover text-text-muted'}
            `}>
              {isComplete ? '✓' : idx + 1}
            </div>
            <div className="flex-1">
              <div className={`text-sm font-medium ${isCurrent ? 'text-primary' : 'text-text'}`}>
                {round}
              </div>
              {roundMatches.length > 0 && (
                <div className="text-xs text-text-muted">
                  {roundMatches.filter(m => m.isFinished || m.state === 'FINISHED').length}/{roundMatches.length} complete
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

