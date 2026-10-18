import { create } from 'zustand'
import type { PolicyRun, Candidate } from '../api/client'

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
}))
