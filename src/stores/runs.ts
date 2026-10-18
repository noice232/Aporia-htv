import { create } from 'zustand'
import type { Run } from '../api/client'

const BASE = import.meta.env.VITE_API_BASE_URL || ''

interface RunState {
  runs: Run[]
  loading: boolean
  error: string | null
  setRuns: (runs: Run[]) => void
  addRun: (run: Run) => void
  updateRun: (id: string, patch: Partial<Run>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  fetchRuns: (projectId: string) => Promise<void>
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
  fetchRuns: async (projectId: string) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${BASE}/api/v1/projects/${projectId}/runs`)
      if (!res.ok) throw new Error(`Failed (${res.status})`)
      const data = await res.json()
      set({ runs: data, loading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to fetch runs', loading: false })
    }
  },
}))
