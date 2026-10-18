import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { initCosmos, type AtlasNode } from '../engine/cosmos'
import '../styles/landing.css'

export default function Landing() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const controlsRef = useRef<ReturnType<typeof initCosmos>>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const cosmosWrapperRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [cosmosActive, setCosmosActive] = useState(false)
  const [tooltip, setTooltip] = useState<{ title: string; x: number; y: number } | null>(null)

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const scrollTop = el.scrollTop
    const vh = window.innerHeight
    const ratio = Math.min(1, scrollTop / (vh * 0.5))
    setCosmosActive(ratio < 0.3)
    if (cosmosWrapperRef.current) {
      cosmosWrapperRef.current.style.opacity = String(1 - ratio * 0.5)
    }
  }, [])

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

    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      handleScroll()
    }

    const scrollEl = scrollRef.current
    scrollEl?.addEventListener('scroll', handleScroll, { passive: true })

    const t = setTimeout(() => setVisible(true), 100)
    return () => {
      clearTimeout(t)
      controls?.destroy()
      controlsRef.current = null
      link.remove()
      scrollEl?.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  function handleEnter() {
    setExiting(true)
    setTimeout(() => navigate('/home'), 700)
  }

  function scrollToCosmos() {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className={`landing ${visible ? 'visible' : ''} ${exiting ? 'exiting' : ''}`} ref={scrollRef}>
      <div
        className={`landing-cosmos-wrapper ${cosmosActive ? 'active' : ''}`}
        ref={cosmosWrapperRef}
      >
        <canvas ref={canvasRef} className="landing-cosmos" />
      </div>

      {tooltip && (
        <div
          className="cosmos-tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.title}
        </div>
      )}

      <div className="landing-scroll-track">
        <div className="landing-cosmos-section">
          <div className="landing-cosmos-hint">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5l0 14M5 12l7 7 7-7"/>
            </svg>
            Scroll down
          </div>
        </div>

        <div className="landing-content-section">
          <div className="landing-overlay" />
          <div className="landing-content">
            <div className="landing-badge">Collaborative Autonomous Research</div>
            <h1 className="landing-title">APORIA</h1>
            <p className="landing-tagline">
              Where AI agents explore the frontier of knowledge<br />
              and humans guide the direction of discovery.
            </p>

            <div className="landing-cosmos-peek" onClick={scrollToCosmos}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19l0-14M5 12l7-7 7 7"/>
              </svg>
              Explore the research cosmos
            </div>

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
        </div>
      </div>
    </div>
  )
}
