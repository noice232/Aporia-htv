import { create } from 'zustand'
import type { Event } from '../api/client'

interface EventState {
  events: Event[]
  cursor: number
  connected: boolean
  error: string | null
  appendEvents: (events: Event[]) => void
  setCursor: (cursor: number) => void
  setConnected: (connected: boolean) => void
  setError: (error: string | null) => void
  clear: () => void
}

export const useEventStore = create<EventState>((set) => ({
  events: [],
  cursor: 0,
  connected: false,
  error: null,
  appendEvents: (newEvents) =>
    set((s) => {
      const existing = new Set(s.events.map((e) => e.id))
      const deduped = newEvents.filter((e) => !existing.has(e.id))
      const merged = [...s.events, ...deduped].sort(
        (a, b) => (a.sequence ?? 0) - (b.sequence ?? 0),
      )
      const maxSeq = merged.reduce((m, e) => Math.max(m, e.sequence ?? 0), s.cursor)
      return { events: merged, cursor: maxSeq }
    }),
  setCursor: (cursor) => set({ cursor }),
  setConnected: (connected) => set({ connected }),
  setError: (error) => set({ error }),
  clear: () => set({ events: [], cursor: 0, connected: false, error: null }),
}))
