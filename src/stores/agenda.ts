import { create } from 'zustand'
import type { AgendaItem } from '../api/client'

const BASE = import.meta.env.VITE_API_BASE_URL || ''

interface AgendaState {
  items: AgendaItem[]
  loading: boolean
  error: string | null
  setItems: (items: AgendaItem[]) => void
  addItem: (item: AgendaItem) => void
  updateItem: (id: string, patch: Partial<AgendaItem>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  fetchItems: (projectId: string) => Promise<void>
}

export const useAgendaStore = create<AgendaState>((set) => ({
  items: [],
  loading: false,
  error: null,
  setItems: (items) => set({ items, loading: false }),
  addItem: (item) => set((s) => ({ items: [...s.items, item] })),
  updateItem: (id, patch) =>
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  fetchItems: async (projectId: string) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${BASE}/api/v1/projects/${projectId}/agenda`)
      if (!res.ok) throw new Error(`Failed (${res.status})`)
      const data = await res.json()
      set({ items: data, loading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to fetch agenda', loading: false })
    }
  },
}))
