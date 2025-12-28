import { Link } from 'react-router-dom'
import { formatDate, formatTime, getStatusBadge, formatScore } from '../../utils/formatters'

export default function FixtureCard({ fixture, showLink = true }) {
  const {
    fixture_id,
    home_team,
    away_team,
    home_score,
    away_score,
    status,
    scheduled_time,
    round,
    tournament_name
  } = fixture

  const statusBadge = getStatusBadge(status)
  const isLive = status?.toLowerCase() === 'live'
  const isCompleted = status?.toLowerCase() === 'completed'

  // Determine winner for styling
  const homeWon = isCompleted && home_score > away_score
  const awayWon = isCompleted && away_score > home_score

  const content = (
    <div className={`card card-hover ${isLive ? 'border-primary/50 shadow-lg shadow-primary/10' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          {tournament_name && (
            <span className="px-2 py-0.5 bg-card-hover rounded-md">{tournament_name}</span>
          )}
          {round && <span className="text-primary">{round}</span>}
        </div>
        <span className={`badge ${statusBadge.class}`}>
          {statusBadge.text}
        </span>
      </div>

      {/* Teams & Score */}
      <div className="flex items-center justify-between gap-4">
        {/* Home Team */}
        <div className="flex-1 text-center">
          <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center text-2xl ${
            homeWon 
              ? 'bg-gradient-to-br from-primary/30 to-primary/10 ring-2 ring-primary' 
              : 'bg-gradient-to-br from-primary/20 to-primary/5'
          }`}>
            ⚽
          </div>
          <p className={`font-semibold text-sm truncate ${homeWon ? 'text-primary' : 'text-text'}`} title={home_team}>
            {home_team}
          </p>
        </div>

        {/* Score */}
        <div className="text-center px-4">
          {status === 'scheduled' ? (
            <div className="text-text-muted">
              {scheduled_time ? (
                <>
                  <p className="text-sm font-medium">{formatTime(scheduled_time)}</p>
                  <p className="text-xs">{formatDate(scheduled_time)}</p>
                </>
              ) : (
                <p className="text-lg font-bold text-text-muted">vs</p>
              )}
            </div>
          ) : (
            <div className={`text-2xl font-bold ${isLive ? 'text-primary' : 'text-text'}`}>
              <span className={homeWon ? 'text-primary' : ''}>{home_score ?? 0}</span>
              <span className="text-text-muted mx-1">-</span>
              <span className={awayWon ? 'text-primary' : ''}>{away_score ?? 0}</span>
            </div>
          )}
        </div>

        {/* Away Team */}
        <div className="flex-1 text-center">
          <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center text-2xl ${
            awayWon 
              ? 'bg-gradient-to-br from-blue-500/30 to-blue-500/10 ring-2 ring-blue-500' 
              : 'bg-gradient-to-br from-blue-500/20 to-blue-500/5'
          }`}>
            ⚽
          </div>
          <p className={`font-semibold text-sm truncate ${awayWon ? 'text-blue-400' : 'text-text'}`} title={away_team}>
            {away_team}
          </p>
        </div>
      </div>

      {/* Live indicator */}
      {isLive && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-center gap-2 text-primary text-sm">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>Match in progress</span>
          </div>
        </div>
      )}

      {/* Winner indicator */}
      {isCompleted && (homeWon || awayWon) && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-center gap-2 text-text-muted text-sm">
            <span>🏆</span>
            <span>{homeWon ? home_team : away_team} wins</span>
          </div>
        </div>
      )}
    </div>
  )

  if (showLink && fixture_id) {
    return (
      <Link to={isLive ? `/fixtures/${fixture_id}/live` : `/fixtures/${fixture_id}`}>
        {content}
      </Link>
    )
  }

  return content
}
