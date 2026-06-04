import { NavLink } from 'react-router-dom'
import { Home, FolderOpen, Users, Bell, Plus, BookOpen } from 'lucide-react'
import styles from './Sidebar.module.css'

const ITEMS = [
  { Icon: Home,       to: '/',              label: 'Home' },
  { Icon: FolderOpen, to: '/library',       label: 'Library' },
  { Icon: Users,      to: '/groups',        label: 'Groups' },
  { Icon: Bell,       to: '/notifications', label: 'Notifications' },
]

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      {ITEMS.map(({ Icon, to, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => `${styles.icon} ${isActive ? styles.active : ''}`}
          title={label}
        >
          <Icon size={20} strokeWidth={1.8} />
        </NavLink>
      ))}
      <div style={{ flex: 1 }} />
      <button className={styles.icon} title="Create">
        <Plus size={20} strokeWidth={1.8} />
      </button>
      <button className={styles.icon} title="Cards">
        <BookOpen size={20} strokeWidth={1.8} />
      </button>
    </aside>
  )
}
