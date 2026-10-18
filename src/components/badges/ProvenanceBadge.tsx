const PROVENANCE_STYLES: Record<string, { label: string; color: string }> = {
  papiers: { label: 'Papiers', color: 'var(--accent-lavender)' },
  openalex: { label: 'OpenAlex', color: 'var(--accent-cyan)' },
  arxiv: { label: 'arXiv', color: 'var(--accent-icy)' },
  manual: { label: 'Manual', color: 'var(--fg-muted)' },
  compiled: { label: 'Compiled', color: 'var(--accent-mint)' },
}

export function ProvenanceBadge({ source }: { source: string }) {
  const style = PROVENANCE_STYLES[source] ?? PROVENANCE_STYLES.manual
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        color: style.color,
        letterSpacing: '0.02em',
      }}
    >
      {style.label}
    </span>
  )
}
