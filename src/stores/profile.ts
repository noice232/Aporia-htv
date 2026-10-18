import { create } from 'zustand'
import type { Profile, Principle } from '../api/client'

interface ProfileState {
  profile: Profile | null
  principles: Principle[]
  loading: boolean
  error: string | null
  setProfile: (profile: Profile) => void
  setPrinciples: (principles: Principle[]) => void
  addPrinciple: (principle: Principle) => void
  updatePrinciple: (id: string, patch: Partial<Principle>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  principles: [],
  loading: false,
  error: null,
  setProfile: (profile) => set({ profile, loading: false }),
  setPrinciples: (principles) => set({ principles }),
  addPrinciple: (principle) => set((s) => ({ principles: [...s.principles, principle] })),
  updatePrinciple: (id, patch) =>
    set((s) => ({
      principles: s.principles.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
}))
