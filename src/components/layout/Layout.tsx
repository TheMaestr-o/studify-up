import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Topbar } from './Topbar'
import { Sidebar } from './Sidebar'
import styles from './Layout.module.css'

function BottomNav() {
  const navigate = useNavigate()
  const googleUser = JSON.parse(localStorage.getItem('googleUser') ?? 'null') as {
    name?: string; picture?: string
  } | null
  const fallback = googleUser?.name ? googleUser.name.charAt(0).toUpperCase() : 'U'

  return (
    <nav className={styles.bottomNav}>
      <NavLink to="/" end className={({ isActive }) => `${styles.bnBtn} ${isActive ? styles.bnActive : ''}`}>🏠</NavLink>
      <button className={styles.bnBtn} onClick={() => navigate(-1)}>←</button>
      <NavLink to="/search" className={({ isActive }) => `${styles.bnBtn} ${isActive ? styles.bnActive : ''}`}>🔍</NavLink>
      <button className={styles.bnBtn} onClick={() => navigate('/login')} title={googleUser?.name ?? 'Account'}>
        {googleUser?.picture
          ? <img src={googleUser.picture} alt={fallback} style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
          : <span className={styles.bnAvatar}>{fallback}</span>
        }
      </button>
    </nav>
  )
}

export function Layout() {
  return (
    <div className={styles.root}>
      <Topbar />
      <div className={styles.body}>
        <Sidebar />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
