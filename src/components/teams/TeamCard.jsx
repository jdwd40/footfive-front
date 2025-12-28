import { Link } from 'react-router-dom'
import { formatRating } from '../../utils/formatters'

export default function TeamCard({ team }) {
  const {
    team_name,
    attack_rating,
    defense_rating,
    gk_rating,
    wins,
    losses,
    goals_for,
    goals_against,
    cups_won
  } = team

  const overallRating = ((attack_rating || 0) + (defense_rating || 0) + (gk_rating || 0)) / 3
  const goalDiff = (goals_for || 0) - (goals_against || 0)

  return (
    <Link to={`/teams/${encodeURIComponent(team_name)}`}>
      <div className="card card-hover group">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-2xl shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow">
            ⚽
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-text truncate group-hover:text-primary transition-colors">
              {team_name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <span className="text-primary font-semibold">{formatRating(overallRating)}</span>
              <span>Overall</span>
              {cups_won > 0 && (
                <span className="flex items-center gap-1 text-yellow-500">
                  🏆 {cups_won}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Ratings */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <RatingStat label="ATK" value={attack_rating} color="text-green-400" />
          <RatingStat label="DEF" value={defense_rating} color="text-blue-400" />
          <RatingStat label="GK" value={gk_rating} color="text-yellow-400" />
        </div>

        {/* Record */}
        <div className="flex items-center justify-between pt-4 border-t border-border text-sm">
          <div className="flex items-center gap-4">
            <span className="text-win font-medium">{wins || 0}W</span>
            <span className="text-loss font-medium">{losses || 0}L</span>
          </div>
          <div className="text-text-muted">
            <span className="text-text">{goals_for || 0}</span>
            <span className="mx-1">:</span>
            <span className="text-text">{goals_against || 0}</span>
            <span className={`ml-2 ${goalDiff >= 0 ? 'text-win' : 'text-loss'}`}>
              ({goalDiff >= 0 ? '+' : ''}{goalDiff})
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

function RatingStat({ label, value, color }) {
  const rating = value || 0
  const percentage = (rating / 100) * 100

  return (
    <div className="text-center p-2 rounded-lg bg-card-hover/50">
      <div className="text-xs text-text-muted mb-1">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{formatRating(rating)}</div>
      <div className="stat-bar mt-1">
        <div 
          className={`stat-bar-fill ${color.replace('text-', 'bg-')}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

