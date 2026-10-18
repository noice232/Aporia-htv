import { useCallback } from 'react'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { useGraphStore } from '../../stores/graph'
import { PaperNode } from './PaperNode'
import { GraphEdges } from './GraphEdges'
import { ClusterLabel } from './ClusterLabel'
import { NodeTooltip } from './NodeTooltip'
import { StarField } from './StarField'

export function FrontierScene() {
  const nodes = useGraphStore((s) => s.nodes)
  const edges = useGraphStore((s) => s.edges)
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId)
  const hoveredNodeId = useGraphStore((s) => s.hoveredNodeId)
  const visibleClusters = useGraphStore((s) => s.visibleClusters)
  const clusters = useGraphStore((s) => s.clusters)
  const selectNode = useGraphStore((s) => s.selectNode)
  const hoverNode = useGraphStore((s) => s.hoverNode)

  const visibleNodes = nodes.filter((n) => !n.cluster || visibleClusters.has(n.cluster))
  const visibleEdges = edges.filter((e) => {
    const sn = nodes.find((n) => n.id === e.source)
    const tn = nodes.find((n) => n.id === e.target)
    if (!sn || !tn) return false
    return (!sn.cluster || visibleClusters.has(sn.cluster)) && (!tn.cluster || visibleClusters.has(tn.cluster))
  })

  const hoveredNode = hoveredNodeId ? visibleNodes.find((n) => n.id === hoveredNodeId) : null

  const handleMissClick = useCallback(() => {
    selectNode(null)
  }, [selectNode])

  const clusterGroups = new Map<string, typeof visibleNodes>()
  for (const node of visibleNodes) {
    if (!node.cluster) continue
    const group = clusterGroups.get(node.cluster) || []
    group.push(node)
    clusterGroups.set(node.cluster, group)
  }

  return (
    <>
      <color attach="background" args={[0.02, 0.027, 0.047]} />
      <fog attach="fog" args={[0x05070C, 40, 120]} />

      <ambientLight intensity={0.15} />
      <pointLight position={[20, 20, 20]} intensity={0.4} color="#57DDF6" />
      <pointLight position={[-15, -10, -20]} intensity={0.2} color="#B99AFF" />

      <StarField />

      <group onClick={handleMissClick}>
        <mesh visible={false}>
          <sphereGeometry args={[100, 8, 8]} />
          <meshBasicMaterial />
        </mesh>
      </group>

      <GraphEdges nodes={visibleNodes} edges={visibleEdges} selectedNodeId={selectedNodeId} />

      {visibleNodes.map((node) => (
        <PaperNode
          key={node.id}
          node={node}
          isSelected={node.id === selectedNodeId}
          isHovered={node.id === hoveredNodeId}
          onSelect={selectNode}
          onHover={hoverNode}
        />
      ))}

      {clusters.filter((c) => visibleClusters.has(c)).map((cluster) => {
        const group = clusterGroups.get(cluster)
        if (!group || group.length === 0) return null
        return <ClusterLabel key={cluster} cluster={cluster} nodes={group} />
      })}

      {hoveredNode && <NodeTooltip node={hoveredNode} />}

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={80}
        enablePan
        panSpeed={0.5}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
      />

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          intensity={0.8}
          mipmapBlur
        />
      </EffectComposer>
    </>
  )
}
