import type { GraphNode, GraphEdge } from '../stores/graph'

const BASE = import.meta.env.VITE_API_BASE_URL || ''

export async function fetchGraph(projectId: string, cluster?: string, query?: string): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  const params = new URLSearchParams()
  if (cluster) params.set('cluster', cluster)
  if (query) params.set('q', query)
  const qs = params.toString()
  const url = `${BASE}/api/v1/projects/${projectId}/graph${qs ? `?${qs}` : ''}`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Graph fetch failed (${res.status})`)
  return res.json()
}

export async function fetchNodeDetail(projectId: string, nodeId: string) {
  const res = await fetch(`${BASE}/api/v1/projects/${projectId}/graph/node/${nodeId}`)
  if (!res.ok) throw new Error(`Node detail fetch failed (${res.status})`)
  return res.json()
}
