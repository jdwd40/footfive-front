import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { fixturesApi } from '../api/client'
import FixtureCard from '../components/fixtures/FixtureCard'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorDisplay from '../components/common/ErrorDisplay'
import { SkeletonList } from '../components/common/SkeletonCard'

const TABS = [
  { id: 'all', label: 'All', icon: '📋' },
  { id: 'scheduled', label: 'Scheduled', icon: '📅' },
  { id: 'completed', label: 'Completed', icon: '✅' },
]

export default function FixtureList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [fixtures, setFixtures] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const activeTab = searchParams.get('status') || 'all'

  useEffect(() => {
    fetchFixtures()
  }, [activeTab])

  const fetchFixtures = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = activeTab !== 'all' ? { status: activeTab } : {}
      const { data } = await fixturesApi.getAll(params)
      setFixtures(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (tabId) => {
    if (tabId === 'all') {
      setSearchParams({})
    } else {
      setSearchParams({ status: tabId })
    }
  }

  // Group fixtures by round
  const groupedFixtures = fixtures.reduce((groups, fixture) => {
    const round = fixture.round || 'Unknown Round'
    
    if (!groups[round]) {
      groups[round] = []
    }
    groups[round].push(fixture)
    return groups
  }, {})

  // Sort rounds in logical order
  const roundOrder = ['Round of 16', 'Quarter-Finals', 'Semi-Finals', 'Final', 'Friendly']
  const sortedRounds = Object.keys(groupedFixtures).sort((a, b) => {
    const aIndex = roundOrder.indexOf(a)
    const bIndex = roundOrder.indexOf(b)
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b)
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text mb-2">Fixtures</h1>
          <p className="text-text-muted">
            All matches and results from tournaments
          </p>
        </div>
        <Link to="/tournament" className="btn btn-primary">
          🏆 Go to Tournament
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap
              ${activeTab === tab.id
                ? 'bg-primary text-bg shadow-lg shadow-primary/25'
                : 'bg-card text-text-muted hover:text-text hover:bg-card-hover'
              }
            `}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <SkeletonList count={6} />
      ) : error ? (
        <ErrorDisplay message={error} onRetry={fetchFixtures} />
      ) : fixtures.length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        // Grouped by round
        <div className="space-y-8">
          {sortedRounds.map(round => (
            <div key={round}>
              <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                {round}
                <span className="text-sm font-normal text-text-muted">
                  ({groupedFixtures[round].length} {groupedFixtures[round].length === 1 ? 'match' : 'matches'})
                </span>
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {groupedFixtures[round].map((fixture, index) => (
                  <div 
                    key={fixture.fixture_id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <FixtureCard fixture={fixture} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Footer */}
      {!loading && !error && fixtures.length > 0 && (
        <div className="mt-8 p-4 bg-card rounded-xl border border-border">
          <div className="flex flex-wrap justify-center gap-6 text-center">
            <StatItem 
              label="Total Matches" 
              value={fixtures.length} 
            />
            <StatItem 
              label="Scheduled" 
              value={fixtures.filter(f => f.status === 'scheduled').length} 
            />
            <StatItem 
              label="Completed" 
              value={fixtures.filter(f => f.status === 'completed').length} 
            />
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyState({ tab }) {
  const messages = {
    all: 'No fixtures found. Start a tournament to create matches!',
    scheduled: 'No scheduled fixtures. All matches may have been played.',
    completed: 'No completed matches yet. Simulate a round in the tournament!',
  }

  const icons = {
    all: '📋',
    scheduled: '📅',
    completed: '✅',
  }

  return (
    <div className="text-center py-12">
      <span className="text-4xl mb-4 block">{icons[tab]}</span>
      <p className="text-text-muted text-lg mb-4">{messages[tab]}</p>
      <Link to="/tournament" className="btn btn-primary">
        🏆 Go to Tournament
      </Link>
    </div>
  )
}

function StatItem({ label, value }) {
  return (
    <div>
      <div className="text-2xl font-bold text-primary">
        {value}
      </div>
      <div className="text-sm text-text-muted">{label}</div>
    </div>
  )
}
