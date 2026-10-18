import { create } from 'zustand'

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
  setSessions: (sessions: TeamSession[]) => void
  setMembers: (members: TeamMember[]) => void
  setCurrentSession: (id: string | null) => void
}

export const useTeamStore = create<TeamState>((set) => ({
  sessions: [],
  members: [],
  currentSessionId: null,
  setSessions: (sessions) => set({ sessions }),
  setMembers: (members) => set({ members }),
  setCurrentSession: (id) => set({ currentSessionId: id }),
}))
