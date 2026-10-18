export default function Portfolio() {
  return (
    <div className="page-content">
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--accent-amber)', textTransform: 'uppercase', marginBottom: 8 }}>
        Portfolio
      </div>
      <h1 style={{ marginBottom: 8 }}>Research Portfolio</h1>
      <p style={{ color: 'var(--fg-muted)', fontSize: 13, marginBottom: 24 }}>
        Ranked agenda, downstream unlock graph, budget allocation.
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
        Portfolio prioritization and scheduling. Phase 4.
      </div>
    </div>
  )
}
