import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWords } from '../hooks/useWords'
import { fetchSetMeta } from '../api/client'
import { ModeCard } from '../components/ui/ModeCard'
import { Toast } from '../components/ui/Toast'
import styles from './SetPage.module.css'

const MODES = [
  { id: 'flashcards', icon: '🃏', label: 'Flashcards', color: 'var(--mode-flashcards)' },
  { id: 'learn',      icon: '🔄', label: 'Learn',      color: 'var(--mode-learn)' },
  { id: 'test',       icon: '📝', label: 'Test',       color: 'var(--mode-test)' },
  { id: 'blocks',     icon: '⊞',  label: 'Blocks',     color: 'var(--mode-blocks)' },
  { id: 'blast',      icon: '🚀', label: 'Blast',      color: 'var(--mode-blast)' },
  { id: 'match',      icon: '🔀', label: 'Match',      color: 'var(--mode-match)' },
] as const

export function SetPage() {
  const { setId } = useParams<{ setId: string }>()
  const navigate = useNavigate()
  const { words, loading } = useWords(setId ?? null)
  const [setName, setSetName] = useState<string | null>(null)
  const [metaLoading, setMetaLoading] = useState(false)

  useEffect(() => {
    if (!setId) return
    setMetaLoading(true)
    fetchSetMeta(setId)
      .then(meta => setSetName(meta.name))
      .catch(() => setSetName(null))
      .finally(() => setMetaLoading(false))
  }, [setId])

  if (loading) return <div className={styles.loading}>Loading…</div>

  const displayTitle = metaLoading
    ? null
    : (setName ?? setId?.replace(/^vs-/, '').replace(/-/g, ' ') ?? '')

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          {displayTitle === null
            ? <span className={styles.titleSkeleton} />
            : displayTitle}
        </h1>
        <div className={styles.actions}>
          <button className={styles.actionBtn}>🔖 Save</button>
          <button className={styles.actionBtn}>📊 Groups</button>
          <button className={styles.actionBtn}>⬆ Share</button>
          <button className={styles.actionBtn}>···</button>
        </div>
      </div>
      <p className={styles.meta}>{words.length} terms</p>

      <div className={styles.modeGrid}>
        {MODES.map(m => (
          <ModeCard
            key={m.id}
            icon={m.icon}
            label={m.label}
            color={m.color}
            locked={false}
            onClick={() => navigate(`/set/${setId}/${m.id}`)}
          />
        ))}
      </div>

      <div className={styles.flashcard}>
        <div className={styles.cardTop}>
          <span className={styles.hint}>📍 Show hint</span>
          <div className={styles.cardActions}>
            <button>🔊</button>
            <button>⭐</button>
          </div>
        </div>
        <div className={styles.cardBody}>{words[0]?.word_en ?? '—'}</div>
        <div className={styles.cardBottom}>
          <span className={styles.trackLabel}>Track progress</span>
          <div className={styles.cardNav}>
            <button className={styles.navBtn}>‹</button>
            <span>1 / {words.length}</span>
            <button className={styles.navBtn}>›</button>
          </div>
        </div>
      </div>

      <div className={styles.termSection}>
        <div className={styles.termHeader}>
          <h2>Terms in set ({words.length})</h2>
          <button className={styles.statsBtn}>Your statistics ▼</button>
        </div>
        {words.map(w => (
          <div key={w.id} className={styles.termCard}>
            <span className={styles.termEn}>{w.word_en}</span>
            <span className={styles.divider}>|</span>
            <span className={styles.termUk}>{w.word_uk ?? '—'}</span>
            <div className={styles.termActions}>
              {w.audio_url && (
                <button onClick={() => new Audio(w.audio_url!).play()}>🔊</button>
              )}
              <button>⭐</button>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.stickyBar}>
        <button className={styles.stickyBtn}>Hide definitions</button>
        <button className={styles.stickyBtn}>Repeat with activity ▼</button>
      </div>
    </div>
  )
}
