import { formatRating } from '../../utils/formatters'

export default function PlayerList({ players }) {
  if (!players || players.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted">
        No players found
      </div>
    )
  }

  // Sort by overall rating
  const sortedPlayers = [...players].sort((a, b) => {
    const aRating = (a.attack_rating || 0) + (a.defense_rating || 0) + (a.gk_rating || 0)
    const bRating = (b.attack_rating || 0) + (b.defense_rating || 0) + (b.gk_rating || 0)
    return bRating - aRating
  })

  return (
    <div className="space-y-2">
      {sortedPlayers.map((player, index) => (
        <PlayerRow key={player.player_id || index} player={player} rank={index + 1} />
      ))}
    </div>
  )
}

function PlayerRow({ player, rank }) {
  const { player_name, attack_rating, defense_rating, gk_rating, position } = player
  
  const isGK = position?.toLowerCase() === 'gk' || gk_rating > Math.max(attack_rating || 0, defense_rating || 0)
  const primaryRating = isGK ? gk_rating : Math.max(attack_rating || 0, defense_rating || 0)
  
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-card hover:bg-card-hover transition-colors group">
      {/* Rank */}
      <span className="w-6 text-center text-sm text-text-muted">#{rank}</span>

      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-lg">
        {isGK ? '🧤' : '👤'}
      </div>

      {/* Name & Position */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text truncate group-hover:text-primary transition-colors">
          {player_name}
        </p>
        <p className="text-xs text-text-muted">
          {position || (isGK ? 'Goalkeeper' : 'Outfield')}
        </p>
      </div>

      {/* Ratings */}
      <div className="flex items-center gap-3 text-sm">
        {!isGK && (
          <>
            <div className="text-center">
              <div className="text-xs text-text-muted">ATK</div>
              <div className="text-green-400 font-semibold">{formatRating(attack_rating)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-text-muted">DEF</div>
              <div className="text-blue-400 font-semibold">{formatRating(defense_rating)}</div>
            </div>
          </>
        )}
        {isGK && (
          <div className="text-center">
            <div className="text-xs text-text-muted">GK</div>
            <div className="text-yellow-400 font-semibold">{formatRating(gk_rating)}</div>
          </div>
        )}
      </div>

      {/* Overall */}
      <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
        <span className="text-primary font-bold">{formatRating(primaryRating)}</span>
      </div>
    </div>
  )
}

