export default function Library() {
  return (
    <div className="page-content">
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--accent-mint)', textTransform: 'uppercase', marginBottom: 8 }}>
        Paper Library
      </div>
      <h1 style={{ marginBottom: 8 }}>Source Library</h1>
      <p style={{ color: 'var(--fg-muted)', fontSize: 13, marginBottom: 24 }}>
        Search papers, manage Papiers notes, corpus sync, provenance tracking.
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
        Paper search, citation browser, and sync status. Phase 2.
      </div>
    </div>
  )
}
