import { useParams } from 'react-router-dom'

export default function ResearcherProfile() {
  const { researcherId } = useParams()
  return (
    <div className="page-content">
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--accent-amber)', textTransform: 'uppercase', marginBottom: 8 }}>
        Researcher Profile
      </div>
      <h1 style={{ marginBottom: 8 }}>Research Identity</h1>
      <p style={{ color: 'var(--fg-muted)', fontSize: 13, marginBottom: 24 }}>
        Researcher: <code style={{ color: 'var(--accent-icy)' }}>{researcherId}</code>
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
        Priorities, methodological rules, intervention history. Phase 4.
      </div>
    </div>
  )
}
