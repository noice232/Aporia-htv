import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { initCosmos, TOPICS, type AtlasNode } from '../engine/cosmos'
import '../styles/landing.css'

export default function Landing() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const controlsRef = useRef<ReturnType<typeof initCosmos>>(null)
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [cosmosMode, setCosmosMode] = useState(false)
  const [tooltip, setTooltip] = useState<{ title: string; x: number; y: number } | null>(null)
  const [selectedPaper, setSelectedPaper] = useState<AtlasNode | null>(null)

  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap'
    document.head.appendChild(link)

    const canvas = canvasRef.current
    if (!canvas) return
    const controls = initCosmos(canvas, {
      dark: false,
      onHover: (node: AtlasNode | null, x: number, y: number) => {
        if (node && !node.title.startsWith('Research paper')) {
          setTooltip({ title: node.title, x, y })
        } else {
          setTooltip(null)
        }
      },
      onPick: (node: AtlasNode | null) => {
        if (node && !node.title.startsWith('Research paper')) {
          setSelectedPaper(node)
        }
      },
    })
    if (controls) controlsRef.current = controls

    const t = setTimeout(() => setVisible(true), 100)
    return () => {
      clearTimeout(t)
      controls?.destroy()
      controlsRef.current = null
      link.remove()
    }
  }, [])

  function handleEnter() {
    setExiting(true)
    setTimeout(() => navigate('/home'), 700)
  }

  return (
    <div className={`landing ${visible ? 'visible' : ''} ${exiting ? 'exiting' : ''}`}>
      {/* Cosmos canvas — full screen, always interactive */}
      <canvas ref={canvasRef} className="landing-cosmos" />

      {/* Tooltip */}
      {tooltip && !selectedPaper && (
        <div
          className="cosmos-tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.title}
        </div>
      )}

      {/* Content overlaid on top — pointer-events pass through to cosmos */}
      <div className={`landing-overlay-content ${cosmosMode ? 'cosmos-mode-hidden' : ''}`}>
        <div className="landing-badge">Collaborative Autonomous Research</div>
        <h1 className="landing-title">APORIA</h1>
        <p className="landing-tagline">
          Where AI agents explore the frontier of knowledge<br />
          and humans guide the direction of discovery.
        </p>

        <div className="landing-buttons-row">
          <button className="landing-enter" onClick={handleEnter}>
            Enter Research Environment
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>

          <button className="landing-cosmos-toggle" onClick={() => setCosmosMode(true)}>
            Explore Cosmos
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </button>
        </div>

        <div className="landing-pillars">
          <div className="landing-pillar">
            <div className="landing-pillar-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>
            </div>
            <h3>Autonomous Agents</h3>
            <p>AI agents explore papers, run experiments, and form hypotheses independently</p>
          </div>
          <div className="landing-pillar">
            <div className="landing-pillar-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3v18M3 12h18M5.63 5.63l12.74 12.74M18.37 5.63 5.63 18.37"/></svg>
            </div>
            <h3>Human Guidance</h3>
            <p>Classifier-Free Guidance lets you steer research without micromanaging</p>
          </div>
          <div className="landing-pillar">
            <div className="landing-pillar-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <h3>Collaborative</h3>
            <p>Multiple researchers and agents collaborate on shared research projects</p>
          </div>
        </div>
      </div>

      {/* Cosmos mode — back button */}
      {cosmosMode && (
        <button className="landing-cosmos-back" onClick={() => { setCosmosMode(false); setSelectedPaper(null) }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
      )}

      {/* Paper popup */}
      {selectedPaper && (
        <div className="paper-popup-overlay" onClick={() => setSelectedPaper(null)}>
          <div className="paper-popup" onClick={(e) => e.stopPropagation()}>
            <button className="paper-popup-close" onClick={() => setSelectedPaper(null)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
            <div className="paper-popup-topic" style={{ color: TOPICS[selectedPaper.topic]?.color || '#6598ff' }}>
              {TOPICS[selectedPaper.topic]?.name || 'Research'}
            </div>
            <h2 className="paper-popup-title">{selectedPaper.title}</h2>
            <div className="paper-popup-meta">
              <span>Node #{selectedPaper.id}</span>
              <span>Cluster {selectedPaper.cluster}</span>
            </div>
          </div>
        </div>
      )}

      <div className={`landing-hint ${cosmosMode ? 'cosmos-mode-hint' : ''}`}>
        {cosmosMode
          ? 'Click on a node to view paper details'
          : 'Drag to orbit · Scroll to zoom · Hover for paper titles'}
      </div>
    </div>
  )
}
