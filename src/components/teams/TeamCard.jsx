import { Link } from 'react-router-dom'
import { formatRating } from '../../utils/formatters'

export default function TeamCard({ team, rank }) {
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
      <div className="card card-hover group relative overflow-hidden">
        {/* Rank badge */}
        {rank && rank <= 3 && (
          <div className={`
            absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold
            ${rank === 1 
              ? 'bg-gold/20 text-gold' 
              : rank === 2 
                ? 'bg-gray-400/20 text-gray-400' 
                : 'bg-orange-600/20 text-orange-400'}
          `}>
            #{rank}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-2xl shadow-lg shadow-primary/25 group-hover:shadow-primary/40 group-hover:scale-105 transition-all">
            ⚽
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-text truncate group-hover:text-primary transition-colors">
              {team_name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <span className="text-primary font-bold">{formatRating(overallRating)}</span>
              <span className="text-xs">OVR</span>
              {cups_won > 0 && (
                <span className="flex items-center gap-1 text-gold">
                  🏆 <span className="font-semibold">{cups_won}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Ratings Mini Bar */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <MiniRating label="ATK" value={attack_rating} color="bg-green-400" />
          <MiniRating label="DEF" value={defense_rating} color="bg-blue-400" />
          <MiniRating label="GK" value={gk_rating} color="bg-yellow-400" />
        </div>

        {/* Record */}
        <div className="flex items-center justify-between pt-3 border-t border-border text-sm">
          <div className="flex items-center gap-3">
            <span className="text-win font-semibold">{wins || 0}W</span>
            <span className="text-loss font-semibold">{losses || 0}L</span>
          </div>
          <div className="flex items-center gap-2 text-text-muted">
            <span className="font-mono">{goals_for || 0}</span>
            <span>:</span>
            <span className="font-mono">{goals_against || 0}</span>
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${goalDiff >= 0 ? 'bg-win/20 text-win' : 'bg-loss/20 text-loss'}`}>
              {goalDiff >= 0 ? '+' : ''}{goalDiff}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

function MiniRating({ label, value, color }) {
  const rating = value || 0
  const percentage = (rating / 100) * 100

  return (
    <div className="text-center p-2 rounded-lg bg-card-hover/50">
      <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">{label}</div>
      <div className="text-sm font-bold text-text">{formatRating(rating)}</div>
      <div className="stat-bar mt-1.5">
        <div 
          className={`stat-bar-fill ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
