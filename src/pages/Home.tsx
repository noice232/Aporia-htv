import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createProject } from '../api/client'
import { useProjectStore } from '../stores/projects'

export default function Home() {
  const [title, setTitle] = useState('')
  const [objective, setObjective] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const addProject = useProjectStore((s) => s.addProject)
  const setCurrent = useProjectStore((s) => s.setCurrent)
  const navigate = useNavigate()

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

  return (
    <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 560, width: '100%' }}>
        <div style={{ marginBottom: 8, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
          Research Launch
        </div>
        <h1 style={{ marginBottom: 8 }}>Start a new research project</h1>
        <p style={{ color: 'var(--fg-muted)', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
          Define your research objective and APORIA will compile a plan, set up experiment infrastructure, and begin exploring the paper universe.
        </p>

        <form onSubmit={handleLaunch} style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
        }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--fg-muted)', marginBottom: 6 }}>
            Project title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 3D Reconstruction Coverage Analysis"
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.04)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
              fontSize: 14,
              marginBottom: 16,
            }}
          />

          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--fg-muted)', marginBottom: 6 }}>
            Research objective <span style={{ fontWeight: 400, color: 'var(--fg-dim)' }}>optional</span>
          </label>
          <textarea
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            placeholder="Describe what you want to investigate..."
            rows={4}
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.04)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
              fontSize: 14,
              resize: 'vertical',
              marginBottom: 20,
            }}
          />

          {error && (
            <div style={{
              background: 'rgba(239,83,80,0.1)',
              border: '1px solid rgba(239,83,80,0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 12px',
              fontSize: 12,
              color: 'var(--accent-red)',
              marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !title.trim()}
            style={{
              width: '100%',
              background: 'var(--accent-cyan)',
              color: 'var(--bg)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 16px',
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {loading ? 'Creating...' : 'Compile Research →'}
          </button>
        </form>
      </div>
    </div>
  )
}
