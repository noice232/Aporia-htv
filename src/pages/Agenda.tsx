import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { listAgenda } from '../api/client'
import type { AgendaItem } from '../api/client'
import '../styles/agenda.css'

interface Task {
  id: string
  title: string
  description: string
  priority: number
  status: 'completed' | 'in_progress' | 'queued' | 'blocked'
  agent: string
  dependencies: string[]
  createdAt: string
  progress?: number
}

function mapAgendaItem(item: AgendaItem): Task {
  const raw = item as unknown as Record<string, unknown>
  const statusMap: Record<string, Task['status']> = {
    completed: 'completed',
    in_progress: 'in_progress',
    running: 'in_progress',
    queued: 'queued',
    pending: 'queued',
    blocked: 'blocked',
  }
  return {
    id: item.id,
    title: (raw.question as string) || (raw.title as string) || item.id,
    description: (raw.description as string) || '',
    priority: item.priority ?? 0,
    status: statusMap[item.status] || 'queued',
    agent: (raw.agent_type as string) || 'scanner',
    dependencies: (raw.depends_on as string[]) || [],
    createdAt: (raw.created_at as string) || new Date().toISOString(),
    progress: raw.progress as number | undefined,
  }
}

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
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAgenda = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const items = await listAgenda(projectId)
      setTasks((items as AgendaItem[]).map(mapAgendaItem))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agenda')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { fetchAgenda() }, [fetchAgenda])

  if (!projectId) {
    return (
      <div className="agenda-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--fg-dim)', fontSize: 13 }}>
          Select a project to view the Research Agenda
        </div>
      </div>
    )
  }

  if (loading && tasks.length === 0) {
    return (
      <div className="agenda-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--fg-dim)', fontSize: 13 }}>Loading agenda...</div>
      </div>
    )
  }

  const counts = {
    total: tasks.length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
  }

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)

  const grouped: Record<string, Task[]> = {}
  for (const status of STATUS_ORDER) {
    const items = filtered.filter(t => t.status === status)
    if (items.length > 0) grouped[status] = items
  }

  return (
    <div className="agenda-container">
      <div className="agenda-label">Research Agenda</div>
      <h1 className="agenda-title">Executable Research Queue</h1>
      <p className="agenda-project">
        Project: <code>{projectId}</code>
      </p>

      {error && (
        <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid var(--accent-red)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, color: 'var(--accent-red)', marginBottom: 16 }}>
          {error}
        </div>
      )}

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

      {tasks.length === 0 && !loading && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 40, textAlign: 'center', color: 'var(--fg-dim)', fontSize: 13 }}>
          No agenda items yet. Start a research run to populate the queue.
        </div>
      )}

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
