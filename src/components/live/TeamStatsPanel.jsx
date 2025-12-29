import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { teamsApi } from '../../api/client'
import { formatRating } from '../../utils/formatters'

export default function TeamStatsPanel({ team, isOpen, onClose }) {
  const [teamData, setTeamData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && team?.name) {
      fetchTeamData()
    }
  }, [isOpen, team?.name])

  const fetchTeamData = async () => {
    setLoading(true)
    try {
      const { data } = await teamsApi.getTop16()
      const found = data?.find(t => t.team_name === team.name)
      setTeamData(found)
    } catch (err) {
      console.error('Failed to fetch team:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-bg/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`
        fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border z-50
        transform transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        overflow-y-auto
      `}>
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-text">Team Stats</h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-card-hover flex items-center justify-center text-text-muted hover:text-text transition-colors"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-20 bg-card-hover rounded-xl" />
              <div className="h-32 bg-card-hover rounded-xl" />
              <div className="h-24 bg-card-hover rounded-xl" />
            </div>
          </div>
        ) : teamData ? (
          <div className="p-4 space-y-4">
            {/* Team Header */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-5 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-4xl shadow-lg shadow-primary/30">
                ⚽
              </div>
              <h3 className="text-2xl font-bold text-text mb-1">{teamData.team_name}</h3>
              <div className="flex items-center justify-center gap-3 text-text-muted">
                <span>Overall: <span className="text-primary font-bold">{formatRating(getOverallRating(teamData))}</span></span>
                {teamData.cups_won > 0 && (
                  <span className="flex items-center gap-1 text-gold">
                    🏆 {teamData.cups_won}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Wins" value={teamData.wins || 0} color="text-win" />
              <StatCard label="Losses" value={teamData.losses || 0} color="text-loss" />
              <StatCard label="Goals For" value={teamData.goals_for || 0} color="text-primary" />
              <StatCard label="Goals Against" value={teamData.goals_against || 0} color="text-text-muted" />
            </div>

            {/* Goal Difference */}
            <div className="bg-card-hover rounded-xl p-4 text-center">
              <p className="text-sm text-text-muted mb-1">Goal Difference</p>
              <p className={`text-3xl font-bold ${
                (teamData.goals_for - teamData.goals_against) >= 0 ? 'text-win' : 'text-loss'
              }`}>
                {(teamData.goals_for - teamData.goals_against) >= 0 ? '+' : ''}
                {(teamData.goals_for || 0) - (teamData.goals_against || 0)}
              </p>
            </div>

            {/* Ratings */}
            <div className="bg-card-hover rounded-xl p-4 space-y-3">
              <h4 className="font-semibold text-text mb-3">Team Ratings</h4>
              <RatingBar label="Attack" value={teamData.attack_rating} color="bg-green-400" />
              <RatingBar label="Defense" value={teamData.defense_rating} color="bg-blue-400" />
              <RatingBar label="Goalkeeper" value={teamData.gk_rating} color="bg-yellow-400" />
            </div>

            {/* Trophies */}
            {(teamData.cups_won > 0 || teamData.runner_ups > 0) && (
              <div className="bg-gradient-to-br from-gold/10 to-gold/5 rounded-xl p-4 border border-gold/20">
                <h4 className="font-semibold text-text mb-3">Trophy Cabinet</h4>
                <div className="flex justify-center gap-6">
                  <div className="text-center">
                    <span className="text-3xl mb-1 block">🏆</span>
                    <p className="text-2xl font-bold text-gold">{teamData.cups_won || 0}</p>
                    <p className="text-xs text-text-muted">Wins</p>
                  </div>
                  <div className="text-center">
                    <span className="text-3xl mb-1 block">🥈</span>
                    <p className="text-2xl font-bold text-text-muted">{teamData.runner_ups || 0}</p>
                    <p className="text-xs text-text-muted">Runner-up</p>
                  </div>
                </div>
              </div>
            )}

            {/* View Full Profile */}
            <Link 
              to={`/teams/${encodeURIComponent(teamData.team_name)}`}
              onClick={onClose}
              className="block btn btn-primary text-center"
            >
              View Full Profile →
            </Link>
          </div>
        ) : (
          <div className="p-6 text-center text-text-muted">
            <p>Team data not available</p>
          </div>
        )}
      </div>
    </>
  )
}

function getOverallRating(team) {
  return ((team.attack_rating || 0) + (team.defense_rating || 0) + (team.gk_rating || 0)) / 3
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-card-hover rounded-xl p-4 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-sm text-text-muted">{label}</p>
    </div>
  )
}

function RatingBar({ label, value, color }) {
  const rating = value || 0
  const percentage = (rating / 100) * 100

  return (
    <div>
      <div className="flex justify-between mb-1 text-sm">
        <span className="text-text-muted">{label}</span>
        <span className="text-text font-semibold">{formatRating(rating)}</span>
      </div>
      <div className="h-2 rounded-full bg-border/50 overflow-hidden">
        <div 
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}


