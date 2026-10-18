import type { GraphNode, GraphEdge } from '../../stores/graph'

interface NodeDetailProps {
  node: GraphNode
  edges: GraphEdge[]
  nodes: GraphNode[]
  onClose: () => void
}

const EDGE_TYPE_LABELS: Record<string, string> = {
  citation: 'Cites',
  dependency: 'Depends on',
  evidence: 'Evidence for',
  contradiction: 'Contradicts',
}

export function NodeDetail({ node, edges, nodes, onClose }: NodeDetailProps) {
  const meta = node.metadata as Record<string, unknown> | undefined
  const connected = edges.filter((e) => e.source === node.id || e.target === node.id)
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  return (
    <div className="frontier-detail">
      <div className="frontier-detail-header">
        <div className="frontier-detail-cluster">
          <span className="frontier-detail-dot" style={{
            background: `rgb(${node.color.map((c) => Math.round(c * 255)).join(',')})`,
          }} />
          {node.cluster?.replace(/_/g, ' ')}
        </div>
        <button className="frontier-detail-close" onClick={onClose} aria-label="Close">
          &#x2715;
        </button>
      </div>

      <h2 className="frontier-detail-title">{node.label}</h2>

      {meta && (
        <div className="frontier-detail-meta">
          {meta.venue && <span className="frontier-detail-tag">{String(meta.venue)}</span>}
          {meta.year && <span className="frontier-detail-tag">{String(meta.year)}</span>}
          {meta.citations != null && <span className="frontier-detail-tag">{String(meta.citations)} citations</span>}
        </div>
      )}

      {connected.length > 0 && (
        <div className="frontier-detail-connections">
          <h3 className="frontier-detail-section-title">Connections ({connected.length})</h3>
          <div className="frontier-detail-conn-list">
            {connected.slice(0, 8).map((edge) => {
              const otherId = edge.source === node.id ? edge.target : edge.source
              const other = nodeMap.get(otherId)
              if (!other) return null
              return (
                <div key={edge.id} className="frontier-detail-conn-item">
                  <span className="frontier-detail-conn-type">{EDGE_TYPE_LABELS[edge.type] || edge.type}</span>
                  <span className="frontier-detail-conn-label">{other.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
