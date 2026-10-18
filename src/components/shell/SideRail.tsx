import { NavLink } from 'react-router-dom'
import {
  Globe, FlaskConical, ListChecks, Scale, GitFork,
  Gavel, Users, User, Briefcase, Layers, BookOpen, Settings,
} from 'lucide-react'
import { useProjectStore } from '../../stores/projects'
import { useEventStore } from '../../stores/events'

const NAV_ITEMS = [
  { to: '/frontier', icon: Globe, label: 'FRONTIER' },
  { to: '/lab', icon: FlaskConical, label: 'Research Lab', project: true },
  { to: '/agenda', icon: ListChecks, label: 'Agenda', project: true },
  { to: '/judgments', icon: Scale, label: 'Judgments', project: true },
  { to: '/forks', icon: GitFork, label: 'Forks', project: true },
  { to: '/court', icon: Gavel, label: 'PARALLAX Court', project: true },
] as const

const GLOBAL_NAV = [
  { to: '/team', icon: Users, label: 'Team' },
  { to: '/portfolio', icon: Briefcase, label: 'Portfolio' },
  { to: '/meta', icon: Layers, label: 'Meta' },
  { to: '/library', icon: BookOpen, label: 'Library' },
  { to: '/settings', icon: Settings, label: 'Settings' },
] as const

interface SideRailProps {
  open: boolean
  onClose: () => void
}

export function SideRail({ open, onClose }: SideRailProps) {
  const currentId = useProjectStore((s) => s.currentId)
  const connected = useEventStore((s) => s.connected)

  function projectPath(base: string) {
    return currentId ? `/projects/${currentId}${base}` : base
  }

  return (
    <nav className={`side-rail ${open ? 'open' : ''}`}>
      <div className="rail-scroll">
        <div className="rail-section">
          <div className="rail-label">Research</div>
          {NAV_ITEMS.map(({ to, icon: Icon, label, project }) => (
            <NavLink
              key={to}
              to={project ? projectPath(to) : to}
              className={({ isActive }) => `rail-nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </div>

        <div className="rail-section">
          <div className="rail-label">Workspace</div>
          {GLOBAL_NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `rail-nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </div>
      </div>

      <div className="rail-bottom">
        <span className={`connection-dot ${connected ? 'connected' : 'disconnected'}`} />
        <span>{connected ? 'Live' : 'Disconnected'}</span>
      </div>
    </nav>
  )
}
