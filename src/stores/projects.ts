import { create } from 'zustand'
import type { Project } from '../api/client'

interface ProjectState {
  projects: Project[]
  currentId: string | null
  loading: boolean
  error: string | null
  setCurrent: (id: string | null) => void
  setProjects: (projects: Project[]) => void
  addProject: (project: Project) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentId: null,
  loading: false,
  error: null,
  setCurrent: (id) => set({ currentId: id }),
  setProjects: (projects) => set({ projects, loading: false }),
  addProject: (project) => set((s) => ({ projects: [...s.projects, project] })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
}))
