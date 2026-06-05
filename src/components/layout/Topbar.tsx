import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, BookOpen } from 'lucide-react'
import { getGoogleUser, isLinkedAccount } from '../../utils/auth'
import styles from './Topbar.module.css'

export function Topbar() {
  const navigate = useNavigate()
  const [searchValue, setSearchValue] = useState('')
  const [focused, setFocused] = useState(false)

  const googleUser = getGoogleUser()
  const linked = isLinkedAccount()

  const fallbackLetter = googleUser?.name ? googleUser.name.charAt(0).toUpperCase() : 'U'

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = searchValue.trim()
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
  }

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <div className={styles.logo}>S</div>
        <form className={`${styles.search} ${focused ? styles.searchFocused : ''}`} onSubmit={handleSearchSubmit}>
          <Search size={14} color="rgba(255,255,255,0.4)" strokeWidth={2} />
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search flashcards"
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </form>
      </div>
      <div className={styles.right}>
        <button className={styles.create} title="Coming soon" disabled>
          <Plus size={18} strokeWidth={2} />
        </button>
        {linked && (
          <button
            className={styles.teacherBtn}
            onClick={() => navigate('/teacher')}
            title="Teacher Panel"
          >
            <BookOpen size={18} strokeWidth={2} />
          </button>
        )}
        <div
          className={styles.avatar}
          onClick={() => navigate(linked ? '/profile' : '/login')}
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
