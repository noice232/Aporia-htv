import createClient from 'openapi-fetch'
import type { components, paths } from './generated'

export type Schema<Name extends keyof components['schemas']> = components['schemas'][Name]
export type Project = Schema<'ProjectOut'>
export type Health = Schema<'HealthStatus'>
export type GoalResult = Schema<'GoalResult'>
export type Run = Schema<'RunSummary'>
export type PolicyRun = Schema<'PolicyRunOut'>
export type Candidate = Schema<'CandidateScoreOut'>
export type Principle = Schema<'PrincipleOut'>
export type Profile = Schema<'ProfileOut'>
export type ProfileVersion = Schema<'ProfileVersionOut'>
export type Fork = Schema<'ForkOut'>
export type ForkSummary = Schema<'ForkSummaryOut'>
export type Event = Schema<'EventOut'>
export type EventPage = Schema<'EventPage'>
export type AgendaItem = Schema<'AgendaItemOut'>

const api = createClient<paths>({ baseUrl: import.meta.env.VITE_API_BASE_URL || '' })

type Result<T> = { data?: T; error?: unknown; response: Response }

function unwrap<T>(result: Result<T>): T {
  if (result.data !== undefined) return result.data
  const error = result.error
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    throw new Error(error.message)
  }
  throw new Error(`Request failed (${result.response.status || 'network error'})`)
}

export const getHealth = async () => unwrap(await api.GET('/api/v1/health'))
export const createProject = async (title: string, objective: string) =>
  unwrap(await api.POST('/api/v1/projects', { body: { title, objective: objective || null } }))
export const submitGoal = async (projectId: string, threshold: number, seed: number) =>
  unwrap(
    await api.POST('/api/v1/projects/{project_id}/goals', {
      params: { path: { project_id: projectId } },
      body: { threshold, seed },
    }),
  )
export const listRuns = async (projectId: string) =>
  unwrap(await api.GET('/api/v1/projects/{project_id}/runs', { params: { path: { project_id: projectId } } }))

// Keep this request deliberately narrower than ScoreRequest. The server owns all scores.
export const scorePolicy = async (projectId: string, w: number, signal?: AbortSignal) =>
  unwrap(
    await api.POST('/api/v1/projects/{project_id}/policy/score', {
      params: { path: { project_id: projectId } },
      body: { w },
      signal,
    }),
  )

export const listPrinciples = async (projectId: string) =>
  unwrap(
    await api.GET('/api/v1/projects/{project_id}/principles', {
      params: { path: { project_id: projectId } },
    }),
  )
export const getProfile = async (projectId: string) =>
  unwrap(
    await api.GET('/api/v1/projects/{project_id}/profile', { params: { path: { project_id: projectId } } }),
  )
export const getProfileHistory = async (projectId: string) =>
  unwrap(
    await api.GET('/api/v1/projects/{project_id}/profile/history', {
      params: { path: { project_id: projectId } },
    }),
  )
export const submitJudgment = async (projectId: string, judgment: string) =>
  unwrap(
    await api.POST('/api/v1/projects/{project_id}/judgments', {
      params: { path: { project_id: projectId } },
      body: { text: judgment },
    }),
  )
export const approvePrinciple = async (projectId: string, principleId: string) =>
  unwrap(
    await api.POST('/api/v1/projects/{project_id}/principles/{principle_id}/approve', {
      params: { path: { project_id: projectId, principle_id: principleId } },
    }),
  )

export const listForks = async (projectId: string) =>
  unwrap(
    await api.GET('/api/v1/projects/{project_id}/forks', { params: { path: { project_id: projectId } } }),
  )
export const getFork = async (projectId: string, forkId: string) =>
  unwrap(
    await api.GET('/api/v1/projects/{project_id}/forks/{fork_id}', {
      params: { path: { project_id: projectId, fork_id: forkId } },
    }),
  )
export const createFork = async (projectId: string, w: number) =>
  unwrap(
    await api.POST('/api/v1/projects/{project_id}/forks', {
      params: { path: { project_id: projectId } },
      body: { w },
    }),
  )

export const listEvents = async (projectId: string, after: number, limit = 20) =>
  unwrap(
    await api.GET('/api/v1/projects/{project_id}/events', {
      params: { path: { project_id: projectId }, query: { after, limit } },
    }),
  )

export const listAgenda = async (projectId: string) =>
  unwrap(
    await api.GET('/api/v1/projects/{project_id}/agenda', { params: { path: { project_id: projectId } } }),
  )
