export default function Meta() {
  return (
    <div className="page-content">
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--accent-amber)', textTransform: 'uppercase', marginBottom: 8 }}>
        Meta Experiments
      </div>
      <h1 style={{ marginBottom: 8 }}>Strategy Comparison</h1>
      <p style={{ color: 'var(--fg-muted)', fontSize: 13, marginBottom: 24 }}>
        A/B strategy trials, matched evaluator hashes, version history.
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
        Meta experiment dashboard. Phase 4.
      </div>
    </div>
  )
}
