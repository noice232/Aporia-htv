import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import '../styles/agenda.css'

interface Task {
  id: string
  title: string
  description: string
  priority: number
  status: 'completed' | 'in_progress' | 'queued' | 'blocked'
  agent: 'scanner' | 'experimenter' | 'evaluator'
  dependencies: string[]
  createdAt: string
  progress?: number
}

const MOCK_TASKS: Task[] = [
  { id: 'T-001', title: 'Survey NeRF baselines', description: 'Scan arXiv for NeRF papers 2023-2024, extract key metrics and architectures', priority: 0, status: 'completed', agent: 'scanner', dependencies: [], createdAt: '2024-10-17T08:00:00Z' },
  { id: 'T-002', title: 'Benchmark instant-ngp', description: 'Run instant-ngp on Blender synthetic dataset, collect PSNR/SSIM/LPIPS', priority: 0, status: 'completed', agent: 'experimenter', dependencies: ['T-001'], createdAt: '2024-10-17T09:30:00Z' },
  { id: 'T-003', title: 'Evaluate 3D Gaussian Splatting', description: 'Compare 3DGS rendering quality and speed against NeRF baselines', priority: 0, status: 'in_progress', agent: 'experimenter', dependencies: ['T-002'], createdAt: '2024-10-17T11:00:00Z', progress: 65 },
  { id: 'T-004', title: 'Analyze depth estimation gap', description: 'Investigate depth prediction accuracy difference between volumetric and point-based methods', priority: 1, status: 'in_progress', agent: 'evaluator', dependencies: ['T-002'], createdAt: '2024-10-17T12:00:00Z', progress: 30 },
  { id: 'T-005', title: 'Retrieve SuGaR + GOF papers', description: 'Semantic search for mesh extraction from Gaussians methods via Papier', priority: 1, status: 'queued', agent: 'scanner', dependencies: ['T-003'], createdAt: '2024-10-17T14:00:00Z' },
  { id: 'T-006', title: 'Design hybrid NeRF-GS pipeline', description: 'Propose architecture combining NeRF depth supervision with GS rendering', priority: 1, status: 'queued', agent: 'experimenter', dependencies: ['T-003', 'T-004'], createdAt: '2024-10-17T15:00:00Z' },
  { id: 'T-007', title: 'Write comparative analysis', description: 'Generate technical report comparing approaches across quality, speed, and memory metrics', priority: 2, status: 'blocked', agent: 'evaluator', dependencies: ['T-003', 'T-004', 'T-005'], createdAt: '2024-10-17T16:00:00Z' },
  { id: 'T-008', title: 'Human review checkpoint', description: 'Present findings for CFG guidance — human feedback redirects next research phase', priority: 0, status: 'queued', agent: 'evaluator', dependencies: ['T-006'], createdAt: '2024-10-17T17:00:00Z' },
]

const STATUS_ORDER: Task['status'][] = ['in_progress', 'queued', 'blocked', 'completed']

const STATUS_LABEL: Record<Task['status'], string> = {
  in_progress: 'In Progress',
  queued: 'Queued',
  blocked: 'Blocked',
  completed: 'Completed',
}

const STATUS_DOT_COLOR: Record<Task['status'], string> = {
  in_progress: 'var(--accent-cyan)',
  queued: 'var(--fg-dim)',
  blocked: 'var(--accent-red)',
  completed: 'var(--accent-green)',
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export default function Agenda() {
  const { projectId } = useParams()
  const [filter, setFilter] = useState<Task['status'] | 'all'>('all')

  const tasks = MOCK_TASKS

  const counts = useMemo(() => ({
    total: tasks.length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
  }), [tasks])

  const filtered = useMemo(() => {
    if (filter === 'all') return tasks
    return tasks.filter(t => t.status === filter)
  }, [tasks, filter])

  const grouped = useMemo(() => {
    const groups: Record<string, Task[]> = {}
    for (const status of STATUS_ORDER) {
      const items = filtered.filter(t => t.status === status)
      if (items.length > 0) groups[status] = items
    }
    return groups
  }, [filtered])

  return (
    <div className="agenda-container">
      <div className="agenda-label">Research Agenda</div>
      <h1 className="agenda-title">Executable Research Queue</h1>
      <p className="agenda-project">
        Project: <code>{projectId}</code>
      </p>

      <div className="agenda-stats">
        <div className="agenda-stat">
          <span className="agenda-stat-value total">{counts.total}</span> tasks
        </div>
        <div className="agenda-stat">
          <span className="agenda-stat-value progress">{counts.in_progress}</span> running
        </div>
        <div className="agenda-stat">
          <span className="agenda-stat-value done">{counts.completed}</span> done
        </div>
        {counts.blocked > 0 && (
          <div className="agenda-stat">
            <span className="agenda-stat-value blocked">{counts.blocked}</span> blocked
          </div>
        )}
      </div>

      <div className="agenda-controls">
        {(['all', ...STATUS_ORDER] as const).map(s => (
          <button
            key={s}
            className={`agenda-filter-btn ${filter === s ? 'active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s === 'all' ? 'All' : STATUS_LABEL[s]}
          </button>
        ))}
        <button className="agenda-add-btn">
          <Plus size={12} style={{ marginRight: 4, verticalAlign: -1 }} />
          Add Task
        </button>
      </div>

      {Object.entries(grouped).map(([status, items]) => (
        <div className="agenda-group" key={status}>
          <div className="agenda-group-header">
            <span className="agenda-group-dot" style={{ background: STATUS_DOT_COLOR[status as Task['status']] }} />
            <span className="agenda-group-label">{STATUS_LABEL[status as Task['status']]}</span>
            <span className="agenda-group-count">{items.length}</span>
          </div>
          <div className="agenda-cards">
            {items.map(task => (
              <div className="agenda-card" key={task.id}>
                <div className="agenda-card-priority">
                  <span className={`agenda-card-priority-badge p${task.priority}`}>P{task.priority}</span>
                  <span className="agenda-card-id">{task.id}</span>
                </div>

                <div className="agenda-card-body">
                  <div className="agenda-card-title">{task.title}</div>
                  <div className="agenda-card-desc">{task.description}</div>
                  <div className="agenda-card-meta">
                    <span className={`agenda-card-agent ${task.agent}`}>{task.agent}</span>
                    {task.dependencies.map(dep => (
                      <span className="agenda-card-dep" key={dep}>{dep}</span>
                    ))}
                    <span className="agenda-card-time">{formatTime(task.createdAt)}</span>
                  </div>
                  {task.progress !== undefined && (
                    <div className="agenda-progress-bar">
                      <div className="agenda-progress-fill" style={{ width: `${task.progress}%` }} />
                    </div>
                  )}
                </div>

                <div className="agenda-card-right">
                  <span className={`agenda-card-status ${task.status}`}>
                    {STATUS_LABEL[task.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
