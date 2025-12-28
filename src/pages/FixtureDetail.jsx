import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fixturesApi } from '../api/client'
import MatchReport from '../components/fixtures/MatchReport'
import EventTimeline from '../components/fixtures/EventTimeline'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorDisplay from '../components/common/ErrorDisplay'
import { formatDate, formatTime, getStatusBadge, formatScore, formatOdds } from '../utils/formatters'

export default function FixtureDetail() {
  const { id } = useParams()
  const [fixture, setFixture] = useState(null)
  const [events, setEvents] = useState([])
  const [odds, setOdds] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('summary')

  useEffect(() => {
    fetchFixtureData()
  }, [id])

  const fetchFixtureData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [fixtureRes, eventsRes, oddsRes] = await Promise.all([
        fixturesApi.getById(id),
        fixturesApi.getEvents(id).catch(() => ({ data: [] })),
        fixturesApi.getOdds(id).catch(() => ({ data: null }))
      ])

      setFixture(fixtureRes.data)
      setEvents(eventsRes.data || [])
      setOdds(oddsRes.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <LoadingSpinner size="lg" className="py-20" />
      </div>
    )
  }

  if (error || !fixture) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ErrorDisplay message={error || 'Fixture not found'} onRetry={fetchFixtureData} />
        <div className="text-center mt-4">
          <Link to="/fixtures" className="text-primary hover:underline">
            ← Back to Fixtures
          </Link>
        </div>
      </div>
    )
  }

  const statusBadge = getStatusBadge(fixture.status)
  const isLive = fixture.status === 'live'
  const isCompleted = fixture.status === 'completed'

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Link */}
      <Link 
        to="/fixtures" 
        className="inline-flex items-center gap-2 text-text-muted hover:text-primary mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Fixtures
      </Link>

      {/* Match Header Card */}
      <div className={`card mb-8 ${isLive ? 'border-primary/50 shadow-lg shadow-primary/10' : ''}`}>
        {/* Tournament Info */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            {fixture.tournament_name && (
              <span className="px-2 py-1 bg-card-hover rounded-lg">{fixture.tournament_name}</span>
            )}
            {fixture.round_number && <span>Round {fixture.round_number}</span>}
          </div>
          <span className={`badge ${statusBadge.class}`}>
            {statusBadge.text}
          </span>
        </div>

        {/* Teams & Score */}
        <div className="flex items-center justify-center gap-6 py-4">
          {/* Home Team */}
          <div className="flex-1 text-center">
            <Link to={`/teams/${encodeURIComponent(fixture.home_team)}`}>
              <div className="w-20 h-20 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-4xl shadow-lg hover:shadow-primary/30 transition-shadow">
                ⚽
              </div>
              <h2 className="text-lg font-bold text-text hover:text-primary transition-colors">
                {fixture.home_team}
              </h2>
            </Link>
          </div>

          {/* Score / Time */}
          <div className="text-center px-4">
            {fixture.status === 'scheduled' ? (
              <div className="text-text-muted">
                <p className="text-2xl font-bold text-text">{formatTime(fixture.scheduled_time)}</p>
                <p className="text-sm">{formatDate(fixture.scheduled_time)}</p>
              </div>
            ) : (
              <div className={`text-4xl font-bold ${isLive ? 'text-primary' : 'text-text'}`}>
                {formatScore(fixture.home_score, fixture.away_score)}
              </div>
            )}
            {isLive && (
              <div className="flex items-center justify-center gap-2 mt-2 text-red-400 text-sm">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                LIVE
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex-1 text-center">
            <Link to={`/teams/${encodeURIComponent(fixture.away_team)}`}>
              <div className="w-20 h-20 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-blue-500/30 to-blue-500/10 flex items-center justify-center text-4xl shadow-lg hover:shadow-blue-500/30 transition-shadow">
                ⚽
              </div>
              <h2 className="text-lg font-bold text-text hover:text-blue-400 transition-colors">
                {fixture.away_team}
              </h2>
            </Link>
          </div>
        </div>

        {/* Live Match Link */}
        {isLive && (
          <div className="mt-4 pt-4 border-t border-border text-center">
            <Link 
              to={`/fixtures/${id}/live`}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              Watch Live
            </Link>
          </div>
        )}
      </div>

      {/* Tabs */}
      {(isCompleted || events.length > 0) && (
        <>
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {['summary', 'events', 'stats'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg font-medium capitalize transition-all ${
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
          {activeTab === 'summary' && (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Odds */}
              {odds && (
                <div className="card">
                  <h3 className="text-lg font-bold text-text mb-4">Pre-Match Odds</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <OddsItem label={fixture.home_team} value={odds.home_odds || odds.home_win_odds} isWinner={fixture.home_score > fixture.away_score} />
                    <OddsItem label="Draw" value={odds.draw_odds} isWinner={fixture.home_score === fixture.away_score && isCompleted} />
                    <OddsItem label={fixture.away_team} value={odds.away_odds || odds.away_win_odds} isWinner={fixture.away_score > fixture.home_score} />
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="card">
                <h3 className="text-lg font-bold text-text mb-4">Match Info</h3>
                <div className="space-y-3 text-sm">
                  <InfoRow label="Date" value={formatDate(fixture.scheduled_time)} />
                  <InfoRow label="Time" value={formatTime(fixture.scheduled_time)} />
                  {fixture.tournament_name && <InfoRow label="Tournament" value={fixture.tournament_name} />}
                  {fixture.round_number && <InfoRow label="Round" value={fixture.round_number} />}
                  <InfoRow label="Status" value={statusBadge.text} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="card">
              <h3 className="text-lg font-bold text-text mb-4">Match Events</h3>
              <EventTimeline 
                events={events} 
                homeTeam={fixture.home_team} 
                awayTeam={fixture.away_team} 
              />
            </div>
          )}

          {activeTab === 'stats' && isCompleted && (
            <div className="card">
              <MatchReport fixtureId={id} />
            </div>
          )}
        </>
      )}

      {/* Pre-match content for scheduled */}
      {fixture.status === 'scheduled' && odds && (
        <div className="card">
          <h3 className="text-lg font-bold text-text mb-4">Betting Odds</h3>
          <div className="grid grid-cols-3 gap-4 text-center mb-4">
            <OddsItem label={fixture.home_team} value={odds.home_odds || odds.home_win_odds} />
            <OddsItem label="Draw" value={odds.draw_odds} />
            <OddsItem label={fixture.away_team} value={odds.away_odds || odds.away_win_odds} />
          </div>
          <p className="text-xs text-text-muted text-center">
            Odds are subject to change
          </p>
        </div>
      )}
    </div>
  )
}

function OddsItem({ label, value, isWinner }) {
  return (
    <div className={`p-3 rounded-lg ${isWinner ? 'bg-primary/20 border border-primary/50' : 'bg-card-hover'}`}>
      <p className="text-xs text-text-muted mb-1 truncate" title={label}>{label}</p>
      <p className={`text-xl font-bold ${isWinner ? 'text-primary' : 'text-text'}`}>
        {formatOdds(value)}
      </p>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-text-muted">{label}</span>
      <span className="text-text font-medium">{value}</span>
    </div>
  )
}

