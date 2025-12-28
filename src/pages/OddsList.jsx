import { useState, useEffect } from 'react'
import { fixturesApi } from '../api/client'
import OddsCard from '../components/odds/OddsCard'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorDisplay from '../components/common/ErrorDisplay'
import { SkeletonList } from '../components/common/SkeletonCard'

export default function OddsList() {
  const [fixtures, setFixtures] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortBy, setSortBy] = useState('date')

  useEffect(() => {
    fetchUpcomingFixtures()
  }, [])

  const fetchUpcomingFixtures = async () => {
    setLoading(true)
    setError(null)
    try {
      // Get scheduled fixtures
      const { data } = await fixturesApi.getAll({ status: 'scheduled' })
      
      // Fetch odds for each fixture
      const fixturesWithOdds = await Promise.all(
        (data || []).map(async (fixture) => {
          try {
            const oddsRes = await fixturesApi.getOdds(fixture.fixture_id)
            return { ...fixture, odds: oddsRes.data }
          } catch {
            return { ...fixture, odds: null }
          }
        })
      )
      
      setFixtures(fixturesWithOdds)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Sort fixtures
  const sortedFixtures = [...fixtures].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(a.scheduled_time) - new Date(b.scheduled_time)
      case 'home_odds':
        return (a.odds?.home_odds || a.odds?.home_win_odds || 999) - (b.odds?.home_odds || b.odds?.home_win_odds || 999)
      case 'away_odds':
        return (a.odds?.away_odds || a.odds?.away_win_odds || 999) - (b.odds?.away_odds || b.odds?.away_win_odds || 999)
      default:
        return 0
    }
  })

  // Filter fixtures with odds
  const fixturesWithOdds = sortedFixtures.filter(f => f.odds)
  const fixturesWithoutOdds = sortedFixtures.filter(f => !f.odds)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text mb-2">Betting Odds</h1>
        <p className="text-text-muted">
          View match predictions and betting odds for upcoming fixtures
        </p>
      </div>

      {/* Info Banner */}
      <div className="card bg-gradient-to-r from-primary/10 to-blue-500/10 border-primary/30 mb-6">
        <div className="flex items-start gap-4">
          <span className="text-3xl">🎲</span>
          <div>
            <h3 className="font-semibold text-text mb-1">How Odds Work</h3>
            <p className="text-sm text-text-muted">
              Odds are displayed in decimal format. Lower odds indicate a higher probability of winning.
              The probability bars show the implied winning chance for each outcome.
            </p>
          </div>
        </div>
      </div>

      {/* Sort Options */}
      <div className="flex items-center gap-4 mb-6">
        <span className="text-sm text-text-muted">Sort by:</span>
        <div className="flex gap-2">
          {[
            { id: 'date', label: 'Date' },
            { id: 'home_odds', label: 'Home Favorite' },
            { id: 'away_odds', label: 'Away Favorite' },
          ].map(option => (
            <button
              key={option.id}
              onClick={() => setSortBy(option.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                sortBy === option.id
                  ? 'bg-primary text-bg'
                  : 'bg-card text-text-muted hover:text-text hover:bg-card-hover'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <SkeletonList count={6} />
      ) : error ? (
        <ErrorDisplay message={error} onRetry={fetchUpcomingFixtures} />
      ) : fixtures.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Fixtures with Odds */}
          {fixturesWithOdds.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
              {fixturesWithOdds.map((fixture, index) => (
                <div 
                  key={fixture.fixture_id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <OddsCard fixture={fixture} odds={fixture.odds} />
                </div>
              ))}
            </div>
          )}

          {/* Fixtures without Odds */}
          {fixturesWithoutOdds.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
                <span className="text-text-muted">Odds Coming Soon</span>
                <span className="text-sm text-text-muted font-normal">
                  ({fixturesWithoutOdds.length} fixtures)
                </span>
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {fixturesWithoutOdds.map(fixture => (
                  <div key={fixture.fixture_id} className="card opacity-60">
                    <div className="text-center py-4">
                      <p className="font-semibold text-text">{fixture.home_team}</p>
                      <p className="text-text-muted text-sm my-2">vs</p>
                      <p className="font-semibold text-text">{fixture.away_team}</p>
                      <p className="text-xs text-text-muted mt-3">
                        Odds not yet available
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Stats */}
      {!loading && !error && fixturesWithOdds.length > 0 && (
        <div className="mt-8 p-4 bg-card rounded-xl border border-border">
          <div className="flex flex-wrap justify-center gap-6 text-center">
            <StatItem 
              label="Upcoming Matches" 
              value={fixtures.length} 
            />
            <StatItem 
              label="With Odds" 
              value={fixturesWithOdds.length} 
            />
            <StatItem 
              label="Avg Home Odds" 
              value={calculateAvgOdds(fixturesWithOdds, 'home')}
              isOdds
            />
            <StatItem 
              label="Avg Away Odds" 
              value={calculateAvgOdds(fixturesWithOdds, 'away')}
              isOdds
            />
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <span className="text-5xl mb-4 block">📅</span>
      <h3 className="text-xl font-semibold text-text mb-2">No Upcoming Fixtures</h3>
      <p className="text-text-muted">
        Check back later for upcoming matches and betting odds
      </p>
    </div>
  )
}

function StatItem({ label, value, isOdds }) {
  return (
    <div>
      <div className="text-2xl font-bold text-primary">
        {isOdds ? value.toFixed(2) : value}
      </div>
      <div className="text-sm text-text-muted">{label}</div>
    </div>
  )
}

function calculateAvgOdds(fixtures, type) {
  const oddsKey = type === 'home' ? 'home_odds' : 'away_odds'
  const altKey = type === 'home' ? 'home_win_odds' : 'away_win_odds'
  
  const validOdds = fixtures
    .map(f => f.odds?.[oddsKey] || f.odds?.[altKey])
    .filter(o => o && o > 0)
  
  if (validOdds.length === 0) return 0
  return validOdds.reduce((sum, o) => sum + o, 0) / validOdds.length
}

