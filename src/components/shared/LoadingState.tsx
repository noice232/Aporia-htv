export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div style={{ padding: 60, textAlign: 'center', color: 'var(--fg-dim)' }}>
      <div
        style={{
          width: 24,
          height: 24,
          border: '2px solid var(--border)',
          borderTopColor: 'var(--accent-cyan)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px',
        }}
      />
      <p style={{ fontSize: 13 }}>{message}</p>
    </div>
  )
}
