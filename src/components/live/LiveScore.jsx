import { useMemo } from 'react'

export default function LiveScore({ fixture, events }) {
  // Calculate score from events
  const score = useMemo(() => {
    if (!events || events.length === 0) {
      return {
        home: fixture?.home_score ?? 0,
        away: fixture?.away_score ?? 0
      }
    }

    const goals = events.filter(e => e.event_type === 'goal' || e.event_type === 'penalty_goal')
    
    let home = 0
    let away = 0
    
    goals.forEach(goal => {
      if (goal.team_name === fixture?.home_team) {
        home++
      } else if (goal.team_name === fixture?.away_team) {
        away++
      }
    })

    return { home, away }
  }, [events, fixture])

  if (!fixture) return null

  return (
    <div className="flex items-center justify-center gap-6 py-6">
      {/* Home Team */}
      <div className="flex-1 text-center">
        <div className="w-20 h-20 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-4xl shadow-lg">
          ⚽
        </div>
        <h2 className="text-lg font-bold text-text truncate px-2">
          {fixture.home_team}
        </h2>
      </div>

      {/* Score */}
      <div className="text-center px-4">
        <div className="flex items-center gap-4">
          <ScoreDigit value={score.home} isScorer={score.home > 0} />
          <span className="text-3xl text-text-muted">-</span>
          <ScoreDigit value={score.away} isScorer={score.away > 0} />
        </div>
      </div>

      {/* Away Team */}
      <div className="flex-1 text-center">
        <div className="w-20 h-20 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-blue-500/30 to-blue-500/10 flex items-center justify-center text-4xl shadow-lg">
          ⚽
        </div>
        <h2 className="text-lg font-bold text-text truncate px-2">
          {fixture.away_team}
        </h2>
      </div>
    </div>
  )
}

function ScoreDigit({ value, isScorer }) {
  return (
    <div className={`
      w-16 h-20 rounded-xl flex items-center justify-center
      text-5xl font-bold transition-all duration-300
      ${isScorer ? 'bg-primary/20 text-primary shadow-lg shadow-primary/25' : 'bg-card text-text'}
    `}>
      {value}
    </div>
  )
}

