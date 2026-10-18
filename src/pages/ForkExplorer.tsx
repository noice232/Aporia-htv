import { useParams } from 'react-router-dom'

export default function ForkExplorer() {
  const { projectId, forkId } = useParams()
  return (
    <div className="page-content">
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--accent-lavender)', textTransform: 'uppercase', marginBottom: 8 }}>
        Fork Explorer
      </div>
      <h1 style={{ marginBottom: 8 }}>Scientific Fork Comparison</h1>
      <p style={{ color: 'var(--fg-muted)', fontSize: 13, marginBottom: 24 }}>
        Project: <code style={{ color: 'var(--accent-icy)' }}>{projectId}</code>
        {forkId && <> · Fork: <code style={{ color: 'var(--accent-icy)' }}>{forkId}</code></>}
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
        Side-by-side branch comparison: w=0 vs w=guided. Phase 3.
      </div>
    </div>
  )
}
