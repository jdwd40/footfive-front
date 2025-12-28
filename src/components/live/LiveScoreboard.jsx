import LiveMatchCard from './LiveMatchCard'

export default function LiveScoreboard({ 
  matches, 
  title = 'Live Matches',
  emptyMessage = 'No matches in progress',
  compact = false,
  columns = 'auto' // 'auto' | 1 | 2 | 3 | 4
}) {
  const gridCols = {
    auto: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }

  // Group matches by state for better organization
  const liveMatches = matches.filter(m => 
    ['FIRST_HALF', 'SECOND_HALF', 'EXTRA_TIME_1', 'EXTRA_TIME_2', 'PENALTIES'].includes(m.state)
  )
  const breakMatches = matches.filter(m => 
    ['HALFTIME', 'ET_HALFTIME'].includes(m.state)
  )
  const finishedMatches = matches.filter(m => m.state === 'FINISHED' || m.isFinished)
  const scheduledMatches = matches.filter(m => m.state === 'SCHEDULED')

  // Order: Live > Break > Scheduled > Finished
  const sortedMatches = [...liveMatches, ...breakMatches, ...scheduledMatches, ...finishedMatches]

  if (!matches || matches.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-2xl border border-border">
        <span className="text-4xl block mb-3">⏳</span>
        <p className="text-text-muted">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div>
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-text flex items-center gap-2">
            {liveMatches.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            )}
            {title}
          </h2>
          <span className="text-sm text-text-muted">
            {liveMatches.length > 0 ? `${liveMatches.length} live` : `${matches.length} matches`}
          </span>
        </div>
      )}

      <div className={`grid gap-4 ${gridCols[columns] || gridCols.auto}`}>
        {sortedMatches.map(match => (
          <LiveMatchCard 
            key={match.fixtureId} 
            match={match} 
            compact={compact}
          />
        ))}
      </div>
    </div>
  )
}

