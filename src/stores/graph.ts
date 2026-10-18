import { create } from 'zustand'

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
  setNodes: (nodes: GraphNode[]) => void
  addNodes: (nodes: GraphNode[]) => void
  setEdges: (edges: GraphEdge[]) => void
  selectNode: (id: string | null) => void
  hoverNode: (id: string | null) => void
  setSearch: (query: string) => void
  toggleCluster: (cluster: string) => void
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
}))
