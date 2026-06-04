import { NavLink } from 'react-router-dom'
import { Home, Plus, BookOpen } from 'lucide-react'
import styles from './Sidebar.module.css'

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <NavLink
        to="/"
        end
        className={({ isActive }) => `${styles.icon} ${isActive ? styles.active : ''}`}
        title="Home"
      >
        <Home size={20} strokeWidth={1.8} />
      </NavLink>
      <div style={{ flex: 1 }} />
      <button className={`${styles.icon} ${styles.disabled}`} title="Create — Coming soon" disabled>
        <Plus size={20} strokeWidth={1.8} />
      </button>
      <button className={`${styles.icon} ${styles.disabled}`} title="Cards — Coming soon" disabled>
        <BookOpen size={20} strokeWidth={1.8} />
      </button>
    </aside>
  )
}
