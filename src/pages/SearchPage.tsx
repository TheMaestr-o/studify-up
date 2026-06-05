import { useState } from 'react'
import { Layers, ArrowRight } from 'lucide-react'
import { useSets } from '../hooks/useSets'
import { Skeleton } from '../components/ui/Skeleton'
import { STARTER_PACK_ID, STARTER_PACK_NAME, STARTER_WORDS } from '../data/starterPack'
import { getLinkedStudentId } from '../utils/auth'
import styles from './SearchPage.module.css'

export function SearchPage() {
  const initialQuery = new URLSearchParams(window.location.search).get('q') ?? ''
  const [query, setQuery] = useState(initialQuery)

  const userId = getLinkedStudentId()
  const { sets, loading } = useSets(userId)

  function handleQueryChange(value: string) {
    setQuery(value)
    const url = value ? `/search?q=${encodeURIComponent(value)}` : '/search'
    window.history.replaceState(null, '', url)
  }

  const q = query.toLowerCase()

  const showStarter =
    q === '' ||
    'starter'.includes(q) ||
    'english'.includes(q) ||
    q.includes('starter') ||
    q.includes('english') ||
    STARTER_PACK_NAME.toLowerCase().includes(q)

  const filteredSets = sets.filter(set => set.name.toLowerCase().includes(q))

  const hasResults = showStarter || filteredSets.length > 0

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Search</h1>
      </div>

      <div className={styles.inputWrap}>
        <input
          className={styles.input}
          type="text"
          placeholder="Search flashcard sets…"
          value={query}
          autoFocus
          onChange={e => handleQueryChange(e.target.value)}
        />
      </div>

      {loading ? (
        <div className={styles.grid}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height="100px" borderRadius="10px" />
          ))}
        </div>
      ) : !hasResults ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🔍</div>
          <div>No matches found for <strong>&ldquo;{query}&rdquo;</strong></div>
          <p className={styles.emptyHint}>Try searching with different keywords or browse all sets</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {showStarter && (
            <a href={`/set/${STARTER_PACK_ID}`} className={`${styles.card} ${styles.cardStarter}`}>
              <div className={styles.starterBadge}>Free for all</div>
              <div className={styles.cardTop}>
                <div className={styles.starterIconSmall}>
                  <Layers size={16} strokeWidth={1.8} color="#fff" />
                </div>
                <div>
                  <div className={styles.name}>{STARTER_PACK_NAME}</div>
                  <div className={styles.meta}>{STARTER_WORDS.length} terms</div>
                </div>
              </div>
              <ArrowRight size={16} color="rgba(255,255,255,0.3)" className={styles.arrow} />
            </a>
          )}

          {filteredSets.map(set => (
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
      )}
    </div>
  )
}
