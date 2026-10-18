export default function SettingsPage() {
  return (
    <div className="page-content">
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--accent-mint)', textTransform: 'uppercase', marginBottom: 8 }}>
        Settings
      </div>
      <h1 style={{ marginBottom: 8 }}>Workspace Settings</h1>
      <p style={{ color: 'var(--fg-muted)', fontSize: 13, marginBottom: 24 }}>
        Provider health, workspace members, budgets, data mode, accessibility.
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
        Integration status and workspace configuration. Phase 2.
      </div>
    </div>
  )
}
