import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWords } from '../hooks/useWords'
import { fetchSetMeta } from '../api/client'
import { ModeCard } from '../components/ui/ModeCard'
import { Toast } from '../components/ui/Toast'
import { Skeleton } from '../components/ui/Skeleton'
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
  const [toastVisible, setToastVisible] = useState(false)
  const [previewIdx, setPreviewIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    if (!setId) return
    setMetaLoading(true)
    fetchSetMeta(setId)
      .then(meta => setSetName(meta.name))
      .catch(() => setSetName(null))
      .finally(() => setMetaLoading(false))
  }, [setId])

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setToastVisible(true)
      setTimeout(() => setToastVisible(false), 2000)
    })
  }

  if (loading) return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Skeleton width="200px" height="32px" borderRadius="8px" />
        <div className={styles.actions}>
          <Skeleton width="72px" height="34px" borderRadius="6px" />
          <Skeleton width="82px" height="34px" borderRadius="6px" />
          <Skeleton width="72px" height="34px" borderRadius="6px" />
          <Skeleton width="40px" height="34px" borderRadius="6px" />
        </div>
      </div>
      <Skeleton width="80px" height="16px" borderRadius="4px" />
      <div className={styles.modeGrid} style={{ marginTop: '24px' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} height="72px" borderRadius="10px" />
        ))}
      </div>
      <div className={styles.termSection}>
        <div className={styles.termHeader}>
          <Skeleton width="160px" height="20px" borderRadius="4px" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={styles.termCard} style={{ padding: 0 }}>
            <Skeleton height="50px" borderRadius="8px" />
          </div>
        ))}
      </div>
    </div>
  )

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
          <button className={styles.actionBtn} onClick={handleShare}>⬆ Share</button>
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
        <div
          className={styles.cardBody}
          onClick={() => setFlipped(f => !f)}
          style={{ cursor: 'pointer' }}
        >
          {flipped
            ? (words[previewIdx]?.word_uk ?? '—')
            : (words[previewIdx]?.word_en ?? '—')}
        </div>
        <div className={styles.cardBottom}>
          <span className={styles.trackLabel}>Track progress</span>
          <div className={styles.cardNav}>
            <button
              className={styles.navBtn}
              onClick={() => { setPreviewIdx(i => Math.max(0, i - 1)); setFlipped(false) }}
            >‹</button>
            <span>{previewIdx + 1} / {words.length}</span>
            <button
              className={styles.navBtn}
              onClick={() => { setPreviewIdx(i => Math.min(words.length - 1, i + 1)); setFlipped(false) }}
            >›</button>
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

      <Toast message="Copied!" visible={toastVisible} />
    </div>
  )
}
