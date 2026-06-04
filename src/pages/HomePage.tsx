import { BookOpen, Layers, ArrowRight } from 'lucide-react'
import { useSets } from '../hooks/useSets'
import { Skeleton } from '../components/ui/Skeleton'
import { STARTER_PACK_ID, STARTER_PACK_NAME, STARTER_WORDS } from '../data/starterPack'
import styles from './HomePage.module.css'

export function HomePage() {
  const userId = Number(localStorage.getItem('userId')) || null
  const { sets, loading } = useSets(userId)

  function handleSignOut() {
    localStorage.removeItem('userId')
    localStorage.removeItem('googleUser')
    window.location.href = '/login'
  }

  function linkStudentId() {
    const id = prompt('Enter your Student ID:')
    if (id?.trim()) {
      localStorage.setItem('userId', id.trim())
      window.location.reload()
    }
  }

  if (loading) return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Your Sets</h1>
      </div>
      <div className={styles.grid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height="100px" borderRadius="10px" />
        ))}
      </div>
    </div>
  )

  const noSets = sets.length === 0

  if (noSets) return (
    <div className={styles.emptyPage}>
      <button className={styles.signOutTop} onClick={handleSignOut}>Sign out</button>

      <div className={styles.emptyCenter}>
        <BookOpen size={44} strokeWidth={1.2} color="rgba(255,255,255,0.15)" />
        <h2 className={styles.emptyTitle}>No sets assigned yet</h2>
        <p className={styles.emptyText}>Your teacher hasn't assigned any words yet.<br />Meanwhile, start with the free Starter Pack.</p>

        {localStorage.getItem('userId') === '0' && (
          <button className={styles.linkBtn} onClick={linkStudentId}>
            + Link Student ID
          </button>
        )}
      </div>

      {/* Starter Pack card */}
      <div className={styles.starterSection}>
        <p className={styles.starterLabel}>Start here</p>
        <a href={`/set/${STARTER_PACK_ID}`} className={styles.starterCard}>
          <div className={styles.starterIcon}>
            <Layers size={22} strokeWidth={1.8} color="#fff" />
          </div>
          <div className={styles.starterInfo}>
            <div className={styles.starterName}>{STARTER_PACK_NAME}</div>
            <div className={styles.starterMeta}>{STARTER_WORDS.length} essential words · Free for everyone</div>
          </div>
          <ArrowRight size={18} color="rgba(255,255,255,0.4)" />
        </a>
      </div>
    </div>
  )

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Your Sets</h1>
        <button className={styles.signOut} onClick={handleSignOut}>Sign out</button>
      </div>

      {/* Always show Starter Pack as first card */}
      <div className={styles.grid}>
        <a href={`/set/${STARTER_PACK_ID}`} className={`${styles.card} ${styles.cardStarter}`}>
          <div className={styles.starterBadge}>Free for all</div>
          <div className={styles.name}>{STARTER_PACK_NAME}</div>
          <div className={styles.meta}>{STARTER_WORDS.length} terms</div>
          <div className={styles.lang}>EN</div>
        </a>

        {sets.map(set => (
          <a key={set.id} href={`/set/${set.id}`} className={styles.card}>
            <div className={styles.name}>{set.name}</div>
            {set.word_count !== undefined && (
              <div className={styles.meta}>{set.word_count} terms</div>
            )}
            {set.language && (
              <div className={styles.lang}>{set.language.toUpperCase()}</div>
            )}
          </a>
        ))}
      </div>
    </div>
  )
}
