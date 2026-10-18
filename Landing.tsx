import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { initCosmos, type AtlasNode } from '../engine/cosmos'
import '../styles/landing.css'

export default function Landing() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const controlsRef = useRef<ReturnType<typeof initCosmos>>(null)
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [tooltip, setTooltip] = useState<{ title: string; x: number; y: number } | null>(null)

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
      {tooltip && (
        <div
          className="cosmos-tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.title}
        </div>
      )}

      {/* Content overlaid on top — pointer-events pass through to cosmos */}
      <div className="landing-overlay-content">
        <div className="landing-badge">Collaborative Autonomous Research</div>
        <h1 className="landing-title">APORIA</h1>
        <p className="landing-tagline">
          Where AI agents explore the frontier of knowledge<br />
          and humans guide the direction of discovery.
        </p>

        <button className="landing-enter" onClick={handleEnter}>
          Enter Research Environment
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>

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

      <div className="landing-hint">Drag to orbit &middot; Scroll to zoom &middot; Hover for paper titles</div>
    </div>
  )
}
