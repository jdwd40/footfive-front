import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { teamsApi, playersApi, fixturesApi } from '../api/client'
import PlayerList from '../components/teams/PlayerList'
import FormIndicator, { FormSummary } from '../components/teams/FormIndicator'
import FixtureCard from '../components/fixtures/FixtureCard'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorDisplay from '../components/common/ErrorDisplay'
import { formatRating } from '../utils/formatters'

export default function TeamDetail() {
  const { id } = useParams()
  const teamName = decodeURIComponent(id)
  
  const [team, setTeam] = useState(null)
  const [allTeams, setAllTeams] = useState([])
  const [players, setPlayers] = useState([])
  const [recentFixtures, setRecentFixtures] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchTeamData()
  }, [teamName])

  const fetchTeamData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [teamsRes, playersRes, fixturesRes] = await Promise.all([
        teamsApi.getTop16(),
        playersApi.getByTeam(teamName).catch(() => ({ data: [] })),
        fixturesApi.getAll({ team: teamName, limit: 10 }).catch(() => ({ data: [] }))
      ])

      const teamData = teamsRes.data?.find(t => t.team_name === teamName)
      if (!teamData) {
        setError('Team not found')
        return
      }

      setTeam(teamData)
      setAllTeams(teamsRes.data || [])
      setPlayers(playersRes.data || [])
      setRecentFixtures(fixturesRes.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-32 bg-card-hover rounded-lg" />
          <div className="h-48 bg-card-hover rounded-3xl" />
          <div className="h-64 bg-card-hover rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error || !team) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ErrorDisplay message={error || 'Team not found'} onRetry={fetchTeamData} />
        <div className="text-center mt-4">
          <Link to="/teams" className="text-primary hover:underline">
            ← Back to Teams
          </Link>
        </div>
      </div>
    )
  }

  const overallRating = ((team.attack_rating || 0) + (team.defense_rating || 0) + (team.gk_rating || 0)) / 3
  const goalDiff = (team.goals_for || 0) - (team.goals_against || 0)
  
  // Calculate ranking among all teams
  const sortedByCups = [...allTeams].sort((a, b) => (b.cups_won || 0) - (a.cups_won || 0))
  const cupRank = sortedByCups.findIndex(t => t.team_name === team.team_name) + 1
  const sortedByWins = [...allTeams].sort((a, b) => (b.wins || 0) - (a.wins || 0))
  const winRank = sortedByWins.findIndex(t => t.team_name === team.team_name) + 1

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Link */}
      <Link 
        to="/teams" 
        className="inline-flex items-center gap-2 text-text-muted hover:text-primary mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Teams
      </Link>

      {/* Team Header */}
      <div className="bg-gradient-to-br from-primary/10 via-card to-primary/5 rounded-3xl border border-primary/20 p-6 sm:p-8 mb-8">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          {/* Team Badge */}
          <div className="relative">
            <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-6xl shadow-2xl shadow-primary/30">
              ⚽
            </div>
            {team.cups_won > 0 && (
              <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center">
                <span className="text-lg">🏆</span>
              </div>
            )}
          </div>

          {/* Team Info */}
          <div className="flex-1 text-center lg:text-left">
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-2">
              <h1 className="text-3xl sm:text-4xl font-bold text-text">{team.team_name}</h1>
              {team.cups_won > 0 && (
                <span className="px-3 py-1 rounded-lg bg-gold/20 text-gold text-sm font-bold">
                  🏆 {team.cups_won}x Champion
                </span>
              )}
            </div>
            <p className="text-text-muted text-lg mb-4">
              Overall Rating: <span className="text-primary font-bold text-2xl">{formatRating(overallRating)}</span>
            </p>
            
            {/* Rankings */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
              <span className="px-3 py-1 rounded-lg bg-card-hover text-text-muted text-sm">
                #{cupRank} in Trophies
              </span>
              <span className="px-3 py-1 rounded-lg bg-card-hover text-text-muted text-sm">
                #{winRank} in Wins
              </span>
            </div>
          </div>

          {/* Quick Ratings */}
          <div className="grid grid-cols-3 gap-4">
            <RatingCircle label="Attack" value={team.attack_rating} color="text-green-400 border-green-400/30" />
            <RatingCircle label="Defense" value={team.defense_rating} color="text-blue-400 border-blue-400/30" />
            <RatingCircle label="GK" value={team.gk_rating} color="text-yellow-400 border-yellow-400/30" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['overview', 'players', 'fixtures'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-xl font-semibold capitalize transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'bg-primary text-bg shadow-lg shadow-primary/25'
                : 'bg-card text-text-muted hover:text-text hover:bg-card-hover'
            }`}
          >
            {tab === 'overview' && '📊 '}
            {tab === 'players' && '👥 '}
            {tab === 'fixtures' && '📅 '}
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* All-Time Stats */}
          <div className="card">
            <h3 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
              <span>📊</span> All-Time Statistics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="Wins" value={team.wins || 0} color="text-win" icon="✅" />
              <StatCard label="Losses" value={team.losses || 0} color="text-loss" icon="❌" />
              <StatCard label="Goals Scored" value={team.goals_for || 0} color="text-primary" icon="⚽" />
              <StatCard label="Goals Conceded" value={team.goals_against || 0} color="text-text-muted" icon="🥅" />
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Goal Difference</span>
                <span className={`text-2xl font-bold ${goalDiff >= 0 ? 'text-win' : 'text-loss'}`}>
                  {goalDiff >= 0 ? '+' : ''}{goalDiff}
                </span>
              </div>
              {team.wins > 0 && (
                <div className="flex justify-between items-center mt-3">
                  <span className="text-text-muted">Win Rate</span>
                  <span className="text-xl font-bold text-primary">
                    {Math.round((team.wins / (team.wins + team.losses)) * 100)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Trophy Cabinet */}
          <div className="card bg-gradient-to-br from-gold/5 to-card">
            <h3 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
              <span>🏆</span> Trophy Cabinet
            </h3>
            {team.cups_won > 0 || team.runner_ups > 0 ? (
              <div className="flex justify-center gap-8 py-4">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-gold/30 to-gold/10 flex items-center justify-center text-4xl shadow-lg shadow-gold/20">
                    🏆
                  </div>
                  <p className="text-3xl font-bold text-gold">{team.cups_won || 0}</p>
                  <p className="text-sm text-text-muted">Championships</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-gray-400/30 to-gray-500/10 flex items-center justify-center text-4xl shadow-lg shadow-gray-500/10">
                    🥈
                  </div>
                  <p className="text-3xl font-bold text-gray-400">{team.runner_ups || 0}</p>
                  <p className="text-sm text-text-muted">Runner-ups</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-text-muted">
                <span className="text-4xl block mb-2">🎯</span>
                <p>No trophies yet - keep competing!</p>
              </div>
            )}
          </div>

          {/* Recent Form */}
          <div className="card">
            <h3 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
              <span>📈</span> Recent Form
            </h3>
            {team.recent_form ? (
              <>
                <FormIndicator form={team.recent_form.split('')} maxDisplay={10} />
                <div className="mt-4">
                  <FormSummary form={team.recent_form.split('')} />
                </div>
              </>
            ) : (
              <p className="text-text-muted text-center py-4">No form data available</p>
            )}
          </div>

          {/* Ratings Breakdown */}
          <div className="card">
            <h3 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
              <span>⭐</span> Team Ratings
            </h3>
            <div className="space-y-4">
              <RatingBar label="Attack" value={team.attack_rating} color="bg-green-400" />
              <RatingBar label="Defense" value={team.defense_rating} color="bg-blue-400" />
              <RatingBar label="Goalkeeper" value={team.gk_rating} color="bg-yellow-400" />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'players' && (
        <div className="card">
          <h3 className="text-lg font-bold text-text mb-4">Squad ({players.length})</h3>
          <PlayerList players={players} />
        </div>
      )}

      {activeTab === 'fixtures' && (
        <div>
          <h3 className="text-lg font-bold text-text mb-4">Recent Matches</h3>
          {recentFixtures.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentFixtures.map(fixture => (
                <FixtureCard key={fixture.fixture_id} fixture={fixture} />
              ))}
            </div>
          ) : (
            <div className="card text-center py-8 text-text-muted">
              No recent fixtures found
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function RatingCircle({ label, value, color }) {
  return (
    <div className="text-center">
      <div className={`w-16 h-16 mx-auto mb-2 rounded-full border-2 ${color} flex items-center justify-center bg-card`}>
        <span className={`text-xl font-bold ${color.split(' ')[0]}`}>{formatRating(value)}</span>
      </div>
      <div className="text-xs text-text-muted">{label}</div>
    </div>
  )
}

function StatCard({ label, value, color, icon }) {
  return (
    <div className="p-4 rounded-xl bg-card-hover/50 text-center">
      <span className="text-2xl mb-2 block">{icon}</span>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-sm text-text-muted">{label}</div>
    </div>
  )
}

function RatingBar({ label, value, color }) {
  const rating = value || 0
  const percentage = (rating / 100) * 100

  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-text-muted">{label}</span>
        <span className="text-text font-bold">{formatRating(rating)}</span>
      </div>
      <div className="h-3 rounded-full bg-border/50 overflow-hidden">
        <div 
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
