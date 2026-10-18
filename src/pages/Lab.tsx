import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import {
  startResearch, listResearchSteps, getResearchStatus,
  controlResearch, listExperiments, listRuns,
} from '../api/client'
import '../styles/lab.css'

// ── Types ──

interface ResearchStep {
  id: string
  project_id: string
  phase: string
  content: string
  evidence: string[]
  confidence: number
  created_at: string
  parent_step_id: string | null
  human_influenced: boolean
}

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

type ResearchState = 'idle' | 'running' | 'paused' | 'completed' | 'cancelled' | 'failed'

// ── API helpers not in openapi client ──

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

async function startAutonomous(projectId: string) {
  const res = await fetch(`${API_BASE}/api/v1/projects/${encodeURIComponent(projectId)}/research/autonomous`, { method: 'POST' })
  if (!res.ok) throw new Error(`Autonomous start failed (${res.status})`)
  return res.json()
}

async function sendFeedback(projectId: string, stepId: string, action: string, text: string) {
  const res = await fetch(
    `${API_BASE}/api/v1/projects/${encodeURIComponent(projectId)}/research/steps/${encodeURIComponent(stepId)}/feedback`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, action }),
    },
  )
  if (!res.ok) throw new Error(`Feedback failed (${res.status})`)
  return res.json()
}

// ── Reusable components (kept from original) ──

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

function StatusBadge({ status }: { status: string }) {
  return <span className={`lab-badge lab-badge-${status}`}>{status}</span>
}

const PHASE_LABELS: Record<string, string> = {
  scan: 'Scan',
  hypothesize: 'Hypothesis',
  experiment: 'Experiment',
  evaluate: 'Evaluate',
  plan: 'Plan',
}

const PHASE_COLORS: Record<string, string> = {
  scan: 'var(--accent-cyan)',
  hypothesize: 'var(--accent-lavender)',
  experiment: 'var(--accent-mint)',
  evaluate: 'var(--accent-amber, #d97706)',
  plan: 'var(--accent-icy, #57DDF6)',
}

const SPARKLINE_COLORS: Record<string, string> = {
  PSNR: '#57DDF6',
  SSIM: '#4EE8BA',
  Loss: '#E790EE',
  coverage_fraction: '#4EE8BA',
  visible_count: '#57DDF6',
}

function formatMetricValue(value: number, name: string): string {
  if (name === 'Loss') return value.toFixed(4)
  if (name === 'SSIM') return value.toFixed(3)
  if (name === 'coverage_fraction') return (value * 100).toFixed(1) + '%'
  return value.toFixed(2)
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
  const created = (exp.created_at as string) || new Date().toISOString()
  const updated = (exp.updated_at as string) || created
  const diffMs = new Date(updated).getTime() - new Date(created).getTime()
  const mins = Math.floor(diffMs / 60000)
  const secs = Math.floor((diffMs % 60000) / 1000)
  return {
    id: exp.id as string,
    runNum: idx + 1,
    hypothesis: (exp.hypothesis as string) || (exp.method as string) || 'Experiment',
    status: ((exp.status as string) || 'queued') as ExperimentRun['status'],
    metrics,
    startedAt: created,
    duration: `${mins}m ${secs.toString().padStart(2, '0')}s`,
    config: (exp.config as Record<string, number | string>) || {},
  }
}

// ── Step Feedback Component ──

function StepFeedback({ projectId, stepId, onDone }: { projectId: string; stepId: string; onDone: () => void }) {
  const [action, setAction] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!action || !text.trim()) return
    setSending(true)
    try {
      await sendFeedback(projectId, stepId, action, text.trim())
      setText('')
      setAction(null)
      onDone()
    } catch {
      // silently fail for demo
    } finally {
      setSending(false)
    }
  }

  if (!action) {
    return (
      <div className="lab-step-feedback-actions">
        {['approve', 'redirect', 'refine', 'reject'].map((a) => (
          <button key={a} className={`lab-step-feedback-btn lab-step-feedback-btn--${a}`} onClick={() => setAction(a)}>
            {a.charAt(0).toUpperCase() + a.slice(1)}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="lab-step-feedback-input">
      <div className="lab-step-feedback-input-label">
        <StatusBadge status={action} />
        <button className="lab-step-feedback-cancel" onClick={() => setAction(null)}>Cancel</button>
      </div>
      <textarea
        className="lab-feedback-textarea"
        placeholder={`Add context for your ${action}...`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
      />
      <button
        className="lab-btn-primary"
        style={{ marginTop: 6, padding: '7px 14px', fontSize: 12 }}
        onClick={handleSend}
        disabled={!text.trim() || sending}
      >
        {sending ? 'Sending...' : `Submit ${action}`}
      </button>
    </div>
  )
}

// ── Main Component ──

export default function Lab() {
  const { projectId } = useParams()
  const [researchState, setResearchState] = useState<ResearchState>('idle')
  const [steps, setSteps] = useState<ResearchStep[]>([])
  const [experiments, setExperiments] = useState<ExperimentRun[]>([])
  const [loading, setLoading] = useState(false)
  const [launching, setLaunching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchStatus = useCallback(async () => {
    if (!projectId) return
    try {
      const status = await getResearchStatus(projectId) as { state: string }
      setResearchState(status.state as ResearchState)
    } catch {
      // status endpoint may not exist yet
    }
  }, [projectId])

  const fetchSteps = useCallback(async () => {
    if (!projectId) return
    try {
      const data = await listResearchSteps(projectId)
      setSteps(data as ResearchStep[])
    } catch {
      // steps may be empty
    }
  }, [projectId])

  const fetchExperiments = useCallback(async () => {
    if (!projectId) return
    try {
      const exps = await listExperiments(projectId)
      setExperiments((exps as Record<string, unknown>[]).map((e, i) => toExperimentRun(e, i)).reverse())
    } catch {
      try {
        const runData = await listRuns(projectId)
        setExperiments((runData as Record<string, unknown>[]).map((r, i) => ({
          id: (r as { id: string }).id,
          runNum: i + 1,
          hypothesis: `Run ${i + 1}`,
          status: (((r as { status: string }).status || 'completed') as ExperimentRun['status']),
          metrics: [],
          startedAt: ((r as { started_at?: string }).started_at || new Date().toISOString()),
          duration: '—',
          config: {},
        })))
      } catch {
        // no experiments data
      }
    }
  }, [projectId])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    await Promise.all([fetchStatus(), fetchSteps(), fetchExperiments()])
    setLoading(false)
  }, [fetchStatus, fetchSteps, fetchExperiments])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Poll while running
  useEffect(() => {
    if (researchState === 'running') {
      pollRef.current = setInterval(() => {
        fetchSteps()
        fetchStatus()
        fetchExperiments()
      }, 3000)
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [researchState, fetchSteps, fetchStatus, fetchExperiments])

  const handleLaunchDemo = async () => {
    if (!projectId) return
    setLaunching(true)
    setError(null)
    try {
      await startResearch(projectId)
      await fetchAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start demo research')
    } finally {
      setLaunching(false)
    }
  }

  const handleLaunchAutonomous = async () => {
    if (!projectId) return
    setLaunching(true)
    setError(null)
    try {
      await startAutonomous(projectId)
      setResearchState('running')
      await fetchAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start autonomous loop')
    } finally {
      setLaunching(false)
    }
  }

  const handleAbort = async () => {
    if (!projectId) return
    try {
      await controlResearch(projectId, { action: 'cancel' })
      await fetchAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to abort')
    }
  }

  if (!projectId) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--fg-dim)', fontSize: 13 }}>
          Select a project to view the Research Lab
        </div>
      </div>
    )
  }

  if (loading && steps.length === 0 && experiments.length === 0) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--fg-dim)', fontSize: 13 }}>Loading research lab...</div>
      </div>
    )
  }

  const activeExperiment = experiments.find((r) => r.status === 'running') || experiments[0]
  const isRunning = researchState === 'running'
  const isIdle = researchState === 'idle' || researchState === 'completed' || researchState === 'cancelled' || researchState === 'failed'

  return (
    <div className="page-content">
      <div className="lab-header-label">Research Lab</div>
      <h1 style={{ marginBottom: 8 }}>Experiment Control Room</h1>

      {error && (
        <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid var(--accent-red)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, color: 'var(--accent-red)', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Status Banner */}
      <div className={`lab-status-banner lab-status-banner--${researchState}`}>
        <div className="lab-status-dot" />
        <span className="lab-status-text">
          {isRunning && 'Research agent is running...'}
          {researchState === 'paused' && 'Research paused'}
          {researchState === 'completed' && 'Research completed'}
          {researchState === 'cancelled' && 'Research cancelled'}
          {researchState === 'failed' && 'Research failed'}
          {researchState === 'idle' && 'Ready to start research'}
        </span>
        <span className="lab-status-badge">{researchState}</span>
      </div>

      {/* Launch Controls */}
      {isIdle && (
        <div className="lab-launch-row">
          <button
            className="lab-launch-btn lab-launch-btn--demo"
            onClick={handleLaunchDemo}
            disabled={launching}
          >
            <span className="lab-launch-icon">&#9654;</span>
            <div>
              <div className="lab-launch-btn-title">Demo Research (3DGS)</div>
              <div className="lab-launch-btn-desc">Scripted walkthrough with mock data</div>
            </div>
          </button>
          <button
            className="lab-launch-btn lab-launch-btn--auto"
            onClick={handleLaunchAutonomous}
            disabled={launching}
          >
            <span className="lab-launch-icon">&#9889;</span>
            <div>
              <div className="lab-launch-btn-title">Autonomous Loop</div>
              <div className="lab-launch-btn-desc">Real evaluator + Gemini AI iterations</div>
            </div>
          </button>
        </div>
      )}

      <div className="lab-layout">
        {/* Left: Research Steps Feed */}
        <div>
          {steps.length > 0 ? (
            <>
              <div className="lab-history-title">Research Steps ({steps.length})</div>
              <div className="lab-steps-feed">
                {steps.map((step) => (
                  <div key={step.id} className="lab-step-card">
                    <div className="lab-step-header">
                      <span
                        className="lab-step-phase"
                        style={{ borderColor: PHASE_COLORS[step.phase] || 'var(--border)', color: PHASE_COLORS[step.phase] || 'var(--fg-dim)' }}
                      >
                        {PHASE_LABELS[step.phase] || step.phase}
                      </span>
                      {step.human_influenced && (
                        <span className="lab-step-human-badge">Human</span>
                      )}
                      <span className="lab-step-time">
                        {new Date(step.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <div className="lab-step-content">{step.content}</div>
                    <div className="lab-step-meta">
                      <div className="lab-step-confidence">
                        <span className="lab-step-confidence-label">Confidence</span>
                        <div className="lab-step-confidence-bar">
                          <div
                            className="lab-step-confidence-fill"
                            style={{ width: `${step.confidence * 100}%` }}
                          />
                        </div>
                        <span className="lab-step-confidence-value">{(step.confidence * 100).toFixed(0)}%</span>
                      </div>
                      {step.evidence.length > 0 && (
                        <details className="lab-step-evidence">
                          <summary>{step.evidence.length} evidence item{step.evidence.length !== 1 ? 's' : ''}</summary>
                          <ul>
                            {step.evidence.map((e, i) => (
                              <li key={i}><code>{e}</code></li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </div>
                    <StepFeedback projectId={projectId} stepId={step.id} onDone={fetchAll} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            !loading && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 40, textAlign: 'center', color: 'var(--fg-dim)', fontSize: 13, marginBottom: 16 }}>
                No research steps yet. Launch a research flow to get started.
              </div>
            )
          )}

          {/* Experiment History */}
          {activeExperiment && activeExperiment.metrics.length > 0 && (
            <div className="lab-active-card" style={{ marginTop: 16 }}>
              <div className="lab-active-header">
                <div className="lab-active-title">Latest Experiment</div>
                <StatusBadge status={activeExperiment.status} />
              </div>
              <div className="lab-active-hypothesis">{activeExperiment.hypothesis}</div>
              <div className="lab-sparklines">
                {activeExperiment.metrics.map((m) => (
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
            </div>
          )}
        </div>

        {/* Right: Controls Sidebar */}
        <div className="lab-controls">
          {isRunning && (
            <div className="lab-agent-status">
              <div className="lab-agent-dot" />
              Agent autonomously iterating
            </div>
          )}

          <div className="lab-control-card">
            <div className="lab-control-title">Research Status</div>
            <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 8 }}>
              <strong>{steps.length}</strong> steps &middot; <strong>{experiments.length}</strong> experiments
            </div>
            {researchState === 'completed' && (
              <div style={{ fontSize: 12, color: 'var(--accent-green)', marginBottom: 8 }}>
                Research loop completed successfully.
              </div>
            )}
          </div>

          {(isRunning || researchState === 'paused') && (
            <div className="lab-control-card">
              <div className="lab-control-title">Run Control</div>
              <button className="lab-btn-danger" onClick={handleAbort}>
                Abort Research
              </button>
              <hr className="lab-control-divider" />
              <div style={{ fontSize: 11, color: 'var(--fg-dim)', lineHeight: 1.5, marginTop: 4 }}>
                Aborting cancels running experiments and stops the research loop.
              </div>
            </div>
          )}

          {isIdle && steps.length > 0 && (
            <div className="lab-control-card">
              <div className="lab-control-title">Actions</div>
              <button className="lab-btn-primary" onClick={handleLaunchDemo} disabled={launching}>
                Re-run Demo
              </button>
              <div style={{ height: 8 }} />
              <button className="lab-btn-primary" style={{ background: 'var(--accent-lavender)' }} onClick={handleLaunchAutonomous} disabled={launching}>
                Launch Autonomous
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
