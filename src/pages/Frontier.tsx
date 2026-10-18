import { useEffect, useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { Search } from 'lucide-react'
import { useGraphStore } from '../stores/graph'
import { FrontierScene } from '../components/frontier/FrontierScene'
import { ClusterFilter } from '../components/frontier/ClusterFilter'
import { NodeDetail } from '../components/frontier/NodeDetail'
import { generateMockGraph } from '../data/mockGraph'
import { fetchGraph } from '../api/graph'
import '../styles/frontier.css'

export default function Frontier() {
  const nodes = useGraphStore((s) => s.nodes)
  const edges = useGraphStore((s) => s.edges)
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId)
  const searchQuery = useGraphStore((s) => s.searchQuery)
  const setNodes = useGraphStore((s) => s.setNodes)
  const setEdges = useGraphStore((s) => s.setEdges)
  const selectNode = useGraphStore((s) => s.selectNode)
  const setSearch = useGraphStore((s) => s.setSearch)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await fetchGraph('default')
        if (!cancelled) {
          setNodes(data.nodes)
          setEdges(data.edges)
        }
      } catch {
        if (!cancelled) {
          const mock = generateMockGraph()
          setNodes(mock.nodes)
          setEdges(mock.edges)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [setNodes, setEdges])

  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }, [setSearch])

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
        <Canvas
          camera={{ position: [0, 0, 35], fov: 60, near: 0.1, far: 200 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: false }}
        >
          <FrontierScene />
        </Canvas>
      </div>

      <div className="frontier-hud">
        <div className="frontier-top-bar">
          <div className="frontier-search">
            <Search size={14} className="frontier-search-icon" />
            <input
              type="text"
              placeholder="Search papers..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          <div className="frontier-stats">
            <span><span className="stat-value">{nodes.length}</span> papers</span>
            <span><span className="stat-value">{edges.length}</span> connections</span>
            <span><span className="stat-value">{useGraphStore.getState().clusters.length}</span> clusters</span>
          </div>
        </div>

        <ClusterFilter />

        {selectedNode && (
          <NodeDetail
            node={selectedNode}
            edges={edges}
            nodes={nodes}
            onClose={() => selectNode(null)}
          />
        )}
      </div>
    </div>
  )
}
