import { useParams } from 'react-router-dom'

export default function Judgments() {
  const { projectId } = useParams()
  return (
    <div className="page-content">
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--accent-lavender)', textTransform: 'uppercase', marginBottom: 8 }}>
        Judgment Compiler
      </div>
      <h1 style={{ marginBottom: 8 }}>CFG Dual-Score Policy</h1>
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
        Guidance slider (w=0..2), dual-score table, and Papiers source search. Phase 3.
      </div>
    </div>
  )
}
