import { useState } from 'react'
import useTournamentStore from '../stores/useTournamentStore'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorDisplay from '../components/common/ErrorDisplay'

export default function Tournament() {
  const {
    isInitialized,
    currentRound,
    phase,
    fixtures,
    currentResults,
    currentHighlights,
    roundHistory,
    isLoading,
    error,
    winner,
    runnerUp,
    initTournament,
    playRound,
    advanceToNextRound,
    getCurrentRoundName,
    getNextRoundName,
    reset
  } = useTournamentStore()

  const [showHighlights, setShowHighlights] = useState(true)

  const handleInit = async () => {
    try {
      await initTournament()
    } catch (err) {
      console.error('Failed to init tournament:', err)
    }
  }

  const handlePlayRound = async () => {
    try {
      setShowHighlights(true)
      await playRound()
    } catch (err) {
      console.error('Failed to play round:', err)
    }
  }

  const handleNextRound = () => {
    advanceToNextRound()
  }

  const handleReset = () => {
    reset()
    setShowHighlights(true)
  }

  const isConnectionError = error?.includes('Network Error') || error?.includes('ERR_CONNECTION_REFUSED')

  // Not initialized - show start screen
  if (!isInitialized) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-20">
          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-5xl shadow-xl shadow-primary/30">
            🏆
          </div>
          <h1 className="text-4xl font-bold text-text mb-4">J-Cup Tournament</h1>
          <p className="text-text-muted text-lg mb-8 max-w-md mx-auto">
            16 teams battle it out in a knockout tournament. Initialize to start a new J-Cup!
          </p>
          
          {error && (
            <div className="mb-6 max-w-md mx-auto">
              {isConnectionError ? (
                <div className="card bg-red-500/10 border-red-500/50 p-6 text-center">
                  <div className="text-3xl mb-3">🔌</div>
                  <h3 className="text-lg font-semibold text-text mb-2">Cannot Connect to Server</h3>
                  <p className="text-text-muted text-sm">Please check your connection and try again.</p>
                </div>
              ) : (
                <ErrorDisplay message={error} />
              )}
            </div>
          )}
          
          <button
            onClick={handleInit}
            disabled={isLoading}
            className="btn btn-primary text-lg px-8 py-3 inline-flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                Initializing...
              </>
            ) : (
              <>🚀 Start New Tournament</>
            )}
          </button>
        </div>
      </div>
    )
  }

  // Tournament Complete - Show Winner
  if (phase === 'complete') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card bg-gradient-to-r from-yellow-500/20 via-primary/10 to-yellow-500/20 border-yellow-500/50 mb-8 text-center py-12 animate-scale-in">
          <div className="text-8xl mb-6">🏆</div>
          <h1 className="text-4xl font-bold text-text mb-4">
            {winner} wins the J-Cup!
          </h1>
          <p className="text-xl text-text-muted mb-8">
            Runner-up: {runnerUp}
          </p>
          <button onClick={handleReset} className="btn btn-primary text-lg px-8 py-3">
            🔄 Start New Championship
          </button>
        </div>

        {currentResults.length > 0 && (
          <div className="card mb-6">
            <h2 className="text-xl font-bold text-text mb-4">🏆 Final</h2>
            <div className="grid gap-2">
              {currentResults.map((result, index) => (
                <ResultCard key={result.fixtureId || index} result={result} isFinal />
              ))}
            </div>
          </div>
        )}

        {roundHistory.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-text mb-4">📋 Tournament Results</h2>
            <div className="space-y-4">
              {[...roundHistory].reverse().map((round, index) => (
                <div key={index} className="card">
                  <h3 className="font-semibold text-primary mb-3">{round.roundName}</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {round.results.map((result, rIndex) => (
                      <ResultCard key={result.fixtureId || rIndex} result={result} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text mb-2">🏆 J-Cup Tournament</h1>
          <p className="text-text-muted">
            {getCurrentRoundName()}
            {phase === 'results' && <span className="text-primary ml-2">• Results</span>}
          </p>
        </div>
        <button onClick={handleReset} className="btn btn-secondary text-sm">
          🔄 Reset
        </button>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {['Round of 16', 'Quarter-Finals', 'Semi-Finals', 'Final'].map((round, index) => {
            const roundNum = index + 1
            const isActive = currentRound === roundNum
            const isComplete = currentRound > roundNum || (currentRound === roundNum && phase === 'results')
            
            return (
              <div key={round} className="flex-1 flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                  ${isComplete ? 'bg-primary text-bg' : isActive ? 'bg-primary/20 text-primary border-2 border-primary' : 'bg-card text-text-muted'}
                `}>
                  {isComplete && currentRound > roundNum ? '✓' : roundNum}
                </div>
                {index < 3 && (
                  <div className={`flex-1 h-1 mx-2 rounded transition-all ${currentRound > roundNum ? 'bg-primary' : 'bg-card'}`} />
                )}
              </div>
            )
          })}
        </div>
        <div className="flex justify-between text-xs text-text-muted">
          <span>R16</span>
          <span>QF</span>
          <span>SF</span>
          <span>Final</span>
        </div>
      </div>

      {/* PHASE: FIXTURES - Show fixtures and simulate button (only for Round of 16) */}
      {phase === 'fixtures' && fixtures.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-text mb-4">{getCurrentRoundName()} Fixtures</h2>
          
          <div className="grid gap-4 sm:grid-cols-2 mb-6">
            {fixtures.map((matchup, index) => (
              <MatchupCard key={matchup.fixtureId || index} matchup={matchup} />
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={handlePlayRound}
              disabled={isLoading}
              className="btn btn-primary text-lg px-8 py-3 inline-flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Simulating...
                </>
              ) : (
                <>⚡ Simulate {getCurrentRoundName()}</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* PHASE: READY - Ready to simulate next round (no fixtures preview) */}
      {phase === 'ready' && (
        <div className="mb-8">
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">
              {currentRound === 2 && '🎯'}
              {currentRound === 3 && '⚔️'}
              {currentRound === 4 && '🏆'}
            </div>
            <h2 className="text-2xl font-bold text-text mb-2">{getCurrentRoundName()}</h2>
            <p className="text-text-muted mb-6">
              {currentRound === 4 
                ? 'The final match to decide the champion!'
                : `${Math.pow(2, 5 - currentRound)} teams remaining`
              }
            </p>
            <button
              onClick={handlePlayRound}
              disabled={isLoading}
              className="btn btn-primary text-lg px-8 py-3 inline-flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Simulating {getCurrentRoundName()}...
                </>
              ) : (
                <>⚡ Simulate {getCurrentRoundName()}</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* PHASE: RESULTS - Show results and next round button */}
      {phase === 'results' && (
        <div className="mb-8 animate-fade-in">
          <h2 className="text-xl font-bold text-text mb-4">{getCurrentRoundName()} Results</h2>
          
          <div className="grid gap-4 sm:grid-cols-2 mb-6">
            {currentResults.map((result, index) => (
              <ResultCard key={result.fixtureId || index} result={result} showWinner />
            ))}
          </div>

          {showHighlights && currentHighlights.length > 0 && (
            <div className="card mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-text">⚡ Match Highlights</h3>
                <button onClick={() => setShowHighlights(false)} className="text-text-muted hover:text-text text-sm">
                  Hide
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {currentHighlights
                  .filter(h => h.type === 'goal' || h.type === 'fulltime')
                  .slice(0, 20)
                  .map((highlight, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded text-sm ${
                      highlight.type === 'goal' ? 'bg-primary/20 text-primary' : 'bg-card-hover text-text-muted'
                    }`}
                  >
                    {highlight.description}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-center">
            <button onClick={handleNextRound} className="btn btn-primary text-lg px-8 py-3">
              Continue to {getNextRoundName()} →
            </button>
          </div>
        </div>
      )}

      {/* Previous Rounds History */}
      {roundHistory.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-text mb-4">📋 Previous Rounds</h2>
          <div className="space-y-4">
            {[...roundHistory].reverse().map((round, index) => (
              <div key={index} className="card">
                <h3 className="font-semibold text-primary mb-3">{round.roundName}</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {round.results.map((result, rIndex) => (
                    <ResultCard key={result.fixtureId || rIndex} result={result} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-8">
          <ErrorDisplay message={error} />
        </div>
      )}
    </div>
  )
}

function MatchupCard({ matchup }) {
  const team1 = matchup.team1 || matchup.home || {}
  const team2 = matchup.team2 || matchup.away || {}
  
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="flex-1 text-center">
          <div className="w-14 h-14 mx-auto mb-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-2xl">
            ⚽
          </div>
          <p className="font-semibold text-text text-sm truncate px-1">{team1.name || 'TBD'}</p>
          {team1.attackRating && (
            <p className="text-xs text-text-muted mt-1">ATK {team1.attackRating} • DEF {team1.defenseRating}</p>
          )}
        </div>

        <div className="px-4 text-center">
          <span className="text-2xl font-bold text-text-muted">vs</span>
          {matchup.odds && (
            <div className="mt-2 text-xs">
              <span className="text-primary">{matchup.odds.homeWin?.toFixed(2)}</span>
              <span className="text-text-muted mx-2">|</span>
              <span className="text-blue-400">{matchup.odds.awayWin?.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="flex-1 text-center">
          <div className="w-14 h-14 mx-auto mb-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center text-2xl">
            ⚽
          </div>
          <p className="font-semibold text-text text-sm truncate px-1">{team2.name || 'TBD'}</p>
          {team2.attackRating && (
            <p className="text-xs text-text-muted mt-1">ATK {team2.attackRating} • DEF {team2.defenseRating}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function ResultCard({ result, showWinner, isFinal }) {
  if (!result || !result.score) {
    return <div className="p-4 rounded-lg bg-card-hover text-sm text-text">Match result unavailable</div>
  }
  
  const teams = Object.keys(result.score)
  const scores = Object.values(result.score)
  
  if (teams.length !== 2) return null
  
  const [team1, team2] = teams
  const [score1, score2] = scores
  
  let team1Won = score1 > score2
  let team2Won = score2 > score1
  const isDraw = score1 === score2
  
  let penaltyInfo = null
  if (isDraw && result.penaltyScore && Object.keys(result.penaltyScore).length > 0) {
    const penScores = [result.penaltyScore[team1] || 0, result.penaltyScore[team2] || 0]
    penaltyInfo = { team1Pen: penScores[0], team2Pen: penScores[1] }
    team1Won = penScores[0] > penScores[1]
    team2Won = penScores[1] > penScores[0]
  }
  
  const winnerName = team1Won ? team1 : team2Won ? team2 : null
  
  return (
    <div className={`p-4 rounded-xl ${isFinal ? 'bg-gradient-to-r from-yellow-500/10 to-primary/10 border border-yellow-500/30' : 'bg-card-hover'}`}>
      <div className="flex items-center justify-between">
        <div className={`flex-1 ${team1Won ? 'text-primary font-semibold' : 'text-text'}`}>
          <div className="flex items-center gap-2">
            {team1Won && <span>🏆</span>}
            <span className="truncate">{team1}</span>
          </div>
        </div>
        <div className="px-4 text-center">
          <div className="text-xl font-bold">
            <span className={team1Won ? 'text-primary' : 'text-text'}>{score1}</span>
            <span className="text-text-muted mx-2">-</span>
            <span className={team2Won ? 'text-primary' : 'text-text'}>{score2}</span>
          </div>
          {penaltyInfo && (
            <div className="text-xs text-text-muted mt-1">(Pens: {penaltyInfo.team1Pen}-{penaltyInfo.team2Pen})</div>
          )}
        </div>
        <div className={`flex-1 text-right ${team2Won ? 'text-primary font-semibold' : 'text-text'}`}>
          <div className="flex items-center justify-end gap-2">
            <span className="truncate">{team2}</span>
            {team2Won && <span>🏆</span>}
          </div>
        </div>
      </div>
      {showWinner && winnerName && (
        <div className="mt-3 pt-3 border-t border-border text-center">
          <span className="text-sm text-primary">✓ {winnerName} advances</span>
        </div>
      )}
    </div>
  )
}
