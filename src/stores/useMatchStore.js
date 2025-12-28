import { create } from 'zustand'
import { fixturesApi, teamsApi } from '../api/client'

export const useMatchStore = create((set, get) => ({
  // State
  fixtures: [],
  currentFixture: null,
  events: [],
  teams: [],
  isLoading: false,
  error: null,
  lastEventId: 0,
  isLive: false,

  // Actions
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error, isLoading: false }),
  clearError: () => set({ error: null }),

  // Fetch all fixtures
  fetchFixtures: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await fixturesApi.getAll(params)
      set({ fixtures: data, isLoading: false })
      return data
    } catch (error) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  // Fetch single fixture
  fetchFixture: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await fixturesApi.getById(id)
      set({ currentFixture: data, isLoading: false })
      return data
    } catch (error) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  // Fetch fixture events
  fetchEvents: async (id, afterEventId = null) => {
    try {
      const { data } = await fixturesApi.getEvents(id, afterEventId)
      return data
    } catch (error) {
      console.error('Failed to fetch events:', error)
      throw error
    }
  },

  // Initialize live match
  initLiveMatch: async (id) => {
    set({ isLoading: true, error: null, events: [], lastEventId: 0, isLive: true })
    try {
      const [fixtureRes, eventsRes] = await Promise.all([
        fixturesApi.getById(id),
        fixturesApi.getEvents(id)
      ])
      
      const events = eventsRes.data
      const lastEventId = events.length > 0 ? events[events.length - 1].event_id : 0
      
      set({
        currentFixture: fixtureRes.data,
        events,
        lastEventId,
        isLoading: false,
        isLive: fixtureRes.data.status === 'live'
      })
      
      return { fixture: fixtureRes.data, events }
    } catch (error) {
      set({ error: error.message, isLoading: false, isLive: false })
      throw error
    }
  },

  // Add new events (for polling)
  addEvents: (newEvents) => {
    if (!newEvents || newEvents.length === 0) return
    
    const endEvents = ['fulltime', 'shootout_end']
    const hasEnded = newEvents.some(e => endEvents.includes(e.event_type))
    const lastEventId = newEvents[newEvents.length - 1].event_id
    
    set((state) => ({
      events: [...state.events, ...newEvents],
      lastEventId,
      isLive: hasEnded ? false : state.isLive
    }))
    
    return hasEnded
  },

  // Stop live match
  stopLiveMatch: () => set({ isLive: false }),

  // Fetch all teams
  fetchTeams: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await teamsApi.getTop16()
      set({ teams: data, isLoading: false })
      return data
    } catch (error) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  // Reset store
  reset: () => set({
    fixtures: [],
    currentFixture: null,
    events: [],
    isLoading: false,
    error: null,
    lastEventId: 0,
    isLive: false
  })
}))

export default useMatchStore

