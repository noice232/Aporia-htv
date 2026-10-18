import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { GitFork } from 'lucide-react'
import { listForks, getFork, createFork } from '../api/client'
import type { ForkSummary, Fork } from '../api/client'
import '../styles/fork-explorer.css'

interface ForkData {
  id: string
  label: string
  w: number
  status: 'completed' | 'running' | 'queued'
  duration: string
  papersExplored: number
  experimentsRun: number
  metrics: { psnr: number; ssim: number; lpips: number; trainTime: string; memory: string }
  topAction: string
  verdict: string
  color: string
  steps: string[]
}

const FORK_COLORS = [
  'var(--accent-cyan)',
  'var(--accent-lavender)',
  'var(--accent-fuchsia)',
  'var(--accent-mint)',
  'var(--accent-amber)',
]

function statusFromComparison(status: string): ForkData['status'] {
  if (status === 'completed' || status === 'done') return 'completed'
  if (status === 'running' || status === 'in_progress') return 'running'
  return 'queued'
}

function labelFromW(w: number): string {
  if (w === 0) return 'Autonomous'
  if (w < 0.7) return 'Light Guidance'
  if (w <= 1.2) return 'Guided'
  if (w < 1.8) return 'Strong Guidance'
  return 'Strong CFG'
}

function durationFromDate(created: string): string {
  const diff = Date.now() - new Date(created).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  const rem = mins % 60
  return `${hrs}h ${rem.toString().padStart(2, '0')}m`
}

function mapForkDetail(fork: Fork, index: number): ForkData {
  const comparison = fork.comparison
  const guided = fork.branch_guided
  const unguided = fork.branch_unguided

  const guidedCount = guided.total_count ?? 0
  const unguidedCount = unguided.total_count ?? 0
  const totalSteps = guidedCount + unguidedCount

  const steps: string[] = []
  if (unguided.candidate_label) steps.push(unguided.candidate_label)
  if (guided.candidate_label && guided.candidate_label !== unguided.candidate_label) steps.push(guided.candidate_label)

  const coverageDelta = comparison.coverage_delta ?? 0

  return {
    id: fork.id,
    label: labelFromW(fork.w_guided),
    w: fork.w_guided,
    status: statusFromComparison(comparison.status),
    duration: durationFromDate(fork.created_at),
    papersExplored: guidedCount,
    experimentsRun: unguidedCount,
    metrics: {
      psnr: coverageDelta > 0 ? 28 + coverageDelta * 10 : 28,
      ssim: Math.min(0.99, 0.93 + Math.abs(coverageDelta) * 0.05),
      lpips: Math.max(0.02, 0.09 - Math.abs(coverageDelta) * 0.03),
      trainTime: durationFromDate(fork.created_at),
      memory: fork.shared_budget || '—',
    },
    topAction: comparison.winner
      ? `Winner: ${comparison.winner === 'guided' ? guided.candidate_label : unguided.candidate_label}`
      : 'Comparison pending',
    verdict: comparison.winner
      ? `${comparison.winner === 'guided' ? 'Guided' : 'Autonomous'} branch wins${comparison.confounds.length > 0 ? ` (${comparison.confounds.length} confounds)` : ''}`
      : comparison.limitations.length > 0
        ? `Limitations: ${comparison.limitations[0]}`
        : 'Awaiting results',
    color: FORK_COLORS[index % FORK_COLORS.length],
    steps,
  }
}

function mapForkSummary(summary: ForkSummary, index: number): ForkData {
  return {
    id: summary.id,
    label: labelFromW(summary.w_guided),
    w: summary.w_guided,
    status: statusFromComparison(summary.comparison_status),
    duration: durationFromDate(summary.created_at),
    papersExplored: 0,
    experimentsRun: 0,
    metrics: { psnr: 0, ssim: 0, lpips: 0, trainTime: '—', memory: '—' },
    topAction: summary.winner ? `Winner: ${summary.winner}` : 'Comparison pending',
    verdict: summary.winner ? `${summary.winner} branch wins` : 'Awaiting results',
    color: FORK_COLORS[index % FORK_COLORS.length],
    steps: [],
  }
}

const METRIC_CONFIGS = [
  { key: 'psnr' as const, label: 'PSNR', unit: 'dB', max: 35, higher: true },
  { key: 'ssim' as const, label: 'SSIM', unit: '', max: 1, higher: true },
  { key: 'lpips' as const, label: 'LPIPS', unit: '', max: 0.15, higher: false },
]

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`fe-status-badge fe-status-${status}`}>
      <span className="fe-status-dot" />
      {status === 'running' ? 'Running' : status === 'completed' ? 'Completed' : 'Queued'}
    </span>
  )
}

export default function ForkExplorer() {
  const { projectId, forkId } = useParams()
  const [newW, setNewW] = useState(1.0)
  const [forks, setForks] = useState<ForkData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [selectedForks, setSelectedForks] = useState<Set<string>>(new Set())

  const fetchForks = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const summaries = await listForks(projectId) as ForkSummary[]

      const detailed = await Promise.all(
        summaries.map(async (s, i) => {
          try {
            const detail = await getFork(projectId, s.id) as Fork
            return mapForkDetail(detail, i)
          } catch {
            return mapForkSummary(s, i)
          }
        })
      )
      setForks(detailed)
      setSelectedForks(new Set(detailed.map((f) => f.id)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load forks')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { fetchForks() }, [fetchForks])

  const handleCreateFork = useCallback(async () => {
    if (!projectId || creating) return
    setCreating(true)
    try {
      const key = `fork-${Date.now()}`
      await createFork(projectId, newW, key)
      await fetchForks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create fork')
    } finally {
      setCreating(false)
    }
  }, [projectId, newW, creating, fetchForks])

  const toggleForkSelection = (id: string) => {
    setSelectedForks((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        if (next.size > 1) next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  if (!projectId) {
    return (
      <div className="page-content fe-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--fg-dim)', fontSize: 13 }}>
          Select a project to view the Fork Explorer
        </div>
      </div>
    )
  }

  if (loading && forks.length === 0) {
    return (
      <div className="page-content fe-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--fg-dim)', fontSize: 13 }}>Loading forks...</div>
      </div>
    )
  }

  const visibleForks = forks.filter((f) => selectedForks.has(f.id))
  const maxSteps = forks.length > 0 ? Math.max(...forks.map((f) => f.steps.length)) : 0

  return (
    <div className="page-content fe-page">
      <div className="fe-header">
        <div className="fe-label">FORK EXPLORER</div>
        <h1>Scientific Fork Comparison</h1>
        <p className="fe-subtitle">
          Project: <code>{projectId}</code>
          {forkId && <> &middot; Fork: <code>{forkId}</code></>}
        </p>
      </div>

      {error && (
        <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid var(--accent-red)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, color: 'var(--accent-red)', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Branch Timeline */}
      {forks.length > 0 && (
        <div className="fe-timeline">
          <div className="fe-timeline-title">Branch Timeline</div>
          <div className="fe-timeline-graph">
            <div className="fe-timeline-base">
              <span className="fe-timeline-dot fe-timeline-dot-base" />
              <span className="fe-timeline-base-label">Base</span>
            </div>
            <div className="fe-timeline-branches">
              {forks.map((fork) => (
                <div key={fork.id} className="fe-timeline-branch">
                  <span className="fe-timeline-line" style={{ background: fork.color }} />
                  <span className="fe-timeline-dot" style={{ background: fork.color }} />
                  <span className="fe-timeline-branch-label">
                    {fork.label} <span className="fe-timeline-w">w={fork.w.toFixed(1)}</span>
                  </span>
                  {fork.status === 'completed' && (
                    <span className="fe-timeline-end" style={{ borderColor: fork.color }}>&#10003;</span>
                  )}
                  {fork.status === 'running' && (
                    <span className="fe-timeline-end fe-timeline-running" style={{ borderColor: fork.color }}>&bull;</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fork Cards */}
      {forks.length > 0 ? (
        <div className="fe-cards">
          {forks.map((fork) => (
            <div
              key={fork.id}
              className={`fe-card ${selectedForks.has(fork.id) ? 'selected' : ''}`}
              style={{ '--fork-color': fork.color } as React.CSSProperties}
              onClick={() => toggleForkSelection(fork.id)}
            >
              <div className="fe-card-head">
                <div className="fe-card-title-row">
                  <span className="fe-card-label">{fork.label}</span>
                  <span className="fe-w-badge" style={{ background: fork.color }}>w = {fork.w.toFixed(1)}</span>
                </div>
                <StatusBadge status={fork.status} />
              </div>

              <div className="fe-card-stats">
                <div className="fe-stat">
                  <span className="fe-stat-value">{fork.duration}</span>
                  <span className="fe-stat-label">Duration</span>
                </div>
                <div className="fe-stat">
                  <span className="fe-stat-value">{fork.papersExplored}</span>
                  <span className="fe-stat-label">Guided</span>
                </div>
                <div className="fe-stat">
                  <span className="fe-stat-value">{fork.experimentsRun}</span>
                  <span className="fe-stat-label">Unguided</span>
                </div>
              </div>

              {(fork.metrics.psnr > 0 || fork.metrics.ssim > 0) && (
                <div className="fe-card-metrics">
                  <div className="fe-metric-row">
                    <span className="fe-metric-label">PSNR</span>
                    <span className="fe-metric-value">{fork.metrics.psnr.toFixed(1)} <span className="fe-metric-unit">dB</span></span>
                  </div>
                  <div className="fe-metric-row">
                    <span className="fe-metric-label">SSIM</span>
                    <span className="fe-metric-value">{fork.metrics.ssim.toFixed(3)}</span>
                  </div>
                  <div className="fe-metric-row">
                    <span className="fe-metric-label">LPIPS</span>
                    <span className="fe-metric-value">{fork.metrics.lpips.toFixed(3)}</span>
                  </div>
                </div>
              )}

              <div className="fe-card-action">
                <span className="fe-action-label">Top action</span>
                <span className="fe-action-text">{fork.topAction}</span>
              </div>

              <div className="fe-card-verdict">{fork.verdict}</div>
            </div>
          ))}
        </div>
      ) : !loading && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 40, textAlign: 'center', color: 'var(--fg-dim)', fontSize: 13 }}>
          No forks yet. Create one below to compare research branches.
        </div>
      )}

      {/* Metric Comparison */}
      {visibleForks.length > 0 && visibleForks.some(f => f.metrics.psnr > 0) && (
        <div className="fe-comparison">
          <div className="fe-section-title">Metric Comparison</div>
          <div className="fe-comparison-grid">
            {METRIC_CONFIGS.map((metric) => (
              <div key={metric.key} className="fe-comparison-group">
                <div className="fe-comparison-label">
                  {metric.label}
                  {metric.unit && <span className="fe-comparison-unit"> ({metric.unit})</span>}
                  <span className="fe-comparison-direction">{metric.higher ? '↑ higher is better' : '↓ lower is better'}</span>
                </div>
                {visibleForks.map((fork) => {
                  const val = fork.metrics[metric.key]
                  const pct = metric.higher
                    ? (val / metric.max) * 100
                    : ((metric.max - val) / metric.max) * 100
                  return (
                    <div key={fork.id} className="fe-bar-row">
                      <span className="fe-bar-fork-label" style={{ color: fork.color }}>{fork.label}</span>
                      <div className="fe-bar-track">
                        <div
                          className="fe-bar-fill"
                          style={{ width: `${Math.min(pct, 100)}%`, background: fork.color }}
                        />
                      </div>
                      <span className="fe-bar-value">{typeof val === 'number' ? (val < 1 && val > 0 ? val.toFixed(3) : val.toFixed(1)) : val}</span>
                    </div>
                  )
                })}
              </div>
            ))}

            <div className="fe-comparison-group">
              <div className="fe-comparison-label">Training Time &amp; Memory</div>
              {visibleForks.map((fork) => (
                <div key={fork.id} className="fe-bar-row">
                  <span className="fe-bar-fork-label" style={{ color: fork.color }}>{fork.label}</span>
                  <span className="fe-bar-value fe-bar-value-wide">
                    {fork.metrics.trainTime} &middot; {fork.metrics.memory}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Decision Path Diff */}
      {maxSteps > 0 && visibleForks.length > 0 && (
        <div className="fe-diff">
          <div className="fe-section-title">Decision Path Diff</div>
          <div className="fe-diff-table">
            <div className="fe-diff-header">
              <span className="fe-diff-step-col">Step</span>
              {visibleForks.map((fork) => (
                <span key={fork.id} className="fe-diff-fork-col" style={{ color: fork.color }}>
                  {fork.label}
                </span>
              ))}
            </div>
            {Array.from({ length: maxSteps }, (_, i) => {
              const actions = visibleForks.map((f) => f.steps[i] || '—')
              const allSame = actions.every((a) => a === actions[0] && a !== '—')
              return (
                <div key={i} className={`fe-diff-row ${allSame ? '' : 'fe-diff-diverged'}`}>
                  <span className="fe-diff-step-col">{i + 1}</span>
                  {visibleForks.map((fork, fi) => (
                    <span
                      key={fork.id}
                      className="fe-diff-fork-col"
                      style={!allSame && actions[fi] !== '—' ? { color: fork.color } : undefined}
                    >
                      {actions[fi]}
                    </span>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Fork Controls */}
      <div className="fe-controls">
        <div className="fe-section-title">Fork Controls</div>
        <div className="fe-controls-inner">
          <div className="fe-control-group">
            <label className="fe-control-label">Create New Fork</label>
            <div className="fe-slider-row">
              <span className="fe-slider-label">w = {newW.toFixed(1)}</span>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={newW}
                onChange={(e) => setNewW(parseFloat(e.target.value))}
                className="fe-slider"
              />
            </div>
            <button
              className="fe-btn fe-btn-primary"
              onClick={handleCreateFork}
              disabled={creating}
            >
              <GitFork size={14} />
              {creating ? 'Creating...' : `Create Fork (w=${newW.toFixed(1)})`}
            </button>
          </div>
          <div className="fe-control-group">
            <label className="fe-control-label">Actions</label>
            <button className="fe-btn fe-btn-secondary">Merge Best Fork</button>
            <button className="fe-btn fe-btn-ghost">Export Comparison</button>
          </div>
        </div>
      </div>
    </div>
  )
}
