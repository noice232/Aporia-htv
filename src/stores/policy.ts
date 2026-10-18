import { create } from 'zustand'
import type { PolicyRun, Candidate } from '../api/client'

const BASE = import.meta.env.VITE_API_BASE_URL || ''

interface PolicyState {
  currentRun: PolicyRun | null
  candidates: Candidate[]
  w: number
  scoring: boolean
  error: string | null
  setRun: (run: PolicyRun) => void
  setCandidates: (candidates: Candidate[]) => void
  setW: (w: number) => void
  setScoring: (scoring: boolean) => void
  setError: (error: string | null) => void
  fetchScore: (projectId: string, w: number) => Promise<void>
}

export const usePolicyStore = create<PolicyState>((set) => ({
  currentRun: null,
  candidates: [],
  w: 1.0,
  scoring: false,
  error: null,
  setRun: (run) => set({ currentRun: run, scoring: false }),
  setCandidates: (candidates) => set({ candidates }),
  setW: (w) => set({ w }),
  setScoring: (scoring) => set({ scoring }),
  setError: (error) => set({ error, scoring: false }),
  fetchScore: async (projectId: string, w: number) => {
    set({ scoring: true, error: null })
    try {
      const res = await fetch(`${BASE}/api/v1/projects/${projectId}/policy/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ w }),
      })
      if (!res.ok) throw new Error(`Failed (${res.status})`)
      const data = await res.json()
      set({ currentRun: data, candidates: data.candidates || [], scoring: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Scoring failed', scoring: false })
    }
  },
}))
