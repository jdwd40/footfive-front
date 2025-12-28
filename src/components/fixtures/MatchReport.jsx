import { useState, useEffect } from 'react'
import { fixturesApi } from '../../api/client'
import LoadingSpinner from '../common/LoadingSpinner'

export default function MatchReport({ fixtureId }) {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const { data } = await fixturesApi.getReport(fixtureId)
        setReport(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchReport()
  }, [fixtureId])

  if (loading) {
    return <LoadingSpinner className="py-8" />
  }

  if (error || !report) {
    return (
      <div className="text-center py-8 text-text-muted">
        No match report available
      </div>
    )
  }

  const stats = [
    { label: 'Possession', home: report.home_possession, away: report.away_possession, format: 'percent' },
    { label: 'Shots', home: report.home_shots, away: report.away_shots },
    { label: 'Shots on Target', home: report.home_shots_on_target, away: report.away_shots_on_target },
    { label: 'xG', home: report.home_xg, away: report.away_xg, format: 'decimal' },
    { label: 'Corners', home: report.home_corners, away: report.away_corners },
    { label: 'Fouls', home: report.home_fouls, away: report.away_fouls },
    { label: 'Yellow Cards', home: report.home_yellows, away: report.away_yellows },
    { label: 'Red Cards', home: report.home_reds, away: report.away_reds },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-text">Match Statistics</h3>
      <div className="space-y-3">
        {stats.map(({ label, home, away, format }) => {
          if (home === undefined && away === undefined) return null
          
          const homeVal = home ?? 0
          const awayVal = away ?? 0
          const total = homeVal + awayVal || 1
          const homePercent = (homeVal / total) * 100
          
          const formatValue = (val) => {
            if (format === 'percent') return `${(val * 100).toFixed(0)}%`
            if (format === 'decimal') return val?.toFixed(2) ?? '0.00'
            return val ?? 0
          }

          return (
            <div key={label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-text font-medium">{formatValue(homeVal)}</span>
                <span className="text-text-muted">{label}</span>
                <span className="text-text font-medium">{formatValue(awayVal)}</span>
              </div>
              <div className="flex h-2 rounded-full overflow-hidden bg-card-hover">
                <div 
                  className="bg-primary transition-all duration-500"
                  style={{ width: `${homePercent}%` }}
                />
                <div 
                  className="bg-blue-500 transition-all duration-500"
                  style={{ width: `${100 - homePercent}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

