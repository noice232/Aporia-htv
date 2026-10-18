import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { listRuns, submitGoal } from '../api/client'
import type { Run } from '../api/client'
import { useRunStore } from '../stores/runs'
import { connectSSE, disconnect } from '../api/sse'
import { useEventStore } from '../stores/events'
import '../styles/lab.css'

function Sparkline({ data, color, width = 140, height = 32 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((v - min) / range) * (height - 4) - 2
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg className="lab-sparkline-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace(/[^a-z]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#grad-${color.replace(/[^a-z]/g, '')})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`lab-badge lab-badge-${status}`}>{status}</span>
}

function formatMetricValue(value: number, name: string): string {
  if (name.toLowerCase() === 'loss') return value.toFixed(4)
  if (name.toLowerCase() === 'ssim') return value.toFixed(3)
  return value.toFixed(2)
}

const SPARKLINE_COLORS: Record<string, string> = {
  PSNR: '#0891B2',
  psnr: '#0891B2',
  SSIM: '#0FAF82',
  ssim: '#0FAF82',
  Loss: '#C026D3',
  loss: '#C026D3',
}

interface MetricDisplay {
  name: string
  value: number
  unit: string
  sparkline: number[]
}

function extractMetrics(run: Run): MetricDisplay[] {
  const metrics = run.metrics as Record<string, unknown> | undefined
  if (!metrics || typeof metrics !== 'object') return []

  const result: MetricDisplay[] = []
  for (const [key, val] of Object.entries(metrics)) {
    if (typeof val === 'number') {
      const unit = key.toLowerCase() === 'psnr' ? 'dB' : ''
      result.push({ name: key.toUpperCase(), value: val, unit, sparkline: [] })
    } else if (val && typeof val === 'object' && 'value' in val) {
      const m = val as { value: number; unit?: string; history?: number[] }
      result.push({
        name: key.toUpperCase(),
        value: m.value,
        unit: m.unit || '',
        sparkline: m.history || [],
      })
    }
  }
  return result
}

function formatDuration(start: string, end?: string | null): string {
  const s = new Date(start).getTime()
  const e = end ? new Date(end).getTime() : Date.now()
  const diff = Math.max(0, e - s)
  const mins = Math.floor(diff / 60000)
  const secs = Math.floor((diff % 60000) / 1000)
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60)
    const rm = mins % 60
    return `${hrs}h ${rm.toString().padStart(2, '0')}m`
  }
  return `${mins}m ${secs.toString().padStart(2, '0')}s`
}

export default function Lab() {
  const { projectId } = useParams()
  const runs = useRunStore((s) => s.runs)
  const runsLoading = useRunStore((s) => s.loading)
  const runsError = useRunStore((s) => s.error)
  const setRuns = useRunStore((s) => s.setRuns)
  const setRunsLoading = useRunStore((s) => s.setLoading)
  const setRunsError = useRunStore((s) => s.setError)

  const [lr, setLr] = useState('0.0005')
  const [epochs, setEpochs] = useState('80')
  const [batchSize, setBatchSize] = useState('4096')
  const [launching, setLaunching] = useState(false)
  const [launchError, setLaunchError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId) return
    setRunsLoading(true)
    listRuns(projectId)
      .then(setRuns)
      .catch((err) => setRunsError(err instanceof Error ? err.message : 'Failed to load runs'))
  }, [projectId, setRuns, setRunsLoading, setRunsError])

  useEffect(() => {
    if (!projectId) return
    connectSSE(projectId)
    return () => disconnect()
  }, [projectId])

  const handleLaunch = useCallback(async () => {
    if (!projectId) return
    setLaunching(true)
    setLaunchError(null)
    try {
      await submitGoal(projectId, parseFloat(lr) || 0.0005, Date.now())
      const updated = await listRuns(projectId)
      setRuns(updated)
    } catch (err) {
      setLaunchError(err instanceof Error ? err.message : 'Failed to launch experiment')
    } finally {
      setLaunching(false)
    }
  }, [projectId, lr, setRuns])

  const sorted = [...runs].sort((a, b) => {
    const ta = a.started_at ? new Date(a.started_at).getTime() : 0
    const tb = b.started_at ? new Date(b.started_at).getTime() : 0
    return tb - ta
  })

  const activeRun = sorted.find((r) => r.status === 'running') || sorted[0]
  const historyRuns = activeRun ? sorted.filter((r) => r.id !== activeRun.id) : sorted.slice(1)

  if (runsLoading && runs.length === 0) {
    return (
      <div className="page-content">
        <div className="lab-header-label">Research Lab</div>
        <h1 style={{ marginBottom: 8 }}>Experiment Control Room</h1>
        <p className="lab-subtitle">Project: <code style={{ color: 'var(--accent-icy)' }}>{projectId}</code></p>
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-dim)' }}>Loading experiments...</div>
      </div>
    )
  }

  return (
    <div className="page-content">
      <div className="lab-header-label">Research Lab</div>
      <h1 style={{ marginBottom: 8 }}>Experiment Control Room</h1>
      <p className="lab-subtitle">
        Project: <code style={{ color: 'var(--accent-icy)' }}>{projectId}</code>
      </p>

      {runsError && (
        <div style={{
          background: 'rgba(239,83,80,0.1)',
          border: '1px solid rgba(239,83,80,0.25)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 12px',
          fontSize: 12,
          color: 'var(--accent-red)',
          marginBottom: 16,
        }}>
          {runsError}
        </div>
      )}

      <div className="lab-layout">
        <div>
          {activeRun ? (
            <div className="lab-active-card">
              <div className="lab-active-header">
                <div className="lab-active-title">Run #{activeRun.id?.slice(-3) || '?'}</div>
                <StatusBadge status={activeRun.status || 'queued'} />
              </div>
              <div className="lab-active-hypothesis">{activeRun.hypothesis || 'No hypothesis'}</div>
              <div className="lab-active-meta">
                {activeRun.started_at && (
                  <div>Started <span>{new Date(activeRun.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                )}
                <div>Elapsed <span>{activeRun.started_at ? formatDuration(activeRun.started_at, activeRun.finished_at) : '—'}</span></div>
                {activeRun.config && typeof activeRun.config === 'object' && (
                  <div>Config <span style={{ color: 'var(--accent-lavender)' }}>
                    {Object.entries(activeRun.config as Record<string, unknown>).map(([k, v]) => `${k}=${v}`).join(' ')}
                  </span></div>
                )}
              </div>
              <div className="lab-sparklines">
                {extractMetrics(activeRun).map((m) => (
                  <div key={m.name} className="lab-sparkline-card">
                    <div className="lab-sparkline-label">{m.name}</div>
                    <div className="lab-sparkline-value" style={{ color: SPARKLINE_COLORS[m.name] || SPARKLINE_COLORS[m.name.toLowerCase()] || 'var(--fg)' }}>
                      {formatMetricValue(m.value, m.name)}
                      {m.unit && <span style={{ fontSize: 11, color: 'var(--fg-dim)', marginLeft: 3 }}>{m.unit}</span>}
                    </div>
                    {m.sparkline.length > 1 && (
                      <Sparkline data={m.sparkline} color={SPARKLINE_COLORS[m.name] || SPARKLINE_COLORS[m.name.toLowerCase()] || '#0891B2'} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="lab-active-card" style={{ textAlign: 'center', color: 'var(--fg-dim)', padding: 40 }}>
              No experiments yet. Launch one to get started.
            </div>
          )}

          {historyRuns.length > 0 && (
            <>
              <div className="lab-history-title">Run History</div>
              <div className="lab-history-wrapper">
                <div className="lab-history-scroll">
                  <table className="lab-history-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Hypothesis</th>
                        <th>Status</th>
                        <th>PSNR</th>
                        <th>Duration</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyRuns.map((run, i) => {
                        const metrics = extractMetrics(run)
                        const psnr = metrics.find((m) => m.name === 'PSNR')
                        return (
                          <tr key={run.id}>
                            <td className="lab-run-num">{historyRuns.length - i}</td>
                            <td className="lab-run-hypothesis">{run.hypothesis || '—'}</td>
                            <td><StatusBadge status={run.status || 'queued'} /></td>
                            <td className="lab-run-metric">
                              {psnr ? `${psnr.value.toFixed(2)} ${psnr.unit}` : '—'}
                            </td>
                            <td className="lab-run-duration">
                              {run.started_at ? formatDuration(run.started_at, run.finished_at) : '—'}
                            </td>
                            <td className="lab-run-time">
                              {run.started_at ? (
                                <>
                                  {new Date(run.started_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                                  {new Date(run.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </>
                              ) : '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Controls Sidebar */}
        <div className="lab-controls">
          <div className="lab-agent-status">
            <div className="lab-agent-dot" />
            {useEventStore.getState().connected ? 'Live event stream connected' : 'Connecting to event stream...'}
          </div>

          <div className="lab-control-card">
            <div className="lab-control-title">New Experiment</div>
            <div className="lab-control-field">
              <label>Learning Rate</label>
              <input value={lr} onChange={(e) => setLr(e.target.value)} />
            </div>
            <div className="lab-control-field">
              <label>Epochs</label>
              <input value={epochs} onChange={(e) => setEpochs(e.target.value)} />
            </div>
            <div className="lab-control-field">
              <label>Batch Size</label>
              <input value={batchSize} onChange={(e) => setBatchSize(e.target.value)} />
            </div>
            {launchError && (
              <div style={{ fontSize: 11, color: 'var(--accent-red)', marginBottom: 8 }}>{launchError}</div>
            )}
            <button className="lab-btn-primary" onClick={handleLaunch} disabled={launching}>
              {launching ? 'Launching...' : 'Launch Experiment'}
            </button>
          </div>

          <div className="lab-control-card">
            <div className="lab-control-title">Run Control</div>
            <button className="lab-btn-danger" disabled={!activeRun || activeRun.status !== 'running'}>
              Abort Current Run
            </button>
            <hr className="lab-control-divider" />
            <div style={{ fontSize: 11, color: 'var(--fg-dim)', lineHeight: 1.5, marginTop: 4 }}>
              Aborting saves a checkpoint. The agent will skip to the next hypothesis in the queue.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
