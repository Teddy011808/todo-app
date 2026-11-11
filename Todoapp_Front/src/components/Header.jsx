import { getInitials } from '../constants'
import { CheckIcon, ListIcon, LogoutIcon, UserIcon } from './Icons'
import Tabs from './Tabs'

function Header({ user, activeTab, onTabChange, todoCount, onLogout }) {
  return (
    <header className="topbar">
      <div className="topbar-inner container">
        <div className="brand">
          <span className="brand-logo">
            <CheckIcon size={18} strokeWidth={3} />
          </span>
          <span className="brand-name">My Todos</span>
        </div>

        <Tabs
          tabs={[
            { value: 'todos', label: 'Tasks', icon: <ListIcon size={16} />, count: todoCount },
            { value: 'profile', label: 'Profile', icon: <UserIcon size={16} /> },
          ]}
          activeTab={activeTab}
          onChange={onTabChange}
        />

        <div className="topbar-actions">
          <button className="user-chip" onClick={() => onTabChange('profile')} title="Open profile">
            <span className="user-chip-name">{user.displayName || 'Guest'}</span>
            <span className="avatar">{getInitials(user.displayName)}</span>
          </button>
          <button className="logout-btn" onClick={onLogout} title="Log out" aria-label="Log out">
            <LogoutIcon size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
