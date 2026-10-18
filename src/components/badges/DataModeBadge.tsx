const MODE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  measured: { bg: 'rgba(78,232,186,0.15)', color: 'var(--accent-mint)', label: 'Measured' },
  ai_generated: { bg: 'rgba(185,154,255,0.15)', color: 'var(--accent-lavender)', label: 'AI Generated' },
  verified: { bg: 'rgba(87,221,246,0.15)', color: 'var(--accent-cyan)', label: 'Verified' },
  unverified: { bg: 'rgba(245,166,35,0.15)', color: 'var(--accent-amber)', label: 'Unverified' },
  manual: { bg: 'rgba(136,152,175,0.15)', color: 'var(--fg-muted)', label: 'Manual' },
  demo_fixture: { bg: 'rgba(245,166,35,0.15)', color: 'var(--accent-amber)', label: 'Demo fixture' },
  proposed: { bg: 'rgba(185,154,255,0.15)', color: 'var(--accent-lavender)', label: 'Proposed' },
  disconnected: { bg: 'rgba(239,83,80,0.15)', color: 'var(--accent-red)', label: 'Disconnected' },
  error: { bg: 'rgba(239,83,80,0.15)', color: 'var(--accent-red)', label: 'Error' },
}

export function DataModeBadge({ mode }: { mode: string }) {
  const style = MODE_STYLES[mode] ?? MODE_STYLES.manual
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.03em',
        padding: '2px 7px',
        borderRadius: 10,
        background: style.bg,
        color: style.color,
        whiteSpace: 'nowrap',
      }}
    >
      {style.label}
    </span>
  )
}
