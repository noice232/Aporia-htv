import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { GitFork } from 'lucide-react'
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

const MOCK_FORKS: ForkData[] = [
  {
    id: 'fork-a',
    label: 'Autonomous',
    w: 0.0,
    status: 'completed',
    duration: '2h 14m',
    papersExplored: 23,
    experimentsRun: 8,
    metrics: { psnr: 28.4, ssim: 0.934, lpips: 0.089, trainTime: '134m', memory: '8.2 GB' },
    topAction: 'Explored neural opacity fields',
    verdict: 'Broad exploration, lower peak quality',
    color: 'var(--accent-cyan)',
    steps: ['Survey NeRF baselines', 'Benchmark instant-ngp', 'Explore opacity fields', 'Multi-scale hash ablation', 'Test on synthetic scenes', 'NerfAcc integration', 'View synthesis eval', 'Report generation'],
  },
  {
    id: 'fork-b',
    label: 'Guided',
    w: 1.4,
    status: 'completed',
    duration: '1h 47m',
    papersExplored: 15,
    experimentsRun: 12,
    metrics: { psnr: 31.2, ssim: 0.961, lpips: 0.042, trainTime: '107m', memory: '6.8 GB' },
    topAction: 'Depth-supervised Gaussian splatting',
    verdict: 'Focused search, higher peak quality',
    color: 'var(--accent-lavender)',
    steps: ['Survey NeRF baselines', 'Benchmark instant-ngp', 'Depth regularization', '3DGS training', 'SuGaR mesh extraction', 'Real-time render opt', 'Consumer GPU test', 'Ablation study', 'Multi-view eval', 'GOF comparison', 'Final benchmarks', 'Report generation'],
  },
  {
    id: 'fork-c',
    label: 'Strong CFG',
    w: 2.0,
    status: 'running',
    duration: '43m',
    papersExplored: 8,
    experimentsRun: 5,
    metrics: { psnr: 29.8, ssim: 0.949, lpips: 0.058, trainTime: '43m', memory: '5.1 GB' },
    topAction: 'Per-pixel confidence weighting',
    verdict: 'Narrowest search, novel approach',
    color: 'var(--accent-fuchsia)',
    steps: ['Survey NeRF baselines', 'Benchmark instant-ngp', 'Per-pixel confidence', 'Adaptive density ctrl', 'Confidence-weighted GS'],
  },
]

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
  const [selectedForks, setSelectedForks] = useState<Set<string>>(
    new Set(MOCK_FORKS.map((f) => f.id))
  )

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

  const visibleForks = MOCK_FORKS.filter((f) => selectedForks.has(f.id))
  const maxSteps = Math.max(...MOCK_FORKS.map((f) => f.steps.length))

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

      {/* Branch Timeline */}
      <div className="fe-timeline">
        <div className="fe-timeline-title">Branch Timeline</div>
        <div className="fe-timeline-graph">
          <div className="fe-timeline-base">
            <span className="fe-timeline-dot fe-timeline-dot-base" />
            <span className="fe-timeline-base-label">Base</span>
          </div>
          <div className="fe-timeline-branches">
            {MOCK_FORKS.map((fork) => (
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

      {/* Fork Cards */}
      <div className="fe-cards">
        {MOCK_FORKS.map((fork) => (
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
                <span className="fe-stat-label">Papers</span>
              </div>
              <div className="fe-stat">
                <span className="fe-stat-value">{fork.experimentsRun}</span>
                <span className="fe-stat-label">Experiments</span>
              </div>
            </div>

            <div className="fe-card-metrics">
              <div className="fe-metric-row">
                <span className="fe-metric-label">PSNR</span>
                <span className="fe-metric-value">{fork.metrics.psnr} <span className="fe-metric-unit">dB</span></span>
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

            <div className="fe-card-action">
              <span className="fe-action-label">Top action</span>
              <span className="fe-action-text">{fork.topAction}</span>
            </div>

            <div className="fe-card-verdict">{fork.verdict}</div>
          </div>
        ))}
      </div>

      {/* Metric Comparison */}
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

          {/* Training Time & Memory as text comparison */}
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

      {/* Decision Path Diff */}
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
            <button className="fe-btn fe-btn-primary">
              <GitFork size={14} />
              Create Fork (w={newW.toFixed(1)})
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
