import { useState } from 'react'
import { useParams } from 'react-router-dom'
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

const MOCK_RUNS: ExperimentRun[] = [
  {
    id: 'run-006',
    runNum: 6,
    hypothesis: '3DGS with depth-supervised loss + adaptive density control',
    status: 'running',
    metrics: [
      { name: 'PSNR', value: 31.42, unit: 'dB', sparkline: [24.1,25.3,26.8,27.2,27.9,28.4,28.8,29.1,29.5,29.8,30.0,30.2,30.5,30.7,30.9,31.0,31.1,31.2,31.3,31.42] },
      { name: 'SSIM', value: 0.961, unit: '', sparkline: [0.82,0.85,0.88,0.90,0.91,0.92,0.93,0.935,0.94,0.945,0.948,0.95,0.952,0.954,0.956,0.957,0.958,0.959,0.960,0.961] },
      { name: 'Loss', value: 0.0031, unit: '', sparkline: [0.12,0.08,0.06,0.045,0.035,0.028,0.022,0.018,0.015,0.013,0.011,0.009,0.008,0.007,0.006,0.005,0.0045,0.004,0.0035,0.0031] },
    ],
    startedAt: '2024-10-18T02:14:00Z',
    duration: '47m 23s',
    config: { lr: 0.0005, epochs: 80, batch_size: 4096, sh_degree: 3 },
  },
  {
    id: 'run-005',
    runNum: 5,
    hypothesis: 'Gaussian splatting baseline with SH degree 3',
    status: 'completed',
    metrics: [
      { name: 'PSNR', value: 29.84, unit: 'dB', sparkline: [22.0,24.1,25.5,26.3,27.0,27.5,27.9,28.2,28.5,28.7,28.9,29.0,29.2,29.3,29.4,29.5,29.6,29.7,29.8,29.84] },
      { name: 'SSIM', value: 0.948, unit: '', sparkline: [0.78,0.82,0.85,0.87,0.89,0.90,0.91,0.92,0.925,0.93,0.933,0.936,0.939,0.941,0.943,0.944,0.945,0.946,0.947,0.948] },
      { name: 'Loss', value: 0.0048, unit: '', sparkline: [0.15,0.10,0.07,0.05,0.04,0.032,0.026,0.021,0.018,0.015,0.013,0.011,0.010,0.009,0.008,0.007,0.006,0.0055,0.005,0.0048] },
    ],
    startedAt: '2024-10-18T01:12:00Z',
    duration: '52m 08s',
    config: { lr: 0.001, epochs: 60, batch_size: 4096, sh_degree: 3 },
  },
  {
    id: 'run-004',
    runNum: 4,
    hypothesis: 'NeRF with hash encoding (InstantNGP style)',
    status: 'completed',
    metrics: [
      { name: 'PSNR', value: 28.11, unit: 'dB', sparkline: [20.5,22.3,23.8,24.9,25.6,26.1,26.5,26.8,27.0,27.2,27.4,27.5,27.6,27.7,27.8,27.9,27.95,28.0,28.05,28.11] },
      { name: 'SSIM', value: 0.932, unit: '', sparkline: [0.74,0.78,0.82,0.85,0.87,0.88,0.89,0.90,0.905,0.91,0.914,0.918,0.921,0.924,0.926,0.928,0.929,0.930,0.931,0.932] },
      { name: 'Loss', value: 0.0072, unit: '', sparkline: [0.20,0.14,0.10,0.08,0.06,0.05,0.04,0.033,0.028,0.024,0.020,0.017,0.015,0.013,0.012,0.010,0.009,0.008,0.0075,0.0072] },
    ],
    startedAt: '2024-10-17T22:05:00Z',
    duration: '1h 38m',
    config: { lr: 0.001, epochs: 100, batch_size: 1024, levels: 16 },
  },
  {
    id: 'run-003',
    runNum: 3,
    hypothesis: 'NeRF baseline + positional encoding depth 10',
    status: 'completed',
    metrics: [
      { name: 'PSNR', value: 26.53, unit: 'dB', sparkline: [18.2,20.1,21.5,22.5,23.2,23.8,24.2,24.5,24.8,25.0,25.2,25.4,25.6,25.7,25.9,26.0,26.1,26.2,26.4,26.53] },
      { name: 'SSIM', value: 0.908, unit: '', sparkline: [0.68,0.73,0.77,0.80,0.82,0.84,0.85,0.86,0.87,0.88,0.885,0.89,0.893,0.896,0.899,0.901,0.903,0.905,0.907,0.908] },
      { name: 'Loss', value: 0.0124, unit: '', sparkline: [0.30,0.22,0.17,0.13,0.10,0.08,0.065,0.05,0.042,0.036,0.031,0.027,0.024,0.021,0.019,0.017,0.016,0.015,0.013,0.0124] },
    ],
    startedAt: '2024-10-17T19:30:00Z',
    duration: '2h 12m',
    config: { lr: 0.0005, epochs: 200, batch_size: 1024, depth: 10 },
  },
  {
    id: 'run-002',
    runNum: 2,
    hypothesis: 'NeRF coarse-to-fine with hierarchical sampling',
    status: 'failed',
    metrics: [
      { name: 'PSNR', value: 19.87, unit: 'dB', sparkline: [15.0,16.2,17.0,17.5,18.0,18.3,18.6,18.9,19.1,19.3,19.5,19.6,19.7,19.8,19.8,19.85,19.87,19.87,19.87,19.87] },
      { name: 'SSIM', value: 0.741, unit: '', sparkline: [0.55,0.60,0.63,0.66,0.68,0.69,0.70,0.71,0.72,0.725,0.73,0.733,0.736,0.738,0.739,0.740,0.740,0.741,0.741,0.741] },
      { name: 'Loss', value: 0.0891, unit: '', sparkline: [0.40,0.32,0.26,0.22,0.19,0.17,0.15,0.14,0.13,0.12,0.115,0.11,0.105,0.10,0.098,0.095,0.093,0.091,0.090,0.0891] },
    ],
    startedAt: '2024-10-17T16:45:00Z',
    duration: '1h 04m',
    config: { lr: 0.01, epochs: 150, batch_size: 512, samples_coarse: 64 },
  },
  {
    id: 'run-001',
    runNum: 1,
    hypothesis: 'Vanilla NeRF baseline (Mildenhall et al.)',
    status: 'completed',
    metrics: [
      { name: 'PSNR', value: 25.12, unit: 'dB', sparkline: [16.0,18.5,20.0,21.2,22.0,22.6,23.0,23.4,23.7,23.9,24.1,24.3,24.4,24.5,24.6,24.7,24.8,24.9,25.0,25.12] },
      { name: 'SSIM', value: 0.891, unit: '', sparkline: [0.62,0.68,0.72,0.75,0.78,0.80,0.82,0.83,0.84,0.85,0.86,0.865,0.87,0.875,0.88,0.883,0.886,0.888,0.890,0.891] },
      { name: 'Loss', value: 0.0183, unit: '', sparkline: [0.35,0.28,0.22,0.18,0.15,0.12,0.10,0.08,0.07,0.06,0.05,0.045,0.04,0.035,0.03,0.027,0.024,0.022,0.020,0.0183] },
    ],
    startedAt: '2024-10-17T14:00:00Z',
    duration: '2h 31m',
    config: { lr: 0.0005, epochs: 300, batch_size: 1024, depth: 8 },
  },
]

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

  const activeRun = MOCK_RUNS.find((r) => r.status === 'running') || MOCK_RUNS[0]
  const historyRuns = MOCK_RUNS.filter((r) => r.id !== activeRun.id)

  return (
    <div className="page-content">
      <div className="lab-header-label">Research Lab</div>
      <h1 style={{ marginBottom: 8 }}>Experiment Control Room</h1>
      <p className="lab-subtitle">
        Project: <code style={{ color: 'var(--accent-icy)' }}>{projectId}</code>
      </p>

      <div className="lab-layout">
        <div>
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
          </div>

          {/* Run History */}
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
