import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Globe, FlaskConical, ListChecks, Scale, GitFork,
  Gavel, Users, Briefcase, Layers, BookOpen, Settings,
  ChevronDown, Plus,
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
  const projects = useProjectStore((s) => s.projects)
  const currentId = useProjectStore((s) => s.currentId)
  const setCurrent = useProjectStore((s) => s.setCurrent)
  const connected = useEventStore((s) => s.connected)
  const navigate = useNavigate()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentProject = projects.find((p) => p.id === currentId)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function projectPath(base: string) {
    return currentId ? `/projects/${currentId}${base}` : base
  }

  function handleSelectProject(id: string) {
    setCurrent(id)
    setDropdownOpen(false)
  }

  function handleNewProject() {
    setDropdownOpen(false)
    navigate('/')
  }

  return (
    <nav className={`side-rail ${open ? 'open' : ''}`}>
      <div className="rail-scroll">
        {/* Workspace switcher */}
        <div className="workspace-switcher" ref={dropdownRef}>
          <button
            className="workspace-switcher-btn"
            onClick={() => setDropdownOpen((o) => !o)}
          >
            <div className="workspace-switcher-indicator" />
            <span className="workspace-switcher-label">
              {currentProject ? currentProject.title : 'No project selected'}
            </span>
            <ChevronDown
              size={14}
              className={`workspace-switcher-chevron ${dropdownOpen ? 'rotated' : ''}`}
            />
          </button>

          {dropdownOpen && (
            <div className="workspace-switcher-dropdown">
              {projects.length === 0 && (
                <div className="workspace-switcher-empty">No projects yet</div>
              )}
              {projects.map((p) => (
                <button
                  key={p.id}
                  className={`workspace-switcher-option ${p.id === currentId ? 'selected' : ''}`}
                  onClick={() => handleSelectProject(p.id)}
                >
                  <span className="workspace-switcher-option-dot" />
                  <span className="workspace-switcher-option-title">{p.title}</span>
                  {p.status && (
                    <span className="workspace-switcher-option-status">{p.status}</span>
                  )}
                </button>
              ))}
              <button
                className="workspace-switcher-option workspace-switcher-new"
                onClick={handleNewProject}
              >
                <Plus size={14} />
                <span>New Project</span>
              </button>
            </div>
          )}
        </div>

        {/* Workspace section first */}
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

        {/* Research section second */}
        <div className="rail-section">
          <div className="rail-label">Research</div>
          {NAV_ITEMS.map(({ to, icon: Icon, label, project }) => {
            const disabled = project && !currentId
            if (disabled) {
              return (
                <span
                  key={to}
                  className="rail-nav-item--disabled"
                  title="Select a project first"
                >
                  <Icon size={16} />
                  {label}
                </span>
              )
            }
            return (
              <NavLink
                key={to}
                to={project ? projectPath(to) : to}
                className={({ isActive }) => `rail-nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <Icon size={16} />
                {label}
              </NavLink>
            )
          })}
        </div>
      </div>

      <div className="rail-bottom">
        <span className={`connection-dot ${connected ? 'connected' : 'disconnected'}`} />
        <span>{connected ? 'Live' : 'Disconnected'}</span>
      </div>
    </nav>
  )
}
