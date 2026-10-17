import { getInitials } from '../constants'
import { CheckIcon, ListIcon, UserIcon } from './Icons'
import Tabs from './Tabs'

function Header({ user, activeTab, onTabChange, todoCount }) {
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

        <button className="user-chip" onClick={() => onTabChange('profile')} title="Open profile">
          <span className="user-chip-name">{user.displayName || 'Guest'}</span>
          <span className="avatar">{getInitials(user.displayName)}</span>
        </button>
      </div>
    </header>
  )
}

export default Header
