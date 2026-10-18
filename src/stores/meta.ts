import { create } from 'zustand'

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
  setStrategies: (strategies: Strategy[]) => void
  setTrials: (trials: Trial[]) => void
  setLoading: (loading: boolean) => void
}

export const useMetaStore = create<MetaState>((set) => ({
  strategies: [],
  trials: [],
  loading: false,
  setStrategies: (strategies) => set({ strategies, loading: false }),
  setTrials: (trials) => set({ trials }),
  setLoading: (loading) => set({ loading }),
}))
