const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  queued: { bg: 'rgba(136,152,175,0.15)', color: 'var(--fg-muted)' },
  running: { bg: 'rgba(87,221,246,0.15)', color: 'var(--accent-cyan)' },
  completed: { bg: 'rgba(78,232,186,0.15)', color: 'var(--accent-mint)' },
  failed: { bg: 'rgba(239,83,80,0.15)', color: 'var(--accent-red)' },
  blocked: { bg: 'rgba(245,166,35,0.15)', color: 'var(--accent-amber)' },
  needs_human: { bg: 'rgba(185,154,255,0.15)', color: 'var(--accent-lavender)' },
  active: { bg: 'rgba(78,232,186,0.15)', color: 'var(--accent-mint)' },
  idle: { bg: 'rgba(136,152,175,0.15)', color: 'var(--fg-muted)' },
}

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.queued
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
        textTransform: 'capitalize',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: 'currentColor',
        }}
      />
      {status.replace(/_/g, ' ')}
    </span>
  )
}
