import { Html } from '@react-three/drei'
import type { GraphNode } from '../../stores/graph'

interface NodeTooltipProps {
  node: GraphNode
}

export function NodeTooltip({ node }: NodeTooltipProps) {
  const meta = node.metadata as Record<string, unknown> | undefined

  return (
    <Html
      position={[node.position[0], node.position[1] + node.size + 0.8, node.position[2]]}
      center
      distanceFactor={20}
      style={{ pointerEvents: 'none' }}
    >
      <div style={{
        background: 'rgba(11, 17, 27, 0.95)',
        border: '1px solid rgba(151, 180, 220, 0.2)',
        borderRadius: 8,
        padding: '10px 14px',
        maxWidth: 260,
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      }}>
        <div style={{
          fontSize: 12,
          fontWeight: 600,
          color: '#E5EFFA',
          marginBottom: 4,
          lineHeight: 1.3,
        }}>
          {node.label}
        </div>
        <div style={{
          display: 'flex',
          gap: 8,
          fontSize: 10,
          color: '#8898AF',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {meta?.venue && <span>{String(meta.venue)}</span>}
          {meta?.year && <span>{String(meta.year)}</span>}
          {meta?.citations != null && <span>{String(meta.citations)} cites</span>}
        </div>
        <div style={{
          marginTop: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: `rgb(${node.color.map((c) => Math.round(c * 255)).join(',')})`,
          }} />
          <span style={{
            fontSize: 9,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#556577',
          }}>
            {node.cluster?.replace(/_/g, ' ')}
          </span>
        </div>
      </div>
    </Html>
  )
}
