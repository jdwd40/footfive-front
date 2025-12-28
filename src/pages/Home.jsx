import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fixturesApi, teamsApi, liveApi } from '../api/client'
import FixtureCard from '../components/fixtures/FixtureCard'
import TeamCard from '../components/teams/TeamCard'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { SkeletonList } from '../components/common/SkeletonCard'

export default function Home() {
  const [recentMatches, setRecentMatches] = useState([])
  const [topTeams, setTopTeams] = useState([])
  const [liveStatus, setLiveStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fixturesRes, teamsRes, statusRes] = await Promise.all([
          fixturesApi.getAll({ limit: 6 }).catch(() => ({ data: [] })),
          teamsApi.getTop16().catch(() => ({ data: [] })),
          liveApi.getStatus().catch(() => null)
        ])

        // Get completed fixtures
        const completed = (fixturesRes.data || []).filter(f => f.status === 'completed')
        setRecentMatches(completed.slice(0, 6))
        setTopTeams((teamsRes.data || []).slice(0, 4))
        setLiveStatus(statusRes)
      } catch (error) {
        console.error('Failed to fetch home data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
          <span className="text-gradient">Foot</span>
          <span className="text-text">Five</span>
        </h1>
        <p className="text-text-muted text-lg max-w-2xl mx-auto">
          5-a-side football simulation with knockout tournaments, live match tracking, and team stats
        </p>
      </div>

      {/* Live Tournament CTA */}
      <div className="mb-10">
        <Link to="/live">
          <div className="card card-hover bg-gradient-to-r from-primary/10 via-card to-yellow-500/10 border-primary/30 p-6 sm:p-8 relative overflow-hidden">
            {/* Live indicator */}
            {liveStatus?.tournament?.state && !['IDLE', 'COMPLETE'].includes(liveStatus.tournament.state) && (
              <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-semibold text-primary">LIVE</span>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-500 to-primary flex items-center justify-center text-4xl shadow-xl shadow-primary/30">
                🏆
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl font-bold text-text mb-2">Live Tournament</h2>
                {liveStatus?.tournament ? (
                  <p className="text-text-muted">
                    {liveStatus.tournament.state === 'IDLE' ? (
                      'Next tournament starts at :55 past the hour'
                    ) : liveStatus.tournament.state === 'COMPLETE' || liveStatus.tournament.state === 'RESULTS' ? (
                      <>
                        {liveStatus.tournament.winner && (
                          <><span className="text-primary font-semibold">{liveStatus.tournament.winner.name || liveStatus.tournament.winner}</span> won! </>
                        )}
                        Next tournament soon...
                      </>
                    ) : (
                      <>
                        <span className="text-primary font-semibold">{liveStatus.tournament.currentRound}</span>
                        {liveStatus.tournament.activeMatches > 0 && (
                          <> • {liveStatus.tournament.activeMatches} matches live</>
                        )}
                      </>
                    )}
                  </p>
                ) : (
                  <p className="text-text-muted">
                    Watch live tournaments with real-time scores and events
                  </p>
                )}
              </div>
              <div className="btn btn-primary">
                Watch Live →
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Results */}
      <Section 
        title="⚽ Recent Results" 
        link="/fixtures?status=completed"
        className="mb-10"
      >
        {loading ? (
          <SkeletonList count={3} />
        ) : recentMatches.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentMatches.map(fixture => (
              <FixtureCard key={fixture.fixture_id} fixture={fixture} />
            ))}
          </div>
        ) : (
          <EmptyState message="No completed matches yet. Start a tournament to play!" />
        )}
      </Section>

      {/* Top Teams */}
      <Section 
        title="🏆 Top Teams" 
        link="/teams"
        className="mb-10"
      >
        {loading ? (
          <SkeletonList count={4} type="team" />
        ) : topTeams.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {topTeams.map(team => (
              <TeamCard key={team.team_name} team={team} />
            ))}
          </div>
        ) : (
          <EmptyState message="No teams found" />
        )}
      </Section>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-3">
        <QuickLinkCard
          to="/live"
          icon="🔴"
          title="Live Tournament"
          description="Watch matches in real-time"
        />
        <QuickLinkCard
          to="/fixtures"
          icon="📊"
          title="All Fixtures"
          description="View all matches and results"
        />
        <QuickLinkCard
          to="/teams"
          icon="👥"
          title="Team Stats"
          description="Explore team ratings and records"
        />
      </div>
    </div>
  )
}

function Section({ title, link, children, className = '' }) {
  return (
    <section className={className}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-text">{title}</h2>
        {link && (
          <Link 
            to={link} 
            className="text-sm text-primary hover:text-primary-light transition-colors"
          >
            View All →
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

function EmptyState({ message }) {
  return (
    <div className="text-center py-12 text-text-muted card">
      <p>{message}</p>
    </div>
  )
}

function QuickLinkCard({ to, icon, title, description }) {
  return (
    <Link to={to}>
      <div className="card card-hover h-full">
        <span className="text-3xl mb-3 block">{icon}</span>
        <h3 className="font-bold text-text mb-1">{title}</h3>
        <p className="text-sm text-text-muted">{description}</p>
      </div>
    </Link>
  )
}
