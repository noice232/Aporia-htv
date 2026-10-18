import { useGraphStore } from '../../stores/graph'

const CLUSTER_LABELS: Record<string, string> = {
  computer_vision: 'Vision',
  generative_models: 'Generative',
  nlp: 'NLP',
  reinforcement_learning: 'RL',
  multimodal: 'Multimodal',
}

const CLUSTER_COLORS: Record<string, string> = {
  computer_vision: 'rgb(87, 221, 246)',
  generative_models: 'rgb(233, 144, 238)',
  nlp: 'rgb(78, 232, 186)',
  reinforcement_learning: 'rgb(185, 154, 255)',
  multimodal: 'rgb(245, 166, 35)',
}

export function ClusterFilter() {
  const clusters = useGraphStore((s) => s.clusters)
  const visibleClusters = useGraphStore((s) => s.visibleClusters)
  const toggleCluster = useGraphStore((s) => s.toggleCluster)

  if (clusters.length === 0) return null

  return (
    <div className="frontier-cluster-filter">
      {clusters.map((cluster) => {
        const active = visibleClusters.has(cluster)
        return (
          <button
            key={cluster}
            className={`frontier-cluster-chip ${active ? 'active' : ''}`}
            onClick={() => toggleCluster(cluster)}
            style={{
              '--chip-color': CLUSTER_COLORS[cluster] || 'rgb(136, 152, 175)',
            } as React.CSSProperties}
          >
            <span className="frontier-cluster-chip-dot" />
            {CLUSTER_LABELS[cluster] || cluster}
          </button>
        )
      })}
    </div>
  )
}
