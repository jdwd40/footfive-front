import { create } from 'zustand'
import { liveApi } from '../api/client'

// Tournament state labels
const TOURNAMENT_STATE_LABELS = {
  IDLE: 'Waiting for Tournament',
  SETUP: 'Tournament Starting Soon',
  ROUND_OF_16: 'Round of 16',
  QF_BREAK: 'Quarter-Finals Starting',
  QUARTER_FINALS: 'Quarter-Finals',
  SF_BREAK: 'Semi-Finals Starting',
  SEMI_FINALS: 'Semi-Finals',
  FINAL_BREAK: 'Final Starting',
  FINAL: 'The Final',
  RESULTS: 'Tournament Complete',
  COMPLETE: 'Tournament Complete',
}

// Match state labels
const MATCH_STATE_LABELS = {
  SCHEDULED: 'Scheduled',
  FIRST_HALF: '1st Half',
  HALFTIME: 'Half Time',
  SECOND_HALF: '2nd Half',
  EXTRA_TIME_1: 'ET 1st',
  ET_HALFTIME: 'ET Break',
  EXTRA_TIME_2: 'ET 2nd',
  PENALTIES: 'Penalties',
  FINISHED: 'Full Time',
}

// Round order for sorting
const ROUND_ORDER = ['Round of 16', 'Quarter-finals', 'Semi-finals', 'Final']

// Map tournament state to current round name
const STATE_TO_ROUND = {
  ROUND_OF_16: 'Round of 16',
  QF_BREAK: 'Quarter-finals',
  QUARTER_FINALS: 'Quarter-finals',
  SF_BREAK: 'Semi-finals',
  SEMI_FINALS: 'Semi-finals',
  FINAL_BREAK: 'Final',
  FINAL: 'Final',
}

// Map tournament state to next round name
const STATE_TO_NEXT_ROUND = {
  SETUP: 'Round of 16',
  ROUND_OF_16: 'Quarter-finals',
  QF_BREAK: 'Quarter-finals',
  QUARTER_FINALS: 'Semi-finals',
  SF_BREAK: 'Semi-finals',
  SEMI_FINALS: 'Final',
  FINAL_BREAK: 'Final',
}

export const useLiveStore = create((set, get) => ({
  // Connection state
  connected: false,
  connecting: false,
  error: null,
  lastUpdated: null,

  // Simulation state
  simulation: null,
  
  // Tournament state
  tournament: null,
  
  // Active matches (currently being played)
  matches: [],
  
  // Completed matches in current tournament (grouped by round)
  completedMatches: [],
  
  // Upcoming fixtures for next round (during breaks)
  upcomingFixtures: [],
  
  // Recent events buffer (all events from current round)
  recentEvents: [],
  
  // Loading states
  isLoading: false,
  isInitialLoad: true,

  // Actions
  setConnected: (connected) => set({ connected }),
  setConnecting: (connecting) => set({ connecting }),
  setError: (error) => set({ error }),

  // Fetch full snapshot (status + matches)
  fetchSnapshot: async () => {
    set({ isLoading: true, error: null })
    
    try {
      const [statusRes, matchesRes] = await Promise.all([
        liveApi.getStatus(),
        liveApi.getMatches(),
      ])
      
      set({
        simulation: statusRes.simulation,
        tournament: statusRes.tournament,
        matches: matchesRes.matches || [],
        isLoading: false,
        isInitialLoad: false,
        lastUpdated: Date.now(),
        error: null,
      })
      
      return { status: statusRes, matches: matchesRes }
    } catch (err) {
      set({ 
        error: err.message || 'Failed to fetch live data',
        isLoading: false,
        isInitialLoad: false,
      })
      throw err
    }
  },

  // Fetch just tournament status (lightweight)
  fetchTournament: async () => {
    try {
      const data = await liveApi.getTournament()
      set({ tournament: data, lastUpdated: Date.now() })
      return data
    } catch (err) {
      console.error('Failed to fetch tournament:', err)
      throw err
    }
  },

  // Fetch just matches (lightweight)
  fetchMatches: async () => {
    try {
      const data = await liveApi.getMatches()
      set({ matches: data.matches || [], lastUpdated: Date.now() })
      return data
    } catch (err) {
      console.error('Failed to fetch matches:', err)
      throw err
    }
  },

  // Handle incoming SSE event
  handleEvent: (event) => {
    const { type, fixtureId, score, penaltyScore } = event
    
    // Add to recent events buffer (keep last 50)
    set(state => ({
      recentEvents: [...state.recentEvents, event].slice(-50),
      lastUpdated: Date.now(),
    }))
    
    // Handle specific event types
    switch (type) {
      case 'goal':
      case 'penalty_scored':
      case 'shootout_goal':
        // Update match score
        if (fixtureId && score) {
          set(state => ({
            matches: state.matches.map(m => 
              m.fixtureId === fixtureId 
                ? { ...m, score, penaltyScore: penaltyScore || m.penaltyScore }
                : m
            )
          }))
        }
        break
        
      case 'halftime':
      case 'second_half_start':
      case 'fulltime':
      case 'extra_time_start':
      case 'shootout_start':
        // Update match state
        if (fixtureId) {
          const stateMap = {
            halftime: 'HALFTIME',
            second_half_start: 'SECOND_HALF',
            fulltime: 'FINISHED',
            extra_time_start: 'EXTRA_TIME_1',
            shootout_start: 'PENALTIES',
          }
          const newState = stateMap[type]
          if (newState) {
            set(state => ({
              matches: state.matches.map(m =>
                m.fixtureId === fixtureId ? { ...m, state: newState } : m
              )
            }))
          }
        }
        break
        
      case 'match_start':
        // Add match if not present, or update state
        set(state => {
          const exists = state.matches.some(m => m.fixtureId === fixtureId)
          if (!exists && event.homeTeam && event.awayTeam) {
            return {
              matches: [...state.matches, {
                fixtureId,
                state: 'FIRST_HALF',
                minute: 0,
                score: { home: 0, away: 0 },
                penaltyScore: { home: 0, away: 0 },
                homeTeam: event.homeTeam,
                awayTeam: event.awayTeam,
                isFinished: false,
              }]
            }
          }
          return {
            matches: state.matches.map(m =>
              m.fixtureId === fixtureId ? { ...m, state: 'FIRST_HALF' } : m
            )
          }
        })
        break
        
      case 'match_end':
        // Move match to completed, remove from active
        set(state => {
          const match = state.matches.find(m => m.fixtureId === fixtureId)
          if (match) {
            const completedMatch = { 
              ...match, 
              isFinished: true, 
              state: 'FINISHED',
              score: score || match.score,
              penaltyScore: penaltyScore || match.penaltyScore,
            }
            return {
              matches: state.matches.filter(m => m.fixtureId !== fixtureId),
              completedMatches: [...state.completedMatches, completedMatch],
            }
          }
          return state
        })
        break
        
      case 'round_start':
        // Refetch matches for new round
        get().fetchMatches()
        if (event.round) {
          set(state => ({
            tournament: state.tournament 
              ? { ...state.tournament, currentRound: event.round }
              : state.tournament
          }))
        }
        break
        
      case 'round_complete':
        // Update tournament state
        if (event.round) {
          get().fetchSnapshot()
        }
        break
        
      case 'tournament_end':
        // Tournament complete - show winner
        set(state => ({
          tournament: state.tournament 
            ? { 
                ...state.tournament, 
                state: 'RESULTS',
                winner: event.winner,
                runnerUp: event.runnerUp,
              }
            : state.tournament
        }))
        break
        
      default:
        // Ignore other events
        break
    }
  },

  // Update single match (from minute tick or detail fetch)
  updateMatch: (fixtureId, updates) => {
    set(state => ({
      matches: state.matches.map(m =>
        m.fixtureId === fixtureId ? { ...m, ...updates } : m
      )
    }))
  },

  // Get match by ID
  getMatch: (fixtureId) => {
    return get().matches.find(m => m.fixtureId === fixtureId)
  },

  // Get tournament state label
  getTournamentStateLabel: () => {
    const { tournament } = get()
    if (!tournament?.state) return 'Loading...'
    return TOURNAMENT_STATE_LABELS[tournament.state] || tournament.state
  },

  // Get match state label
  getMatchStateLabel: (state) => {
    return MATCH_STATE_LABELS[state] || state
  },

  // Check if tournament is active (matches being played)
  isTournamentActive: () => {
    const { tournament } = get()
    if (!tournament?.state) return false
    return ['ROUND_OF_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'].includes(tournament.state)
  },

  // Check if in break period
  isBreakPeriod: () => {
    const { tournament } = get()
    if (!tournament?.state) return false
    return ['SETUP', 'QF_BREAK', 'SF_BREAK', 'FINAL_BREAK'].includes(tournament.state)
  },

  // Get current round name
  getCurrentRound: () => {
    const { tournament } = get()
    if (!tournament?.state) return null
    return STATE_TO_ROUND[tournament.state] || tournament.currentRound
  },

  // Get next round name (for break periods)
  getNextRound: () => {
    const { tournament } = get()
    if (!tournament?.state) return null
    return STATE_TO_NEXT_ROUND[tournament.state] || null
  },

  // Get all matches for bracket (active + completed)
  getAllBracketMatches: () => {
    const { matches, completedMatches } = get()
    return [...completedMatches, ...matches]
  },

  // Get completed matches grouped by round
  getMatchesByRound: () => {
    const { completedMatches, matches } = get()
    const allMatches = [...completedMatches, ...matches]
    
    const grouped = {}
    ROUND_ORDER.forEach(round => {
      grouped[round] = allMatches.filter(m => 
        m.round === round || 
        m.round?.toLowerCase().includes(round.toLowerCase().replace('-', ''))
      )
    })
    
    return grouped
  },

  // Get matches for a specific round
  getMatchesForRound: (roundName) => {
    const { completedMatches, matches } = get()
    const allMatches = [...completedMatches, ...matches]
    
    return allMatches.filter(m => 
      m.round === roundName || 
      m.round?.toLowerCase().includes(roundName.toLowerCase().replace('-', ''))
    )
  },

  // Get only completed matches
  getCompletedMatches: () => {
    return get().completedMatches
  },

  // Get live (in-progress) matches
  getLiveMatches: () => {
    const { matches } = get()
    return matches.filter(m => 
      ['FIRST_HALF', 'SECOND_HALF', 'EXTRA_TIME_1', 'EXTRA_TIME_2', 'PENALTIES', 'HALFTIME', 'ET_HALFTIME'].includes(m.state)
    )
  },

  // Get recent events for a specific match
  getEventsForMatch: (fixtureId) => {
    const { recentEvents } = get()
    return recentEvents.filter(e => e.fixtureId === fixtureId)
  },

  // Get goal events from recent events
  getRecentGoals: () => {
    const { recentEvents } = get()
    return recentEvents.filter(e => 
      ['goal', 'penalty_scored', 'shootout_goal'].includes(e.type)
    )
  },

  // Set upcoming fixtures (during breaks)
  setUpcomingFixtures: (fixtures) => set({ upcomingFixtures: fixtures }),

  // Reset store
  reset: () => set({
    connected: false,
    connecting: false,
    error: null,
    lastUpdated: null,
    simulation: null,
    tournament: null,
    matches: [],
    completedMatches: [],
    upcomingFixtures: [],
    recentEvents: [],
    isLoading: false,
    isInitialLoad: true,
  }),

  // Clear completed matches (for new tournament)
  clearCompletedMatches: () => set({ completedMatches: [], upcomingFixtures: [] }),

  // Clear events (on new round)
  clearEvents: () => set({ recentEvents: [] }),
}))

export default useLiveStore

