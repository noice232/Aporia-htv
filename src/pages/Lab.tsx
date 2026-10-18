import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { listExperiments, listRuns } from '../api/client'
import '../styles/lab.css'

interface ExperimentRun {
  id: string
  runNum: number
  hypothesis: string
  status: 'running' | 'completed' | 'failed' | 'queued'
  metrics: { name: string; value: number; unit: string; sparkline: number[] }[]
  startedAt: string
  duration: string
  config: Record<string, number | string>
}

function toExperimentRun(exp: Record<string, unknown>, idx: number): ExperimentRun {
  const metrics: ExperimentRun['metrics'] = []
  const results = exp.results as Record<string, unknown> | null
  if (results && results.metrics && typeof results.metrics === 'object') {
    const m = results.metrics as Record<string, unknown>
    for (const [name, val] of Object.entries(m)) {
      if (typeof val === 'number') {
        metrics.push({ name, value: val, unit: name === 'PSNR' ? 'dB' : '', sparkline: [val] })
      }
    }
  }
  const created = exp.created_at as string || new Date().toISOString()
  const updated = exp.updated_at as string || created
  const diffMs = new Date(updated).getTime() - new Date(created).getTime()
  const mins = Math.floor(diffMs / 60000)
  const secs = Math.floor((diffMs % 60000) / 1000)
  return {
    id: exp.id as string,
    runNum: idx + 1,
    hypothesis: (exp.hypothesis as string) || (exp.method as string) || 'Experiment',
    status: (exp.status as ExperimentRun['status']) || 'queued',
    metrics,
    startedAt: created,
    duration: `${mins}m ${secs.toString().padStart(2, '0')}s`,
    config: (exp.config as Record<string, number | string>) || {},
  }
}

function Sparkline({ data, color, width = 140, height = 32 }: { data: number[]; color: string; width?: number; height?: number }) {
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

function StatusBadge({ status }: { status: ExperimentRun['status'] }) {
  return <span className={`lab-badge lab-badge-${status}`}>{status}</span>
}

function formatMetricValue(value: number, name: string): string {
  if (name === 'Loss') return value.toFixed(4)
  if (name === 'SSIM') return value.toFixed(3)
  return value.toFixed(2)
}

const SPARKLINE_COLORS: Record<string, string> = {
  PSNR: '#57DDF6',
  SSIM: '#4EE8BA',
  Loss: '#E790EE',
}

export default function Lab() {
  const { projectId } = useParams()
  const [lr, setLr] = useState('0.0005')
  const [epochs, setEpochs] = useState('80')
  const [batchSize, setBatchSize] = useState('4096')
  const [runs, setRuns] = useState<ExperimentRun[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const exps = await listExperiments(projectId)
      const mapped = (exps as Record<string, unknown>[]).map((e, i) => toExperimentRun(e, i)).reverse()
      setRuns(mapped)
    } catch (err) {
      try {
        const runData = await listRuns(projectId)
        const mapped = (runData as Record<string, unknown>[]).map((r, i) => ({
          id: (r as { id: string }).id,
          runNum: i + 1,
          hypothesis: `Run ${i + 1}`,
          status: ((r as { status: string }).status || 'completed') as ExperimentRun['status'],
          metrics: [],
          startedAt: (r as { started_at?: string }).started_at || new Date().toISOString(),
          duration: '—',
          config: {},
        }))
        setRuns(mapped)
      } catch {
        setError(err instanceof Error ? err.message : 'Failed to load experiments')
      }
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { fetchData() }, [fetchData])

  if (!projectId) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--fg-dim)' }}>
          <div style={{ fontSize: 13 }}>Select a project to view the Research Lab</div>
        </div>
      </div>
    )
  }

  if (loading && runs.length === 0) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--fg-dim)', fontSize: 13 }}>Loading experiments...</div>
      </div>
    )
  }

  const activeRun = runs.find((r) => r.status === 'running') || runs[0]
  const historyRuns = activeRun ? runs.filter((r) => r.id !== activeRun.id) : runs

  return (
    <div className="page-content">
      <div className="lab-header-label">Research Lab</div>
      <h1 style={{ marginBottom: 8 }}>Experiment Control Room</h1>
      <p className="lab-subtitle">
        Project: <code style={{ color: 'var(--accent-icy)' }}>{projectId}</code>
      </p>

      {error && (
        <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid var(--accent-red)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, color: 'var(--accent-red)', marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="lab-layout">
        <div>
          {activeRun ? (
            <>
              {/* Active Experiment */}
              <div className="lab-active-card">
                <div className="lab-active-header">
                  <div className="lab-active-title">Run #{activeRun.runNum}</div>
                  <StatusBadge status={activeRun.status} />
                </div>
                <div className="lab-active-hypothesis">{activeRun.hypothesis}</div>
                <div className="lab-active-meta">
                  <div>Started <span>{new Date(activeRun.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                  <div>Elapsed <span>{activeRun.duration}</span></div>
                  <div>Config <span style={{ color: 'var(--accent-lavender)' }}>
                    {Object.entries(activeRun.config).map(([k, v]) => `${k}=${v}`).join(' ')}
                  </span></div>
                </div>
                {activeRun.metrics.length > 0 && (
                  <div className="lab-sparklines">
                    {activeRun.metrics.map((m) => (
                      <div key={m.name} className="lab-sparkline-card">
                        <div className="lab-sparkline-label">{m.name}</div>
                        <div className="lab-sparkline-value" style={{ color: SPARKLINE_COLORS[m.name] || 'var(--fg)' }}>
                          {formatMetricValue(m.value, m.name)}
                          {m.unit && <span style={{ fontSize: 11, color: 'var(--fg-dim)', marginLeft: 3 }}>{m.unit}</span>}
                        </div>
                        <Sparkline data={m.sparkline} color={SPARKLINE_COLORS[m.name] || '#57DDF6'} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 40, textAlign: 'center', color: 'var(--fg-dim)', fontSize: 13, marginBottom: 16 }}>
              No experiments yet. Launch one to get started.
            </div>
          )}

          {/* Run History */}
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
                      {historyRuns.map((run) => {
                        const psnr = run.metrics.find((m) => m.name === 'PSNR')
                        return (
                          <tr key={run.id}>
                            <td className="lab-run-num">{run.runNum}</td>
                            <td className="lab-run-hypothesis">{run.hypothesis}</td>
                            <td><StatusBadge status={run.status} /></td>
                            <td className="lab-run-metric">
                              {psnr ? `${psnr.value.toFixed(2)} ${psnr.unit}` : '—'}
                            </td>
                            <td className="lab-run-duration">{run.duration}</td>
                            <td className="lab-run-time">
                              {new Date(run.startedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                              {new Date(run.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
            Agent autonomously iterating
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
            <button className="lab-btn-primary">Launch Experiment</button>
          </div>

          <div className="lab-control-card">
            <div className="lab-control-title">Run Control</div>
            <button className="lab-btn-danger">Abort Current Run</button>
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
