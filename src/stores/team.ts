import { create } from 'zustand'

const BASE = import.meta.env.VITE_API_BASE_URL || ''

export interface TeamSession {
  id: string
  name: string
  participantCount: number
  status: 'active' | 'idle' | 'closed'
  createdAt: string
}

export interface TeamMember {
  id: string
  name: string
  role: string
  online: boolean
}

interface TeamState {
  sessions: TeamSession[]
  members: TeamMember[]
  currentSessionId: string | null
  loading: boolean
  error: string | null
  setSessions: (sessions: TeamSession[]) => void
  setMembers: (members: TeamMember[]) => void
  setCurrentSession: (id: string | null) => void
  fetchSessions: (workspaceId: string) => Promise<void>
  fetchMembers: (workspaceId: string) => Promise<void>
}

export const useTeamStore = create<TeamState>((set) => ({
  sessions: [],
  members: [],
  currentSessionId: null,
  loading: false,
  error: null,
  setSessions: (sessions) => set({ sessions }),
  setMembers: (members) => set({ members }),
  setCurrentSession: (id) => set({ currentSessionId: id }),
  fetchSessions: async (workspaceId: string) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${BASE}/api/v1/workspaces/${workspaceId}/sessions`)
      if (!res.ok) throw new Error(`Failed (${res.status})`)
      const data = await res.json()
      set({ sessions: data, loading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to fetch sessions', loading: false })
    }
  },
  fetchMembers: async (workspaceId: string) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${BASE}/api/v1/workspaces/${workspaceId}/members`)
      if (!res.ok) throw new Error(`Failed (${res.status})`)
      const data = await res.json()
      set({ members: data, loading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to fetch members', loading: false })
    }
  },
}))
