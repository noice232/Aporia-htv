import { create } from 'zustand'

const BASE = import.meta.env.VITE_API_BASE_URL || ''

export interface Paper {
  id: string
  title: string
  authors: string[]
  year: number
  venue?: string
  url?: string
  abstract?: string
  provenance: 'papiers' | 'openalex' | 'arxiv' | 'manual'
  cluster?: string
}

interface SourceState {
  papers: Paper[]
  syncStatus: 'idle' | 'syncing' | 'done' | 'error'
  papiersConnected: boolean
  searchResults: Paper[]
  loading: boolean
  error: string | null
  setPapers: (papers: Paper[]) => void
  addPapers: (papers: Paper[]) => void
  setSyncStatus: (status: SourceState['syncStatus']) => void
  setPapiersConnected: (connected: boolean) => void
  setSearchResults: (results: Paper[]) => void
  fetchPapers: () => Promise<void>
  searchPapers: (query: string) => Promise<void>
  checkPapiers: () => Promise<void>
}

export const useSourceStore = create<SourceState>((set) => ({
  papers: [],
  syncStatus: 'idle',
  papiersConnected: false,
  searchResults: [],
  loading: false,
  error: null,
  setPapers: (papers) => set({ papers }),
  addPapers: (newPapers) => set((s) => ({ papers: [...s.papers, ...newPapers] })),
  setSyncStatus: (syncStatus) => set({ syncStatus }),
  setPapiersConnected: (papiersConnected) => set({ papiersConnected }),
  setSearchResults: (searchResults) => set({ searchResults }),
  fetchPapers: async () => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${BASE}/api/v1/papers`)
      if (!res.ok) throw new Error(`Failed (${res.status})`)
      const data = await res.json()
      set({ papers: data, loading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to fetch papers', loading: false })
    }
  },
  searchPapers: async (query: string) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${BASE}/api/v1/papiers/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      if (!res.ok) throw new Error(`Failed (${res.status})`)
      const data = await res.json()
      set({ searchResults: data.results || data, loading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Search failed', loading: false })
    }
  },
  checkPapiers: async () => {
    try {
      const res = await fetch(`${BASE}/api/v1/papiers/status`)
      if (!res.ok) throw new Error(`Failed (${res.status})`)
      const data = await res.json()
      set({ papiersConnected: data.connected ?? data.available ?? false })
    } catch {
      set({ papiersConnected: false })
    }
  },
}))
