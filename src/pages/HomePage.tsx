import { useSets } from '../hooks/useSets'
import { Skeleton } from '../components/ui/Skeleton'
import styles from './HomePage.module.css'

export function HomePage() {
  const userId = Number(localStorage.getItem('userId')) || null
  const { sets, loading } = useSets(userId)

  function handleSignOut() {
    localStorage.removeItem('userId')
    localStorage.removeItem('googleUser')
    window.location.href = '/login'
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

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Your Sets</h1>
        <button className={styles.signOut} onClick={handleSignOut}>Sign out</button>
      </div>
      <div className={styles.grid}>
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
