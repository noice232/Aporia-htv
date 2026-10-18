import { create } from 'zustand'

const BASE = import.meta.env.VITE_API_BASE_URL || ''

export interface Strategy {
  id: string
  name: string
  description: string
  status: 'active' | 'retired' | 'candidate'
  version: number
}

export interface Trial {
  id: string
  strategyA: string
  strategyB: string
  status: 'pending' | 'running' | 'completed'
  result?: 'a_wins' | 'b_wins' | 'inconclusive'
}

interface MetaState {
  strategies: Strategy[]
  trials: Trial[]
  loading: boolean
  error: string | null
  setStrategies: (strategies: Strategy[]) => void
  setTrials: (trials: Trial[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  fetchStrategies: (workspaceId: string) => Promise<void>
  fetchTrials: (workspaceId: string) => Promise<void>
}

export const useMetaStore = create<MetaState>((set) => ({
  strategies: [],
  trials: [],
  loading: false,
  error: null,
  setStrategies: (strategies) => set({ strategies, loading: false }),
  setTrials: (trials) => set({ trials }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  fetchStrategies: async (workspaceId: string) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${BASE}/api/v1/workspaces/${workspaceId}/strategies`)
      if (!res.ok) throw new Error(`Failed (${res.status})`)
      const data = await res.json()
      set({ strategies: data, loading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to fetch strategies', loading: false })
    }
  },
  fetchTrials: async (workspaceId: string) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${BASE}/api/v1/workspaces/${workspaceId}/meta`)
      if (!res.ok) throw new Error(`Failed (${res.status})`)
      const data = await res.json()
      set({ trials: data, loading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to fetch trials', loading: false })
    }
  },
}))
