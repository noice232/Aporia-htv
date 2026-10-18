import { create } from 'zustand'
import type { Fork, ForkSummary } from '../api/client'

const BASE = import.meta.env.VITE_API_BASE_URL || ''

interface ForkState {
  forks: ForkSummary[]
  currentFork: Fork | null
  loading: boolean
  error: string | null
  setForks: (forks: ForkSummary[]) => void
  setCurrentFork: (fork: Fork | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  fetchForks: (projectId: string) => Promise<void>
  fetchFork: (projectId: string, forkId: string) => Promise<void>
}

export const useForkStore = create<ForkState>((set) => ({
  forks: [],
  currentFork: null,
  loading: false,
  error: null,
  setForks: (forks) => set({ forks, loading: false }),
  setCurrentFork: (fork) => set({ currentFork: fork, loading: false }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  fetchForks: async (projectId: string) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${BASE}/api/v1/projects/${projectId}/forks`)
      if (!res.ok) throw new Error(`Failed (${res.status})`)
      const data = await res.json()
      set({ forks: data, loading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to fetch forks', loading: false })
    }
  },
  fetchFork: async (projectId: string, forkId: string) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${BASE}/api/v1/projects/${projectId}/forks/${forkId}`)
      if (!res.ok) throw new Error(`Failed (${res.status})`)
      const data = await res.json()
      set({ currentFork: data, loading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to fetch fork', loading: false })
    }
  },
}))
