import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { Cosmograph } from '@cosmograph/react'
import type { CosmographRef, CosmographInputData } from '@cosmograph/react'
import { Search, Rocket } from 'lucide-react'
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

type ViewMode = 'explore' | 'fly' | 'focus' | 'filters'

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
  const [viewMode, setViewMode] = useState<ViewMode>('explore')
  const [showFilters, setShowFilters] = useState(false)

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
      filtered = filtered.filter((p) => p.label.toLowerCase().includes(q) || p.cluster.toLowerCase().includes(q))
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

  const handleViewMode = useCallback((mode: ViewMode) => {
    setViewMode(mode)
    const ref = cosmographRef.current
    if (!ref) return

    switch (mode) {
      case 'explore':
        setShowFilters(false)
        ref.start(0.3)
        ref.fitView(1000, 0.1)
        break
      case 'fly':
        setShowFilters(false)
        ref.fitView(2000, 0.05)
        ref.start(1)
        break
      case 'focus': {
        setShowFilters(false)
        const labeledIndices: number[] = []
        filteredPoints.forEach((p, i) => {
          if (p.label) labeledIndices.push(i)
        })
        if (labeledIndices.length > 0) {
          ref.fitViewByIndices(labeledIndices, 1500, 0.15)
        }
        break
      }
      case 'filters':
        setShowFilters((prev) => !prev)
        break
    }
  }, [filteredPoints])

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
          pointLabelBy="label"
          pointClusterBy="cluster"
          linkSourceBy="source"
          linkTargetBy="target"
          pointIncludeColumns={['venue', 'year', 'citations', 'cluster']}
          /* 3D orbit camera like cosmograph.app demo */
          spaceDimensions={3}
          /* Curved gradient links */
          curvedLinks
          linkColorInterpolateFromEndpoints
          linkBlending
          linkOpacity={0.8}
          linkWidthScale={2.95}
          renderLinks
          /* Simulation params from demo */
          enableSimulation
          simulationGravity={0.21}
          simulationRepulsion={1.55}
          simulationLinkSpring={0.24}
          simulationLinkDistance={8}
          simulationFriction={0.96}
          simulationCluster={0.1}
          simulationCollision={0}
          /* Point sizing */
          pointSizeRange={[6, 10]}
          scalePointsOnZoom
          /* Labels: off by default, show on hover */
          showLabels={false}
          showHoveredPointLabel
          showClusterLabels
          clusterLabelFontSize={16}
          pointLabelColor="rgba(229, 239, 250, 0.95)"
          pointLabelFontSize={12}
          selectPointOnClick="single"
          focusPointOnClick
          spaceSize={8192}
          backgroundColor="#050710"
          fitViewOnInit
          fitViewDelay={600}
          fitViewPadding={0.1}
          disableLogging
          statusIndicatorMode={false}
          style={{ width: '100%', height: '100%' }}
          className="cosmograph-instance"
        />
      </div>

      <div className="frontier-hud">
        <div className="frontier-top-bar">
          <div className="frontier-title-block">
            <h2 className="frontier-title">
              <Rocket size={16} className="frontier-title-icon" />
              FRONTIER
            </h2>
            <span className="frontier-subtitle">
              {totalPapers.toLocaleString()} papers &middot; {clusters.length || Object.keys(CLUSTER_LABELS).length} research domains
            </span>
          </div>

          <div className="frontier-view-modes">
            {(['explore', 'fly', 'focus', 'filters'] as const).map((mode) => (
              <button
                key={mode}
                className={`frontier-view-btn ${viewMode === mode ? 'active' : ''}`}
                onClick={() => handleViewMode(mode)}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
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

        <div className={`frontier-cluster-filter ${showFilters ? 'expanded' : ''}`}>
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
                {label}
                <span className="frontier-cluster-chip-count">
                  {(CLUSTER_PAPER_COUNTS[id] ?? 0).toLocaleString()}
                </span>
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

        <div className="frontier-stats-bar">
          <span className="frontier-stat">
            <span className="frontier-stat-value">{filteredPoints.length.toLocaleString()}</span>
            <span className="frontier-stat-label">nodes</span>
          </span>
          <span className="frontier-stat">
            <span className="frontier-stat-value">{filteredLinks.length.toLocaleString()}</span>
            <span className="frontier-stat-label">edges</span>
          </span>
          <span className="frontier-stat">
            <span className="frontier-stat-value">{Object.keys(CLUSTER_LABELS).length}</span>
            <span className="frontier-stat-label">clusters</span>
          </span>
        </div>

        <div className="frontier-hint">
          Drag to orbit &middot; Scroll to zoom &middot; Shift+drag to pan &middot; Click a node to explore
        </div>
      </div>
    </div>
  )
}
