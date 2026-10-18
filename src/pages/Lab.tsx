import { useParams } from 'react-router-dom'

export default function Lab() {
  const { projectId } = useParams()
  return (
    <div className="page-content">
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--accent-mint)', textTransform: 'uppercase', marginBottom: 8 }}>
        Research Lab
      </div>
      <h1 style={{ marginBottom: 8 }}>Experiment Control Room</h1>
      <p style={{ color: 'var(--fg-muted)', fontSize: 13, marginBottom: 24 }}>
        Project: <code style={{ color: 'var(--accent-icy)' }}>{projectId}</code>
      </p>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 40,
        textAlign: 'center',
        color: 'var(--fg-dim)',
        fontSize: 13,
      }}>
        Metric plots, run controls, and artifact viewer will render here. Phase 2.
      </div>
    </div>
  )
}
