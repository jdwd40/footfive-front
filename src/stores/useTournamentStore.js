import { create } from 'zustand'
import { jcupApi } from '../api/client'

const ROUND_NAMES = {
  1: 'Round of 16',
  2: 'Quarter-Finals',
  3: 'Semi-Finals',
  4: 'Final'
}

export const useTournamentStore = create((set, get) => ({
  // State
  isInitialized: false,
  currentRound: 0,
  phase: 'fixtures', // 'fixtures' | 'results' | 'ready' | 'complete'
  // fixtures only available for Round of 16 (from init)
  fixtures: [],
  currentResults: [],
  currentHighlights: [],
  roundHistory: [],
  isLoading: false,
  error: null,
  winner: null,
  runnerUp: null,

  // Actions
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error, isLoading: false }),
  clearError: () => set({ error: null }),

  // Initialize tournament - shows Round of 16 fixtures
  initTournament: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await jcupApi.init()
      const roundFixtures = data.fixtures || []
      
      set({
        isInitialized: true,
        currentRound: 1,
        phase: 'fixtures', // Only R16 has fixtures preview
        fixtures: roundFixtures.flat(),
        currentResults: [],
        currentHighlights: [],
        roundHistory: [],
        winner: null,
        runnerUp: null,
        isLoading: false
      })
      
      return data
    } catch (error) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  // Play the current round
  playRound: async () => {
    const { currentRound, phase } = get()
    if (phase === 'complete') return null
    
    set({ isLoading: true, error: null })
    try {
      const data = await jcupApi.play()
      
      const results = data.results || []
      const highlights = results.flatMap(r => r.highlights || [])
      
      // Check if this is the final (round 4)
      const isFinal = currentRound >= 4
      
      // Find winner if final
      let winner = null
      let runnerUp = null
      
      if (isFinal && results.length > 0) {
        const finalResult = results[0] // Final only has 1 match
        if (finalResult.score) {
          const teams = Object.keys(finalResult.score)
          const scores = Object.values(finalResult.score)
          
          if (teams.length === 2) {
            if (scores[0] > scores[1]) {
              winner = teams[0]
              runnerUp = teams[1]
            } else if (scores[1] > scores[0]) {
              winner = teams[1]
              runnerUp = teams[0]
            } else if (finalResult.penaltyScore) {
              const penScores = Object.values(finalResult.penaltyScore)
              if (penScores[0] > penScores[1]) {
                winner = teams[0]
                runnerUp = teams[1]
              } else {
                winner = teams[1]
                runnerUp = teams[0]
              }
            }
          }
        }
      }
      
      set({
        phase: isFinal ? 'complete' : 'results',
        currentResults: results,
        currentHighlights: highlights,
        winner,
        runnerUp,
        isLoading: false
      })
      
      return data
    } catch (error) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  // Advance to next round - moves to "ready" state for next simulation
  advanceToNextRound: () => {
    const { currentRound, currentResults, phase } = get()
    if (phase !== 'results') return
    
    set((state) => ({
      currentRound: state.currentRound + 1,
      phase: 'ready', // Ready to simulate next round (no fixtures preview available)
      roundHistory: [...state.roundHistory, {
        round: currentRound,
        roundName: ROUND_NAMES[currentRound],
        results: currentResults
      }],
      currentResults: [],
      currentHighlights: [],
      fixtures: [] // No fixtures available for rounds after R16
    }))
  },

  // Get current round name
  getCurrentRoundName: () => {
    const { currentRound } = get()
    return ROUND_NAMES[currentRound] || `Round ${currentRound}`
  },

  // Get next round name
  getNextRoundName: () => {
    const { currentRound } = get()
    return ROUND_NAMES[currentRound + 1] || `Round ${currentRound + 1}`
  },

  // Reset tournament
  reset: () => set({
    isInitialized: false,
    currentRound: 0,
    phase: 'fixtures',
    fixtures: [],
    currentResults: [],
    currentHighlights: [],
    roundHistory: [],
    isLoading: false,
    error: null,
    winner: null,
    runnerUp: null
  })
}))

export default useTournamentStore
