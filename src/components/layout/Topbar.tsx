import { useNavigate } from 'react-router-dom'
import { Search, Plus } from 'lucide-react'
import styles from './Topbar.module.css'

export function Topbar() {
  const navigate = useNavigate()
  const googleUser = JSON.parse(localStorage.getItem('googleUser') ?? 'null') as {
    name?: string
    picture?: string
  } | null

  const fallbackLetter = googleUser?.name ? googleUser.name.charAt(0).toUpperCase() : 'U'

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <div className={styles.logo}>S</div>
        <div className={styles.search}>
          <Search size={14} color="rgba(255,255,255,0.4)" strokeWidth={2} />
          <span className={styles.placeholder}>Search flashcards</span>
        </div>
      </div>
      <div className={styles.right}>
        <button className={styles.create} title="Create">
          <Plus size={18} strokeWidth={2} />
        </button>
        <div
          className={styles.avatar}
          onClick={() => navigate('/login')}
          title={googleUser?.name ?? 'Account'}
        >
          {googleUser?.picture ? (
            <img
              src={googleUser.picture}
              alt={fallbackLetter}
              className={styles.avatarImg}
              referrerPolicy="no-referrer"
            />
          ) : (
            fallbackLetter
          )}
        </div>
      </div>
    </header>
  )
}
