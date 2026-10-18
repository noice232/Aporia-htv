import { useMemo } from 'react'
import { BufferGeometry, Float32BufferAttribute, LineBasicMaterial } from 'three'
import type { GraphNode, GraphEdge } from '../../stores/graph'

interface GraphEdgesProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  selectedNodeId: string | null
}

const EDGE_COLORS: Record<GraphEdge['type'], [number, number, number]> = {
  citation: [0.35, 0.55, 0.75],
  dependency: [0.45, 0.85, 0.65],
  evidence: [0.55, 0.75, 0.95],
  contradiction: [0.93, 0.32, 0.31],
}

export function GraphEdges({ nodes, edges, selectedNodeId }: GraphEdgesProps) {
  const nodeMap = useMemo(() => {
    const map = new Map<string, GraphNode>()
    for (const n of nodes) map.set(n.id, n)
    return map
  }, [nodes])

  const lineSegments = useMemo(() => {
    const groups: Record<string, { positions: number[]; opacities: number[] }> = {}

    for (const edge of edges) {
      const source = nodeMap.get(edge.source)
      const target = nodeMap.get(edge.target)
      if (!source || !target) continue

      const key = edge.type
      if (!groups[key]) groups[key] = { positions: [], opacities: [] }

      const isConnected = selectedNodeId && (edge.source === selectedNodeId || edge.target === selectedNodeId)
      const opacity = selectedNodeId ? (isConnected ? 0.6 : 0.04) : 0.15 * edge.weight

      groups[key].positions.push(
        source.position[0], source.position[1], source.position[2],
        target.position[0], target.position[1], target.position[2],
      )
      groups[key].opacities.push(opacity, opacity)
    }

    return Object.entries(groups).map(([type, { positions }]) => {
      const geo = new BufferGeometry()
      geo.setAttribute('position', new Float32BufferAttribute(positions, 3))
      const color = EDGE_COLORS[type as GraphEdge['type']]
      const isHighlighted = selectedNodeId !== null
      const mat = new LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: isHighlighted ? 0.08 : 0.12,
        depthWrite: false,
      })
      return { geo, mat, type }
    })
  }, [edges, nodeMap, selectedNodeId])

  const connectedEdges = useMemo(() => {
    if (!selectedNodeId) return null
    const connected = edges.filter((e) => e.source === selectedNodeId || e.target === selectedNodeId)
    if (connected.length === 0) return null

    const positions: number[] = []
    for (const edge of connected) {
      const source = nodeMap.get(edge.source)
      const target = nodeMap.get(edge.target)
      if (!source || !target) continue
      positions.push(
        source.position[0], source.position[1], source.position[2],
        target.position[0], target.position[1], target.position[2],
      )
    }

    const geo = new BufferGeometry()
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3))
    return geo
  }, [edges, nodeMap, selectedNodeId])

  return (
    <group>
      {lineSegments.map(({ geo, mat, type }) => (
        <lineSegments key={type} geometry={geo} material={mat} />
      ))}
      {connectedEdges && (
        <lineSegments geometry={connectedEdges}>
          <lineBasicMaterial color={[0.34, 0.91, 0.96]} transparent opacity={0.55} depthWrite={false} linewidth={1} />
        </lineSegments>
      )}
    </group>
  )
}
