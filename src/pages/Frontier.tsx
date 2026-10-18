import { useEffect, useState, useRef, useCallback } from 'react'
import { TOPICS, initCosmos } from '../engine/cosmos'
import type { CosmosControls, AtlasNode } from '../engine/cosmos'
import '../styles/frontier.css'

export default function Frontier() {
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const controlsRef = useRef<CosmosControls | null>(null)

  const [ready, setReady] = useState(false)
  const [filter, setFilter] = useState(-1)
  const [paused, setPaused] = useState(false)
  const [linksVisible, setLinksVisible] = useState(true)
  const [curvesOn, setCurvesOn] = useState(true)
  const [tooltip, setTooltip] = useState<{ node: AtlasNode; x: number; y: number } | null>(null)
  const [stats, setStats] = useState({ points: 0, links: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const controls = initCosmos(canvas, (node, x, y) => {
      setTooltip(node ? { node, x, y } : null)
    })
    if (!controls) return
    controlsRef.current = controls
    setStats(controls.getStats())
    setReady(true)
    return () => { controls.destroy(); controlsRef.current = null }
  }, [])

  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = Number(e.target.value)
    setFilter(val)
    controlsRef.current?.setFilter(val)
    setStats(controlsRef.current?.getStats() ?? { points: 0, links: 0 })
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

      <div className="cosmos-side">
        <div className="cosmos-legend-label">RESEARCH DOMAINS</div>
        <div className="cosmos-legend">
          {TOPICS.map((t, i) => (
            <div key={i} className="cosmos-legend-item">
              <span className="cosmos-dot" style={{ '--glow': t.color } as React.CSSProperties} />
              <span>{t.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="cosmos-instructions">Drag to orbit &middot; Scroll to zoom &middot; Click a paper</div>

      <div className="cosmos-stats">
        {ready && `${stats.points.toLocaleString()} synthetic papers · ${stats.links.toLocaleString()} simulated links · 3D curved bundles`}
      </div>

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
            Synthetic paper &middot; ID {tooltip.node.id} &middot; Cluster {tooltip.node.cluster}
          </div>
        </div>
      )}
    </div>
  )
}
