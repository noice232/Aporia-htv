import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { Cosmograph } from '@cosmograph/react'
import type { CosmographRef, CosmographInputData } from '@cosmograph/react'
import { Search } from 'lucide-react'
import { useGraphStore } from '../stores/graph'
import {
  generateCosmographData,
  generateMockGraph,
  CLUSTER_LABELS,
  CLUSTER_COLORS,
  CLUSTER_PAPER_COUNTS,
} from '../data/mockGraph'
import type { CosmographPoint, CosmographLink } from '../data/mockGraph'
import '../styles/frontier.css'

export default function Frontier() {
  const setNodes = useGraphStore((s) => s.setNodes)
  const setEdges = useGraphStore((s) => s.setEdges)
  const clusters = useGraphStore((s) => s.clusters)
  const visibleClusters = useGraphStore((s) => s.visibleClusters)
  const toggleCluster = useGraphStore((s) => s.toggleCluster)
  const searchQuery = useGraphStore((s) => s.searchQuery)
  const setSearch = useGraphStore((s) => s.setSearch)

  const cosmographRef = useRef<CosmographRef>(null)

  const [loading, setLoading] = useState(true)
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null)
  const [points, setPoints] = useState<CosmographPoint[]>([])
  const [links, setLinks] = useState<CosmographLink[]>([])

  useEffect(() => {
    const { points: p, links: l } = generateCosmographData()
    setPoints(p)
    setLinks(l)
    const mock = generateMockGraph()
    setNodes(mock.nodes)
    setEdges(mock.edges)
    setLoading(false)
  }, [setNodes, setEdges])

  const filteredPoints = useMemo(() => {
    let filtered = points
    if (visibleClusters.size > 0 && visibleClusters.size < Object.keys(CLUSTER_LABELS).length) {
      filtered = filtered.filter((p) => visibleClusters.has(p.cluster))
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter((p) => p.label.toLowerCase().includes(q) || p.cluster.includes(q))
    }
    return filtered
  }, [points, visibleClusters, searchQuery])

  const filteredLinks = useMemo(() => {
    const pointIds = new Set(filteredPoints.map((p) => p.id))
    return links.filter((l) => pointIds.has(l.source) && pointIds.has(l.target))
  }, [links, filteredPoints])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }, [setSearch])

  const totalPapers = Object.values(CLUSTER_PAPER_COUNTS).reduce((s, n) => s + n, 0)

  const cosmographPointsData = useMemo(() => filteredPoints as unknown as CosmographInputData, [filteredPoints])
  const cosmographLinksData = useMemo(() => filteredLinks as unknown as CosmographInputData, [filteredLinks])

  if (loading) {
    return (
      <div className="frontier-container">
        <div className="frontier-loading">
          <div className="frontier-loading-inner">
            <div className="frontier-loading-ring" />
            <div className="frontier-loading-text">Mapping research universe...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="frontier-container">
      <div className="frontier-canvas">
        <Cosmograph
          ref={cosmographRef}
          points={cosmographPointsData}
          links={cosmographLinksData}
          pointIdBy="id"
          pointColorBy="color"
          pointSizeBy="size"
          pointSizeRange={[2, 12]}
          pointLabelBy="label"
          pointClusterBy="cluster"
          linkSourceBy="source"
          linkTargetBy="target"
          pointIncludeColumns={['venue', 'year', 'citations', 'cluster']}
          showLabels
          showDynamicLabels
          showDynamicLabelsLimit={20}
          showTopLabels
          showTopLabelsLimit={15}
          showClusterLabels
          showHoveredPointLabel
          pointLabelColor="rgba(229, 239, 250, 0.9)"
          pointLabelFontSize={11}
          clusterLabelFontSize={14}
          selectPointOnClick="single"
          focusPointOnClick
          enableSimulation
          disableLogging
          statusIndicatorMode={false}
          style={{ width: '100%', height: '100%', background: '#050710' }}
          className="cosmograph-instance"
        />
      </div>

      <div className="frontier-hud">
        <div className="frontier-top-bar">
          <div className="frontier-title-block">
            <h2 className="frontier-title">FRONTIER</h2>
            <span className="frontier-subtitle">
              {totalPapers.toLocaleString()} papers &middot; {clusters.length || Object.keys(CLUSTER_LABELS).length} research domains
            </span>
          </div>

          <div className="frontier-view-modes">
            <button className="frontier-view-btn active">Explore</button>
            <button className="frontier-view-btn">Fly</button>
            <button className="frontier-view-btn">Focus</button>
            <button className="frontier-view-btn">Filters</button>
          </div>
        </div>

        <div className="frontier-search-bar">
          <Search size={14} className="frontier-search-icon" />
          <input
            type="text"
            placeholder="Search arXiv, authors, ideas..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <kbd className="frontier-search-kbd">⌘K</kbd>
        </div>

        <div className="frontier-cluster-filter">
          {Object.entries(CLUSTER_LABELS).map(([id, label]) => {
            const active = visibleClusters.has(id)
            return (
              <button
                key={id}
                className={`frontier-cluster-chip ${active ? 'active' : ''}`}
                onClick={() => toggleCluster(id)}
                style={{ '--chip-color': CLUSTER_COLORS[id] } as React.CSSProperties}
              >
                <span className="frontier-cluster-chip-dot" />
                {label.length > 12 ? label.split(' ')[0] : label}
              </button>
            )
          })}
        </div>

        {selectedCluster && (
          <div className="frontier-tooltip">
            <div className="frontier-tooltip-header">
              <div className="frontier-tooltip-name">
                <span className="frontier-tooltip-dot" style={{ background: CLUSTER_COLORS[selectedCluster] }} />
                {CLUSTER_LABELS[selectedCluster]}
              </div>
              <button className="frontier-tooltip-close" onClick={() => setSelectedCluster(null)}>&#x2715;</button>
            </div>
            <div className="frontier-tooltip-stats">
              <div className="frontier-tooltip-stat">
                <span className="frontier-tooltip-stat-value">{CLUSTER_PAPER_COUNTS[selectedCluster]?.toLocaleString()}</span>
                <span className="frontier-tooltip-stat-label">papers</span>
              </div>
            </div>
          </div>
        )}

        <div className="frontier-hint">
          Drag to pan &middot; Scroll to zoom &middot; Click a node to explore
        </div>
      </div>
    </div>
  )
}
