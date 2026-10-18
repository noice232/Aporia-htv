import { create } from 'zustand'

const BASE = import.meta.env.VITE_API_BASE_URL || ''

export interface GraphNode {
  id: string
  label: string
  type: 'paper' | 'claim' | 'question' | 'method' | 'blocker'
  cluster?: string
  position: [number, number, number]
  color: [number, number, number]
  size: number
  metadata?: Record<string, unknown>
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  type: 'citation' | 'dependency' | 'evidence' | 'contradiction'
  weight: number
}

interface GraphState {
  nodes: GraphNode[]
  edges: GraphEdge[]
  selectedNodeId: string | null
  hoveredNodeId: string | null
  searchQuery: string
  clusters: string[]
  visibleClusters: Set<string>
  layoutVersion: number
  loading: boolean
  error: string | null
  setNodes: (nodes: GraphNode[]) => void
  addNodes: (nodes: GraphNode[]) => void
  setEdges: (edges: GraphEdge[]) => void
  selectNode: (id: string | null) => void
  hoverNode: (id: string | null) => void
  setSearch: (query: string) => void
  toggleCluster: (cluster: string) => void
  fetchGraph: (projectId: string) => Promise<void>
}

export const useGraphStore = create<GraphState>((set) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  hoveredNodeId: null,
  searchQuery: '',
  clusters: [],
  visibleClusters: new Set(),
  layoutVersion: 0,
  loading: false,
  error: null,
  setNodes: (nodes) => {
    const clusters = [...new Set(nodes.map((n) => n.cluster).filter(Boolean) as string[])]
    set({ nodes, clusters, visibleClusters: new Set(clusters), layoutVersion: Date.now() })
  },
  addNodes: (newNodes) =>
    set((s) => {
      const merged = [...s.nodes, ...newNodes]
      const clusters = [...new Set(merged.map((n) => n.cluster).filter(Boolean) as string[])]
      return { nodes: merged, clusters, visibleClusters: new Set(clusters) }
    }),
  setEdges: (edges) => set({ edges }),
  selectNode: (id) => set({ selectedNodeId: id }),
  hoverNode: (id) => set({ hoveredNodeId: id }),
  setSearch: (query) => set({ searchQuery: query }),
  toggleCluster: (cluster) =>
    set((s) => {
      const next = new Set(s.visibleClusters)
      if (next.has(cluster)) next.delete(cluster)
      else next.add(cluster)
      return { visibleClusters: next }
    }),
  fetchGraph: async (projectId: string) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${BASE}/api/v1/projects/${projectId}/graph`)
      if (!res.ok) throw new Error(`Failed (${res.status})`)
      const data = await res.json()
      const nodes: GraphNode[] = (data.nodes || []).map((n: Record<string, unknown>) => ({
        id: String(n.id),
        label: String(n.label || ''),
        type: String(n.type || 'paper') as GraphNode['type'],
        cluster: n.cluster ? String(n.cluster) : undefined,
        position: Array.isArray(n.position) ? n.position : [0, 0, 0],
        color: Array.isArray(n.color) ? n.color : [0.5, 0.5, 0.5],
        size: typeof n.size === 'number' ? n.size : 1,
        metadata: n.metadata as Record<string, unknown> | undefined,
      }))
      const edges: GraphEdge[] = (data.edges || []).map((e: Record<string, unknown>) => ({
        id: String(e.id),
        source: String(e.source),
        target: String(e.target),
        type: String(e.type || 'citation') as GraphEdge['type'],
        weight: typeof e.weight === 'number' ? e.weight : 1,
      }))
      const clusters = [...new Set(nodes.map((n) => n.cluster).filter(Boolean) as string[])]
      set({ nodes, edges, clusters, visibleClusters: new Set(clusters), layoutVersion: Date.now(), loading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to fetch graph', loading: false })
    }
  },
}))
