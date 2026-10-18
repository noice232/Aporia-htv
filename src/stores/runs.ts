import { create } from 'zustand'
import type { Run } from '../api/client'

interface RunState {
  runs: Run[]
  loading: boolean
  error: string | null
  setRuns: (runs: Run[]) => void
  addRun: (run: Run) => void
  updateRun: (id: string, patch: Partial<Run>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useRunStore = create<RunState>((set) => ({
  runs: [],
  loading: false,
  error: null,
  setRuns: (runs) => set({ runs, loading: false }),
  addRun: (run) => set((s) => ({ runs: [...s.runs, run] })),
  updateRun: (id, patch) =>
    set((s) => ({
      runs: s.runs.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
}))
