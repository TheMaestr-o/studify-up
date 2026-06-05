import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Home, Search, ArrowLeft, User } from 'lucide-react'
import { Topbar } from './Topbar'
import { Sidebar } from './Sidebar'
import { getGoogleUser, isLinkedAccount } from '../../utils/auth'
import styles from './Layout.module.css'

function BottomNav() {
  const navigate = useNavigate()
  const googleUser = getGoogleUser()
  const linked = isLinkedAccount()

  return (
    <nav className={styles.bottomNav}>
      <NavLink to="/" end className={({ isActive }) => `${styles.bnBtn} ${isActive ? styles.bnActive : ''}`}>
        <Home size={22} strokeWidth={1.8} />
      </NavLink>
      <button className={styles.bnBtn} onClick={() => navigate(-1)}>
        <ArrowLeft size={22} strokeWidth={1.8} />
      </button>
      <NavLink to="/search" className={({ isActive }) => `${styles.bnBtn} ${isActive ? styles.bnActive : ''}`}>
        <Search size={22} strokeWidth={1.8} />
      </NavLink>
      <button className={styles.bnBtn} onClick={() => navigate(linked ? '/profile' : '/login')} title={googleUser?.name ?? 'Account'}>
        {googleUser?.picture
          ? <img src={googleUser.picture} alt="" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
          : <User size={22} strokeWidth={1.8} />
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
