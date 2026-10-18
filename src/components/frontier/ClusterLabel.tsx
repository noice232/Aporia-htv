import { Html } from '@react-three/drei'
import type { GraphNode } from '../../stores/graph'

interface ClusterLabelProps {
  cluster: string
  nodes: GraphNode[]
}

const CLUSTER_LABELS: Record<string, string> = {
  computer_vision: 'Computer Vision',
  generative_models: 'Generative Models',
  nlp: 'Natural Language Processing',
  reinforcement_learning: 'Reinforcement Learning',
  multimodal: 'Multimodal',
}

export function ClusterLabel({ cluster, nodes }: ClusterLabelProps) {
  const cx = nodes.reduce((s, n) => s + n.position[0], 0) / nodes.length
  const cy = nodes.reduce((s, n) => s + n.position[1], 0) / nodes.length + 5
  const cz = nodes.reduce((s, n) => s + n.position[2], 0) / nodes.length

  return (
    <Html position={[cx, cy, cz]} center distanceFactor={30} style={{ pointerEvents: 'none' }}>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: `rgb(${nodes[0].color.map((c) => Math.round(c * 255)).join(',')})`,
        opacity: 0.7,
        whiteSpace: 'nowrap',
        textShadow: '0 0 12px rgba(0,0,0,0.8)',
      }}>
        {CLUSTER_LABELS[cluster] || cluster}
      </div>
    </Html>
  )
}
