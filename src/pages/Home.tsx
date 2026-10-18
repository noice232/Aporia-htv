import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FlaskConical, Compass, Users } from 'lucide-react'
import { createProject } from '../api/client'
import { useProjectStore } from '../stores/projects'
import '../styles/home.css'

const BASE = import.meta.env.VITE_API_BASE_URL || ''

export default function Home() {
  const [title, setTitle] = useState('')
  const [objective, setObjective] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const projects = useProjectStore((s) => s.projects)
  const currentId = useProjectStore((s) => s.currentId)
  const addProject = useProjectStore((s) => s.addProject)
  const setProjects = useProjectStore((s) => s.setProjects)
  const setCurrent = useProjectStore((s) => s.setCurrent)
  const navigate = useNavigate()
  const seeded = useRef(false)

  useEffect(() => {
    if (seeded.current || projects.length > 0) return
    seeded.current = true
    ;(async () => {
      try {
        const res = await fetch(`${BASE}/api/v1/demo/seed`, { method: 'POST' })
        if (res.ok) {
          const data = await res.json()
          if (data.project) {
            addProject(data.project)
            setCurrent(data.project.id)
          } else if (data.projects) {
            setProjects(data.projects)
          } else if (data.project_id) {
            const proj = {
              id: data.project_id,
              title: data.title || '3D Reconstruction: NeRF to Gaussian Splatting',
              objective: 'Compare sparse-view 3D reconstruction methods with human guidance on rendering speed and visual quality.',
              status: 'completed',
              created_at: new Date().toISOString(),
            }
            addProject(proj as any)
            setCurrent(proj.id)
          }
        }
      } catch {
        // backend may not support demo seed yet
      }
    })()
  }, [projects.length, addProject, setProjects, setCurrent])

  async function handleLaunch(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    setError(null)
    try {
      const project = await createProject(title, objective)
      addProject(project)
      setCurrent(project.id)
      navigate(`/projects/${project.id}/lab`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  const shareUrl = currentId
    ? `${window.location.origin}/join/${currentId}`
    : ''

  function handleCopy() {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="home-page">
      {/* ── Hero ── */}
      <div className="hero">
        <div className="hero-eyebrow">Multiplayer Autonomous Research</div>
        <h1 className="hero-title">APORIA</h1>
        <p className="hero-subtitle">Where AI agents and human researchers explore together</p>
        <p className="hero-tagline">Define an objective. Agents explore. You guide.</p>

        <div className="hero-features">
          <div className="hero-feature feat-agents">
            <div className="hero-feature-icon">
              <FlaskConical size={16} />
            </div>
            <div className="hero-feature-title">Autonomous Agents</div>
            <div className="hero-feature-desc">
              AI agents explore papers, run experiments, and form hypotheses across the research frontier.
            </div>
          </div>

          <div className="hero-feature feat-cfg">
            <div className="hero-feature-icon">
              <Compass size={16} />
            </div>
            <div className="hero-feature-title">CFG Guidance</div>
            <div className="hero-feature-desc">
              Classifier-Free Guidance lets humans steer research direction without micromanaging every step.
            </div>
          </div>

          <div className="hero-feature feat-collab">
            <div className="hero-feature-icon">
              <Users size={16} />
            </div>
            <div className="hero-feature-title">Multiplayer</div>
            <div className="hero-feature-desc">
              Multiple researchers and agents collaborate in real-time on shared research projects.
            </div>
          </div>
        </div>
      </div>

      <div className="home-divider" />

      {/* ── Create Project ── */}
      <div className="home-section-label">Research Launch</div>
      <h1 className="home-section-title">Start a new research project</h1>
      <p className="home-section-desc">
        Define your research objective and APORIA will compile a plan, set up experiment infrastructure, and begin exploring the paper universe.
      </p>

      <form onSubmit={handleLaunch} className="home-form">
        <label>Project title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. 3D Reconstruction Coverage Analysis"
          className="home-input"
        />

        <label>
          Research objective <span className="optional">optional</span>
        </label>
        <textarea
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          placeholder="Describe what you want to investigate..."
          rows={4}
          className="home-textarea"
        />

        {error && <div className="home-error">{error}</div>}

        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="home-submit"
        >
          {loading ? 'Creating...' : 'Compile Research →'}
        </button>
      </form>

      {/* ── Recent Projects ── */}
      {projects.length > 0 && (
        <div className="home-projects">
          <h2 className="home-projects-title">Recent Projects</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {projects.map((p) => (
              <button
                key={p.id}
                className="home-project-card"
                onClick={() => { setCurrent(p.id); navigate(`/projects/${p.id}/lab`) }}
              >
                <div>
                  <div className="home-project-title">{p.title}</div>
                  {p.objective && (
                    <div className="home-project-obj">{p.objective}</div>
                  )}
                </div>
                <div className="home-project-right">
                  <span className={`home-project-badge ${p.status === 'active' ? 'active' : 'default'}`}>
                    {p.status}
                  </span>
                  <span className="home-project-resume">Resume →</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Invite Collaborators ── */}
      <div className="home-share">
        <div className="home-share-title">Invite Collaborators</div>
        <div className="home-share-desc">
          Share a link to add researchers to your project
        </div>
        <div className="home-share-row">
          <input
            readOnly
            value={shareUrl || 'Create a project first'}
            className="home-share-input"
            onClick={(e) => shareUrl && (e.target as HTMLInputElement).select()}
          />
          <button
            className={`home-share-copy ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
            disabled={!shareUrl}
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
        <div className="home-share-hint">
          Anyone with this link can join your research project
        </div>
      </div>
    </div>
  )
}
