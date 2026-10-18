import { useEffect, useState, useRef, useCallback } from 'react'
import { TOPICS, initCosmos } from '../engine/cosmos'
import type { CosmosControls, AtlasNode, AtlasLink, ExternalData } from '../engine/cosmos'
import { useProjectStore } from '../stores/projects'
import '../styles/frontier.css'

const BASE = import.meta.env.VITE_API_BASE_URL || ''

const _3DGS_PAPERS: { id: string; title: string; topic: number; cluster: number }[] = [
  { id: 'gs-001', title: '3D Gaussian Splatting for Real-Time Radiance Field Rendering', topic: 0, cluster: 0 },
  { id: 'gs-002', title: 'Dynamic 3D Gaussians: Tracking by Persistent Dynamic View Synthesis', topic: 0, cluster: 0 },
  { id: 'gs-003', title: 'SuGaR: Surface-Aligned Gaussian Splatting', topic: 0, cluster: 1 },
  { id: 'gs-004', title: 'GaussianEditor: Swift and Controllable 3D Editing with Gaussian Splatting', topic: 0, cluster: 1 },
  { id: 'gs-005', title: 'Deformable 3D Gaussians for High-Fidelity Monocular Dynamic Scene Reconstruction', topic: 0, cluster: 0 },
  { id: 'gs-006', title: 'PhysGaussian: Physics-Integrated 3D Gaussians for Generative Dynamics', topic: 1, cluster: 2 },
  { id: 'gs-007', title: 'DreamGaussian: Generative Gaussian Splatting for Efficient 3D Content Creation', topic: 1, cluster: 2 },
  { id: 'gs-008', title: 'GaussianDreamer: Fast Generation from Text to 3D with Point Cloud Priors', topic: 1, cluster: 2 },
  { id: 'gs-009', title: 'Compact 3D Gaussian Representation for Radiance Field', topic: 2, cluster: 3 },
  { id: 'gs-010', title: 'Mip-Splatting: Alias-free 3D Gaussian Splatting', topic: 2, cluster: 3 },
  { id: 'gs-011', title: 'GaussianAvatar: Towards Realistic Human Avatar Modeling from a Single Video', topic: 3, cluster: 4 },
  { id: 'gs-012', title: 'Animatable Gaussians: Learning Pose-Dependent Gaussian Maps', topic: 3, cluster: 4 },
  { id: 'gs-013', title: 'Gaussian Head Avatar: Ultra High-Fidelity Head Avatar via Dynamic Gaussians', topic: 3, cluster: 4 },
  { id: 'gs-014', title: 'GPS-Gaussian: Generalizable Pixel-wise 3D Gaussian Splatting for Real-time Human Novel View Synthesis', topic: 3, cluster: 5 },
  { id: 'gs-015', title: 'SC-GS: Sparse-Controlled Gaussian Splatting for Editable Dynamic Scenes', topic: 0, cluster: 0 },
  { id: 'gs-016', title: 'Gaussian Splatting SLAM', topic: 4, cluster: 6 },
  { id: 'gs-017', title: 'SplaTAM: Splat Track & Map 3D Gaussians for Dense RGB-D SLAM', topic: 4, cluster: 6 },
  { id: 'gs-018', title: 'Photo-SLAM: Real-time Simultaneous Localization and Photorealistic Mapping', topic: 4, cluster: 6 },
  { id: 'gs-019', title: 'LangSplat: 3D Language Gaussian Splatting', topic: 5, cluster: 7 },
  { id: 'gs-020', title: 'Gaussian Grouping: Segment and Edit Anything in 3D Scenes', topic: 5, cluster: 7 },
  { id: 'gs-021', title: 'COLMAP-Free 3D Gaussian Splatting', topic: 2, cluster: 3 },
  { id: 'gs-022', title: 'GS-IR: 3D Gaussian Splatting for Inverse Rendering', topic: 1, cluster: 2 },
  { id: 'gs-023', title: 'Scaffold-GS: Structured 3D Gaussians for View-Adaptive Rendering', topic: 2, cluster: 3 },
  { id: 'gs-024', title: 'NeRF: Representing Scenes as Neural Radiance Fields for View Synthesis', topic: 6, cluster: 8 },
  { id: 'gs-025', title: 'Instant Neural Graphics Primitives with a Multiresolution Hash Encoding', topic: 6, cluster: 8 },
  { id: 'gs-026', title: 'Point-NeRF: Point-based Neural Radiance Fields', topic: 6, cluster: 8 },
  { id: 'gs-027', title: 'Plenoxels: Radiance Fields without Neural Networks', topic: 6, cluster: 9 },
  { id: 'gs-028', title: 'Multi-View Stereo Revisited', topic: 7, cluster: 10 },
  { id: 'gs-029', title: 'PixelSplat: 3D Gaussian Splats from Image Pairs for Scalable Generalizable 3D Reconstruction', topic: 0, cluster: 1 },
  { id: 'gs-030', title: 'GauHuman: Articulated Gaussian Splatting for Real-Time 3D Human Rendering', topic: 3, cluster: 5 },
]

const _3DGS_EDGES: [string, string][] = [
  ['gs-001', 'gs-002'], ['gs-001', 'gs-003'], ['gs-001', 'gs-005'], ['gs-001', 'gs-009'],
  ['gs-001', 'gs-010'], ['gs-001', 'gs-015'], ['gs-001', 'gs-023'], ['gs-001', 'gs-029'],
  ['gs-024', 'gs-001'], ['gs-024', 'gs-025'], ['gs-024', 'gs-026'], ['gs-024', 'gs-027'],
  ['gs-002', 'gs-005'], ['gs-002', 'gs-015'], ['gs-003', 'gs-004'],
  ['gs-006', 'gs-005'], ['gs-007', 'gs-008'], ['gs-007', 'gs-001'],
  ['gs-011', 'gs-012'], ['gs-011', 'gs-013'], ['gs-011', 'gs-014'], ['gs-011', 'gs-030'],
  ['gs-016', 'gs-017'], ['gs-016', 'gs-018'], ['gs-019', 'gs-020'],
  ['gs-021', 'gs-001'], ['gs-022', 'gs-001'], ['gs-025', 'gs-026'],
  ['gs-001', 'gs-016'], ['gs-001', 'gs-019'], ['gs-001', 'gs-011'],
  ['gs-028', 'gs-024'], ['gs-026', 'gs-001'],
]

function make3DGSFallback(): ExternalData {
  const R = 40
  const nodeMap = new Map<string, number>()
  const nodes: AtlasNode[] = _3DGS_PAPERS.map((p, i) => {
    nodeMap.set(p.id, i)
    const angle = (i / _3DGS_PAPERS.length) * Math.PI * 2 + p.cluster * 0.5
    const r = R * (0.5 + p.cluster * 0.12) + (i % 3) * 6
    return {
      id: p.id,
      x: Math.cos(angle) * r + (Math.random() - 0.5) * 8,
      y: Math.sin(angle) * r + (Math.random() - 0.5) * 8,
      z: (p.topic - 3) * 10 + (Math.random() - 0.5) * 5,
      topic: p.topic,
      cluster: p.cluster,
      size: p.id === 'gs-001' ? 3 : p.id === 'gs-024' ? 2.5 : 1 + Math.random() * 0.5,
      kind: 'paper',
      title: p.title,
    }
  })
  const links: AtlasLink[] = _3DGS_EDGES
    .map(([s, t]) => {
      const src = nodeMap.get(s)
      const dst = nodeMap.get(t)
      if (src === undefined || dst === undefined) return null
      return { source: s, target: t, src, dst }
    })
    .filter((e): e is AtlasLink => e !== null)
  return { nodes, links }
}

async function fetchFrontierData(projectId: string): Promise<ExternalData | null> {
  try {
    const [nodesRes, edgesRes] = await Promise.all([
      fetch(`${BASE}/api/v1/projects/${projectId}/frontier/nodes`),
      fetch(`${BASE}/api/v1/projects/${projectId}/frontier/edges`),
    ])
    if (!nodesRes.ok || !edgesRes.ok) return null
    const rawNodes: any[] = await nodesRes.json()
    const rawEdges: any[] = await edgesRes.json()
    if (!rawNodes.length) return null
    const nodeMap = new Map<string, number>()
    const nodes: AtlasNode[] = rawNodes.map((n: any, i: number) => {
      nodeMap.set(n.id, i)
      let extra: any = {}
      try { if (n.detail) extra = JSON.parse(n.detail) } catch {}
      return {
        id: n.id,
        x: extra.x ?? n.x ?? (Math.cos(i * 0.7) * (3 + i % 5)),
        y: extra.y ?? n.y ?? (Math.sin(i * 0.7) * (3 + i % 5)),
        z: extra.z ?? n.z ?? ((i % 7 - 3) * 0.8),
        topic: extra.topic_index ?? n.topic_index ?? (i % 8),
        cluster: extra.cluster_index ?? n.cluster_index ?? (i % 10),
        size: extra.size ?? n.size ?? 1,
        kind: n.node_type ?? n.kind ?? 'paper',
        title: n.label ?? n.title ?? n.id,
      }
    })
    const links: AtlasLink[] = rawEdges
      .map((e) => {
        const srcId = e.source_node_id ?? e.source_id ?? e.source ?? ''
        const dstId = e.target_node_id ?? e.target_id ?? e.target ?? ''
        const src = nodeMap.get(srcId)
        const dst = nodeMap.get(dstId)
        if (src === undefined || dst === undefined) return null
        return { source: srcId, target: dstId, src, dst }
      })
      .filter((e): e is AtlasLink => e !== null)
    return { nodes, links }
  } catch {
    return null
  }
}

export default function Frontier() {
  const currentId = useProjectStore((s) => s.currentId)

  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const controlsRef = useRef<CosmosControls | null>(null)

  const [ready, setReady] = useState(false)
  const [filter, setFilter] = useState(-1)
  const [paused, setPaused] = useState(false)
  const [linksVisible, setLinksVisible] = useState(true)
  const [curvesOn, setCurvesOn] = useState(true)
  const [tooltip, setTooltip] = useState<{ node: AtlasNode; x: number; y: number } | null>(null)

  useEffect(() => {
    if (!currentId) {
      if (controlsRef.current) {
        controlsRef.current.destroy()
        controlsRef.current = null
      }
      setReady(false)
      return
    }
    const canvas = canvasRef.current
    if (!canvas) return

    let cancelled = false

    async function init() {
      const data = await fetchFrontierData(currentId!)
      if (cancelled) return
      const fallback = (!data || data.nodes.length === 0) ? make3DGSFallback() : null
      const controls = initCosmos(canvas!, {
        onPick: (node, x, y) => { setTooltip(node ? { node, x, y } : null) },
        dark: false,
        externalData: data ?? fallback ?? undefined,
      })
      if (!controls || cancelled) { controls?.destroy(); return }
      controlsRef.current = controls
      setReady(true)
    }
    init()

    return () => {
      cancelled = true
      controlsRef.current?.destroy()
      controlsRef.current = null
    }
  }, [currentId])

  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = Number(e.target.value)
    setFilter(val)
    controlsRef.current?.setFilter(val)
    setTooltip(null)
  }, [])

  const handleTogglePause = useCallback(() => {
    const p = controlsRef.current?.togglePause()
    if (p !== undefined) setPaused(p)
  }, [])

  const handleToggleLinks = useCallback(() => {
    const v = controlsRef.current?.toggleLinks()
    if (v !== undefined) setLinksVisible(v)
  }, [])

  const handleToggleCurves = useCallback(() => {
    const c = controlsRef.current?.toggleCurves()
    if (c !== undefined) setCurvesOn(c)
  }, [])

  const handleReset = useCallback(() => {
    controlsRef.current?.resetView()
    setTooltip(null)
  }, [])

  if (!currentId) {
    return (
      <div className="cosmos-root">
        <div className="cosmos-top">
          <div className="cosmos-brand">APORIA / COSMOS</div>
          <div className="cosmos-sub">Experimental research atlas &middot; interactive 3D</div>
        </div>
        <div className="cosmos-empty">
          <div className="cosmos-empty-title">Select a research project to explore the paper universe</div>
          <div className="cosmos-empty-hint">Papers will appear here based on your research scope</div>
        </div>
      </div>
    )
  }

  return (
    <div className="cosmos-root">
      <div className="cosmos-stage" ref={stageRef}>
        <canvas ref={canvasRef} id="cosmos-canvas" />
      </div>

      <div className="cosmos-top">
        <div className="cosmos-brand">APORIA / COSMOS</div>
        <div className="cosmos-sub">Experimental research atlas &middot; interactive 3D</div>
      </div>

      <div className="cosmos-tools">
        <select value={filter} onChange={handleFilterChange}>
          <option value={-1}>All research</option>
          {TOPICS.map((t, i) => (
            <option key={i} value={i}>{t.name}</option>
          ))}
        </select>
        <button onClick={handleTogglePause}>{paused ? 'Resume rotation' : 'Pause rotation'}</button>
        <button onClick={handleToggleLinks}>{linksVisible ? 'Hide links' : 'Show links'}</button>
        <button onClick={handleToggleCurves}>Curves: {curvesOn ? 'On' : 'Off'}</button>
        <button onClick={handleReset}>Reset view</button>
      </div>

      <div className="cosmos-instructions">Drag to orbit &middot; Scroll to zoom &middot; Click a paper</div>

      {tooltip && (
        <div
          className="cosmos-tooltip"
          style={{
            left: Math.min(tooltip.x + 16, window.innerWidth - 300),
            top: Math.min(tooltip.y + 18, window.innerHeight - 114),
          }}
        >
          <div className="cosmos-tooltip-tag" style={{ color: TOPICS[tooltip.node.topic]?.color }}>
            {TOPICS[tooltip.node.topic]?.name.toUpperCase()}
          </div>
          <div className="cosmos-tooltip-paper">{tooltip.node.title}</div>
          <div className="cosmos-tooltip-info">
            ID {tooltip.node.id} &middot; Cluster {tooltip.node.cluster}
          </div>
        </div>
      )}
    </div>
  )
}
