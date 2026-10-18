import { useEffect, useState, useRef, useCallback } from 'react'
import { TOPICS, initCosmos } from '../engine/cosmos'
import type { CosmosControls, AtlasNode, AtlasLink, ExternalData } from '../engine/cosmos'
import { useProjectStore } from '../stores/projects'
import '../styles/frontier.css'

const BASE = import.meta.env.VITE_API_BASE_URL || ''

async function fetchFrontierData(projectId: string): Promise<ExternalData | null> {
  try {
    const [nodesRes, edgesRes] = await Promise.all([
      fetch(`${BASE}/api/v1/projects/${projectId}/frontier/nodes`),
      fetch(`${BASE}/api/v1/projects/${projectId}/frontier/edges`),
    ])
    if (!nodesRes.ok || !edgesRes.ok) return null
    const rawNodes: Array<{
      id: string
      title?: string
      topic_index?: number
      cluster_index?: number
      x?: number
      y?: number
      z?: number
      size?: number
      kind?: string
    }> = await nodesRes.json()
    const rawEdges: Array<{
      source_id?: string
      target_id?: string
      source?: string
      target?: string
    }> = await edgesRes.json()
    if (!rawNodes.length) return null
    const nodeMap = new Map<string, number>()
    const nodes: AtlasNode[] = rawNodes.map((n, i) => {
      nodeMap.set(n.id, i)
      return {
        id: n.id,
        x: n.x ?? 0,
        y: n.y ?? 0,
        z: n.z ?? 0,
        topic: n.topic_index ?? 0,
        cluster: n.cluster_index ?? 0,
        size: n.size ?? 1,
        kind: n.kind ?? 'paper',
        title: n.title ?? n.id,
      }
    })
    const links: AtlasLink[] = rawEdges
      .map((e) => {
        const srcId = e.source_id ?? e.source ?? ''
        const dstId = e.target_id ?? e.target ?? ''
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
      const controls = initCosmos(
        canvas!,
        (node, x, y) => { setTooltip(node ? { node, x, y } : null) },
        data ?? undefined,
      )
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
