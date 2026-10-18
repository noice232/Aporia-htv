import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>
            <span style={{ color: 'var(--accent-red)' }}>!</span>
          </div>
          <h3 style={{ color: 'var(--fg)', marginBottom: 8, textTransform: 'none' }}>Something went wrong</h3>
          <p style={{ fontSize: 13, maxWidth: 400, margin: '0 auto 16px', lineHeight: 1.5 }}>
            {this.state.error.message}
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              background: 'rgba(87,221,246,0.12)',
              color: 'var(--accent-cyan)',
              border: '1px solid rgba(87,221,246,0.25)',
              borderRadius: 6,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
