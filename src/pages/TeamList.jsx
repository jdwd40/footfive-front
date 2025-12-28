import { useState, useEffect } from 'react'
import { teamsApi } from '../api/client'
import TeamCard from '../components/teams/TeamCard'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorDisplay from '../components/common/ErrorDisplay'
import { SkeletonList } from '../components/common/SkeletonCard'

export default function TeamList() {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortBy, setSortBy] = useState('cups')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await teamsApi.getTop16()
      setTeams(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Filter and sort teams
  const filteredTeams = teams
    .filter(team => 
      team.team_name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'cups':
          return (b.cups_won || 0) - (a.cups_won || 0)
        case 'wins':
          return (b.wins || 0) - (a.wins || 0)
        case 'attack':
          return (b.attack_rating || 0) - (a.attack_rating || 0)
        case 'defense':
          return (b.defense_rating || 0) - (a.defense_rating || 0)
        case 'name':
          return a.team_name?.localeCompare(b.team_name)
        default:
          return 0
      }
    })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text mb-2">Teams</h1>
        <p className="text-text-muted">
          Top 16 teams competing in the J-Cup
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 bg-card border border-border rounded-lg text-text placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
            />
            <svg 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 bg-card border border-border rounded-lg text-text focus:outline-none focus:border-primary cursor-pointer"
        >
          <option value="cups">Sort by Trophies</option>
          <option value="wins">Sort by Wins</option>
          <option value="attack">Sort by Attack</option>
          <option value="defense">Sort by Defense</option>
          <option value="name">Sort by Name</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <SkeletonList count={8} type="team" />
      ) : error ? (
        <ErrorDisplay message={error} onRetry={fetchTeams} />
      ) : filteredTeams.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-4xl mb-4 block">🔍</span>
          <p className="text-text-muted">
            {searchQuery ? 'No teams match your search' : 'No teams found'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTeams.map((team, index) => (
            <div 
              key={team.team_name} 
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <TeamCard team={team} />
            </div>
          ))}
        </div>
      )}

      {/* Stats Summary */}
      {!loading && !error && teams.length > 0 && (
        <div className="mt-8 p-4 bg-card rounded-xl border border-border">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <StatItem 
              label="Total Teams" 
              value={teams.length} 
            />
            <StatItem 
              label="Total Wins" 
              value={teams.reduce((sum, t) => sum + (t.wins || 0), 0)} 
            />
            <StatItem 
              label="Total Goals" 
              value={teams.reduce((sum, t) => sum + (t.goals_for || 0), 0)} 
            />
            <StatItem 
              label="Trophies" 
              value={teams.reduce((sum, t) => sum + (t.cups_won || 0), 0)} 
              icon="🏆"
            />
          </div>
        </div>
      )}
    </div>
  )
}

function StatItem({ label, value, icon }) {
  return (
    <div>
      <div className="text-2xl font-bold text-primary">
        {icon && <span className="mr-1">{icon}</span>}
        {value}
      </div>
      <div className="text-sm text-text-muted">{label}</div>
    </div>
  )
}

