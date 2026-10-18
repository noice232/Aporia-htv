import { create } from 'zustand'
import type { Profile, Principle } from '../api/client'

const BASE = import.meta.env.VITE_API_BASE_URL || ''

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
  fetchProfile: (projectId: string) => Promise<void>
  fetchPrinciples: (projectId: string) => Promise<void>
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
  fetchProfile: async (projectId: string) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${BASE}/api/v1/projects/${projectId}/profile`)
      if (!res.ok) throw new Error(`Failed (${res.status})`)
      const data = await res.json()
      set({ profile: data, loading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to fetch profile', loading: false })
    }
  },
  fetchPrinciples: async (projectId: string) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${BASE}/api/v1/projects/${projectId}/principles`)
      if (!res.ok) throw new Error(`Failed (${res.status})`)
      const data = await res.json()
      set({ principles: data, loading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to fetch principles', loading: false })
    }
  },
}))
