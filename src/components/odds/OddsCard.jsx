import { Link } from 'react-router-dom'
import { formatOdds, formatDate, formatTime } from '../../utils/formatters'
import ProbabilityBar from './ProbabilityBar'

export default function OddsCard({ fixture, odds }) {
  const {
    fixture_id,
    home_team,
    away_team,
    scheduled_time,
    tournament_name,
    round_number
  } = fixture

  const homeOdds = odds?.home_odds || odds?.home_win_odds
  const awayOdds = odds?.away_odds || odds?.away_win_odds
  const drawOdds = odds?.draw_odds

  // Convert odds to implied probability
  const homeProbability = homeOdds ? 1 / homeOdds : 0.33
  const awayProbability = awayOdds ? 1 / awayOdds : 0.33
  const drawProbability = drawOdds ? 1 / drawOdds : 0.34

  // Normalize probabilities
  const total = homeProbability + awayProbability + drawProbability
  const normalizedHome = homeProbability / total
  const normalizedAway = awayProbability / total
  const normalizedDraw = drawProbability / total

  return (
    <Link to={`/fixtures/${fixture_id}`}>
      <div className="card card-hover">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 text-xs text-text-muted">
          <div className="flex items-center gap-2">
            {tournament_name && (
              <span className="px-2 py-0.5 bg-card-hover rounded-md">{tournament_name}</span>
            )}
            {round_number && <span>R{round_number}</span>}
          </div>
          <div>
            <span className="font-medium">{formatDate(scheduled_time)}</span>
            <span className="mx-1">•</span>
            <span>{formatTime(scheduled_time)}</span>
          </div>
        </div>

        {/* Teams & Odds Grid */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Home */}
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-xl">
              ⚽
            </div>
            <p className="font-semibold text-sm truncate mb-2" title={home_team}>
              {home_team}
            </p>
            <div className="px-3 py-2 rounded-lg bg-primary/10 border border-primary/30">
              <span className="text-lg font-bold text-primary">
                {formatOdds(homeOdds)}
              </span>
            </div>
          </div>

          {/* Draw */}
          <div className="text-center flex flex-col justify-end">
            <p className="text-xs text-text-muted mb-2">Draw</p>
            <div className="px-3 py-2 rounded-lg bg-card-hover border border-border">
              <span className="text-lg font-bold text-text-muted">
                {formatOdds(drawOdds)}
              </span>
            </div>
          </div>

          {/* Away */}
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center text-xl">
              ⚽
            </div>
            <p className="font-semibold text-sm truncate mb-2" title={away_team}>
              {away_team}
            </p>
            <div className="px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <span className="text-lg font-bold text-blue-400">
                {formatOdds(awayOdds)}
              </span>
            </div>
          </div>
        </div>

        {/* Probability Bar */}
        <ProbabilityBar 
          home={normalizedHome} 
          draw={normalizedDraw} 
          away={normalizedAway}
          homeLabel={home_team}
          awayLabel={away_team}
        />

        {/* Factors tooltip hint */}
        {odds?.factors && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-text-muted text-center">
              📊 Based on form, strength, and GK ratings
            </p>
          </div>
        )}
      </div>
    </Link>
  )
}

