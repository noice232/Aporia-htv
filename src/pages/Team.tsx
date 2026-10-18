export default function Team() {
  return (
    <div className="page-content">
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--accent-amber)', textTransform: 'uppercase', marginBottom: 8 }}>
        River Collaboration
      </div>
      <h1 style={{ marginBottom: 8 }}>Team Sessions</h1>
      <p style={{ color: 'var(--fg-muted)', fontSize: 13, marginBottom: 24 }}>
        Shared research sessions with live event streams, annotations, and skill library.
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
        Session list, chat, and collaboration tools. Phase 4.
      </div>
    </div>
  )
}
