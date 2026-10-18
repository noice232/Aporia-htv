import { create } from 'zustand'

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
  setPapers: (papers: Paper[]) => void
  addPapers: (papers: Paper[]) => void
  setSyncStatus: (status: SourceState['syncStatus']) => void
  setPapiersConnected: (connected: boolean) => void
  setSearchResults: (results: Paper[]) => void
}

export const useSourceStore = create<SourceState>((set) => ({
  papers: [],
  syncStatus: 'idle',
  papiersConnected: false,
  searchResults: [],
  setPapers: (papers) => set({ papers }),
  addPapers: (newPapers) => set((s) => ({ papers: [...s.papers, ...newPapers] })),
  setSyncStatus: (syncStatus) => set({ syncStatus }),
  setPapiersConnected: (papiersConnected) => set({ papiersConnected }),
  setSearchResults: (searchResults) => set({ searchResults }),
}))
