import { create } from 'zustand'
import type { Fork, ForkSummary } from '../api/client'

interface ForkState {
  forks: ForkSummary[]
  currentFork: Fork | null
  loading: boolean
  error: string | null
  setForks: (forks: ForkSummary[]) => void
  setCurrentFork: (fork: Fork | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
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
}))
