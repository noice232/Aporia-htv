import { useState, useEffect } from 'react'
import { Link2, Copy, Check } from 'lucide-react'
import { getHealth, getIntegrationStatus } from '../api/client'
import { useProjectStore } from '../stores/projects'
import '../styles/settings.css'

interface HealthData {
  status: string
  version?: string
  uptime?: number
  database?: string
}

interface Integration {
  name: string
  status: 'connected' | 'disconnected' | 'error'
  detail?: string
}

export default function SettingsPage() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [demoMode, setDemoMode] = useState(true)
  const [copied, setCopied] = useState(false)
  const currentProject = useProjectStore((s) => s.projects.find((p) => p.id === s.currentId))
  const apiBase = import.meta.env.VITE_API_BASE_URL || window.location.origin

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [healthRes, intRes] = await Promise.allSettled([
          getHealth(),
          getIntegrationStatus(),
        ])

        if (healthRes.status === 'fulfilled') {
          const h = healthRes.value as Record<string, unknown>
          setHealth({
            status: String(h.status || 'unknown'),
            version: h.version as string | undefined,
            uptime: h.uptime as number | undefined,
            database: h.database as string | undefined,
          })
        }

        if (intRes.status === 'fulfilled') {
          const data = intRes.value as Record<string, unknown>
          const mapped: Integration[] = []
          for (const [name, val] of Object.entries(data)) {
            if (typeof val === 'object' && val !== null) {
              const v = val as Record<string, unknown>
              mapped.push({
                name,
                status: v.connected ? 'connected' : 'disconnected',
                detail: v.detail as string | undefined,
              })
            } else {
              mapped.push({
                name,
                status: val === true || val === 'connected' ? 'connected' : 'disconnected',
              })
            }
          }
          setIntegrations(mapped)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--fg-dim)' }}>Loading...</p>
      </div>
    )
  }

  return (
    <div className="settings-page">
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--accent-mint)', textTransform: 'uppercase', marginBottom: 8 }}>
        Settings
      </div>
      <h1 style={{ marginBottom: 8 }}>Workspace Settings</h1>
      <p style={{ color: 'var(--fg-muted)', fontSize: 13, marginBottom: 24 }}>
        Provider health, integration status, and system diagnostics.
      </p>

      {error && (
        <div className="settings-error">{error}</div>
      )}

      {/* Health Status */}
      <div className="settings-section">
        <h2 className="settings-section-title">System Health</h2>
        {health ? (
          <div className="settings-card">
            <div className="settings-health-row">
              <span className="settings-health-label">Status</span>
              <span className={`settings-health-badge ${health.status === 'ok' || health.status === 'healthy' ? 'healthy' : 'unhealthy'}`}>
                {health.status}
              </span>
            </div>
            {health.version && (
              <div className="settings-health-row">
                <span className="settings-health-label">Version</span>
                <span className="settings-health-value">{health.version}</span>
              </div>
            )}
            {health.database && (
              <div className="settings-health-row">
                <span className="settings-health-label">Database</span>
                <span className={`settings-health-badge ${health.database === 'ok' || health.database === 'connected' ? 'healthy' : 'unhealthy'}`}>
                  {health.database}
                </span>
              </div>
            )}
            {health.uptime !== undefined && (
              <div className="settings-health-row">
                <span className="settings-health-label">Uptime</span>
                <span className="settings-health-value">{Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m</span>
              </div>
            )}
          </div>
        ) : (
          <div className="settings-card" style={{ color: 'var(--fg-dim)', fontSize: 13 }}>
            Health endpoint unavailable
          </div>
        )}
      </div>

      {/* Integrations */}
      <div className="settings-section">
        <h2 className="settings-section-title">Integrations</h2>
        {integrations.length > 0 ? (
          <div className="settings-integrations">
            {integrations.map((int) => (
              <div className="settings-integration-card" key={int.name}>
                <div className="settings-integration-header">
                  <span className="settings-integration-name">{int.name}</span>
                  <span className={`settings-integration-status ${int.status}`}>
                    <span className="settings-status-dot" />
                    {int.status}
                  </span>
                </div>
                {int.detail && (
                  <div className="settings-integration-detail">{int.detail}</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="settings-card" style={{ color: 'var(--fg-dim)', fontSize: 13 }}>
            No integrations configured
          </div>
        )}
      </div>
      {/* Workspace Info */}
      <div className="settings-section">
        <h2 className="settings-section-title">Workspace</h2>
        <div className="settings-card">
          <div className="settings-health-row">
            <span className="settings-health-label">Current project</span>
            <span className="settings-health-value">{currentProject?.title || 'None selected'}</span>
          </div>
          <div className="settings-health-row">
            <span className="settings-health-label">Collaboration</span>
            <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Share a project link to invite collaborators</span>
          </div>
        </div>
      </div>

      {/* API Configuration */}
      <div className="settings-section">
        <h2 className="settings-section-title">API Configuration</h2>
        <div className="settings-card">
          <div className="settings-health-row">
            <span className="settings-health-label">Endpoint</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <code className="settings-health-value">{apiBase}/api/v1</code>
              <button
                className="settings-copy-btn"
                onClick={() => {
                  navigator.clipboard.writeText(`${apiBase}/api/v1`)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>
          </div>
          <div className="settings-health-row">
            <span className="settings-health-label">Connection</span>
            <span className={`settings-health-badge ${health ? 'healthy' : 'unhealthy'}`}>
              {health ? 'Connected' : 'Unreachable'}
            </span>
          </div>
        </div>
      </div>

      {/* Data Mode */}
      <div className="settings-section">
        <h2 className="settings-section-title">Data Mode</h2>
        <div className="settings-card">
          <div className="settings-toggle-row">
            <div>
              <div className="settings-toggle-label">{demoMode ? 'Demo Mode' : 'Live Mode'}</div>
              <div className="settings-toggle-desc">
                {demoMode
                  ? 'Using synthetic data for demonstration. No API key required.'
                  : 'Connected to live research infrastructure. Requires Gemini API key.'}
              </div>
            </div>
            <button
              className={`settings-toggle ${demoMode ? '' : 'active'}`}
              onClick={() => setDemoMode((d) => !d)}
            >
              <span className="settings-toggle-knob" />
            </button>
          </div>
        </div>
      </div>

      {/* Share */}
      {currentProject && (
        <div className="settings-section">
          <h2 className="settings-section-title">Share Project</h2>
          <div className="settings-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Link2 size={16} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Invite collaborators</div>
                <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                  Share this link to add people to <strong>{currentProject.title}</strong>
                </div>
              </div>
              <button
                className="settings-share-btn"
                onClick={() => {
                  const url = `${window.location.origin}/projects/${currentProject.id}/lab`
                  navigator.clipboard.writeText(url)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
