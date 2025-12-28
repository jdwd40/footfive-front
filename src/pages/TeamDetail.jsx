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
        <LoadingSpinner size="lg" className="py-20" />
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
      <div className="card mb-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Team Badge */}
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-5xl shadow-xl shadow-primary/30">
            ⚽
          </div>

          {/* Team Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
              <h1 className="text-3xl font-bold text-text">{team.team_name}</h1>
              {team.cups_won > 0 && (
                <span className="flex items-center gap-1 text-yellow-500 text-lg">
                  🏆 {team.cups_won}
                </span>
              )}
            </div>
            <p className="text-text-muted">
              Overall Rating: <span className="text-primary font-bold text-xl">{formatRating(overallRating)}</span>
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 sm:gap-6">
            <QuickStat label="Attack" value={team.attack_rating} color="text-green-400" />
            <QuickStat label="Defense" value={team.defense_rating} color="text-blue-400" />
            <QuickStat label="GK" value={team.gk_rating} color="text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['overview', 'players', 'fixtures'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium capitalize transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'bg-primary text-bg'
                : 'bg-card text-text-muted hover:text-text hover:bg-card-hover'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Record */}
          <div className="card">
            <h3 className="text-lg font-bold text-text mb-4">Season Record</h3>
            <div className="grid grid-cols-2 gap-4">
              <RecordStat label="Wins" value={team.wins || 0} color="text-win" />
              <RecordStat label="Losses" value={team.losses || 0} color="text-loss" />
              <RecordStat label="Goals For" value={team.goals_for || 0} color="text-primary" />
              <RecordStat label="Goals Against" value={team.goals_against || 0} color="text-text-muted" />
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Goal Difference</span>
                <span className={`text-xl font-bold ${goalDiff >= 0 ? 'text-win' : 'text-loss'}`}>
                  {goalDiff >= 0 ? '+' : ''}{goalDiff}
                </span>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="card">
            <h3 className="text-lg font-bold text-text mb-4">Recent Form</h3>
            {team.recent_form ? (
              <>
                <FormIndicator form={team.recent_form.split('')} maxDisplay={10} />
                <div className="mt-4">
                  <FormSummary form={team.recent_form.split('')} />
                </div>
              </>
            ) : (
              <p className="text-text-muted">No form data available</p>
            )}
          </div>

          {/* Ratings Breakdown */}
          <div className="card lg:col-span-2">
            <h3 className="text-lg font-bold text-text mb-4">Ratings Breakdown</h3>
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

function QuickStat({ label, value, color }) {
  return (
    <div className="text-center">
      <div className={`text-2xl font-bold ${color}`}>{formatRating(value)}</div>
      <div className="text-xs text-text-muted">{label}</div>
    </div>
  )
}

function RecordStat({ label, value, color }) {
  return (
    <div className="p-3 rounded-lg bg-card-hover/50 text-center">
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
      <div className="flex justify-between mb-1">
        <span className="text-text-muted">{label}</span>
        <span className="text-text font-semibold">{formatRating(rating)}</span>
      </div>
      <div className="h-3 rounded-full bg-card-hover overflow-hidden">
        <div 
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

