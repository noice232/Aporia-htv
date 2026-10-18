import { create } from 'zustand'
import type { AgendaItem } from '../api/client'

interface AgendaState {
  items: AgendaItem[]
  loading: boolean
  error: string | null
  setItems: (items: AgendaItem[]) => void
  addItem: (item: AgendaItem) => void
  updateItem: (id: string, patch: Partial<AgendaItem>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
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
}))
