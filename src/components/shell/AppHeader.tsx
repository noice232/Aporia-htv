import { Bell, Search, Menu } from 'lucide-react'

interface AppHeaderProps {
  onMenuToggle?: () => void
}

export function AppHeader({ onMenuToggle }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="header-left">
        <button className="mobile-menu-btn header-icon-btn" onClick={onMenuToggle} aria-label="Menu">
          <Menu size={18} />
        </button>
        <div className="header-brand">
          <div className="brand-mark">
            <span /><span /><span />
          </div>
          APORIA
        </div>
        <button className="header-search">
          <Search size={14} />
          <span>Search papers, experiments...</span>
          <kbd>⌘K</kbd>
        </button>
      </div>
      <div className="header-right">
        <button className="header-icon-btn" aria-label="Notifications">
          <Bell size={16} />
        </button>
        <div className="header-avatar">S</div>
      </div>
    </header>
  )
}
