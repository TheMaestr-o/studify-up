import { useSets } from '../hooks/useSets'
import styles from './HomePage.module.css'

export function HomePage() {
  const userId = Number(localStorage.getItem('userId')) || null
  const { sets, loading } = useSets(userId)

  if (!userId) {
    return (
      <div className={styles.empty}>
        <h2>Welcome to Studify Up</h2>
        <p>Sign in with Telegram to access your vocabulary sets.</p>
        <p className={styles.hint}>Enter your Telegram user ID in localStorage: <code>userId</code></p>
      </div>
    )
  }

  if (loading) return <div className={styles.loading}>Loading sets…</div>

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Your Sets</h1>
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
