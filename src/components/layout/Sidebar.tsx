import { NavLink } from 'react-router-dom'
import styles from './Sidebar.module.css'

const ITEMS = [
  { icon: '🏠', to: '/', label: 'Home' },
  { icon: '📁', to: '/library', label: 'Library' },
  { icon: '👥', to: '/groups', label: 'Groups' },
  { icon: '🔔', to: '/notifications', label: 'Notifications' },
]

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      {ITEMS.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) => `${styles.icon} ${isActive ? styles.active : ''}`}
          title={item.label}
        >
          {item.icon}
        </NavLink>
      ))}
      <div style={{ flex: 1 }} />
      <button className={styles.icon} title="Create">➕</button>
      <button className={styles.icon} title="Cards">🃏</button>
    </aside>
  )
}
