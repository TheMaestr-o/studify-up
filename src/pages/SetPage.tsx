import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layers, RefreshCw, ClipboardList, Grid3x3, Zap, Shuffle, Share2, Volume2, Star, Pin, ChevronRight } from 'lucide-react'
import { useWords } from '../hooks/useWords'
import { fetchSetMeta } from '../api/client'
import { playWord } from '../utils/audio'
import { STARTER_PACK_ID, STARTER_PACK_NAME, STARTER_WORDS } from '../data/starterPack'
import { isLinkedAccount } from '../utils/auth'
import { ModeCard } from '../components/ui/ModeCard'
import { Toast } from '../components/ui/Toast'
import { Skeleton } from '../components/ui/Skeleton'
import styles from './SetPage.module.css'

const MODES = [
  { id: 'flashcards', icon: <Layers size={15} strokeWidth={2} />,        label: 'Flashcards', color: 'var(--mode-flashcards)' },
  { id: 'learn',      icon: <RefreshCw size={15} strokeWidth={2} />,     label: 'Learn',      color: 'var(--mode-learn)' },
  { id: 'test',       icon: <ClipboardList size={15} strokeWidth={2} />, label: 'Test',       color: 'var(--mode-test)' },
  { id: 'blocks',     icon: <Grid3x3 size={15} strokeWidth={2} />,       label: 'Blocks',     color: 'var(--mode-blocks)' },
  { id: 'blast',      icon: <Zap size={15} strokeWidth={2} />,           label: 'Blast',      color: 'var(--mode-blast)' },
  { id: 'match',      icon: <Shuffle size={15} strokeWidth={2} />,       label: 'Match',      color: 'var(--mode-match)' },
] as const

export function SetPage() {
  const { setId } = useParams<{ setId: string }>()
  const navigate = useNavigate()
  const isStarter = setId === STARTER_PACK_ID
  const { words: apiWords, loading: apiLoading } = useWords(isStarter ? null : (setId ?? null))
  const words = isStarter ? STARTER_WORDS : apiWords
  const loading = isStarter ? false : apiLoading
  const [setName, setSetName] = useState<string | null>(isStarter ? STARTER_PACK_NAME : null)
  const [metaLoading, setMetaLoading] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const [previewIdx, setPreviewIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [starred, setStarred] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(`starred_${setId}`) ?? '[]')) }
    catch { return new Set() }
  })

  useEffect(() => {
    if (!setId || isStarter) return
    setMetaLoading(true)
    fetchSetMeta(setId)
      .then(meta => setSetName(meta.name))
      .catch(() => setSetName(null))
      .finally(() => setMetaLoading(false))
  }, [setId, isStarter])

  const toggleStar = (wordId: string) => {
    setStarred(prev => {
      const next = new Set(prev)
      if (next.has(wordId)) next.delete(wordId)
      else next.add(wordId)
      localStorage.setItem(`starred_${setId}`, JSON.stringify([...next]))
      return next
    })
  }

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
        <Skeleton width="36px" height="36px" borderRadius="8px" />
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

  const isLoggedIn = isLinkedAccount()
  const previewWord = words[previewIdx]

  return (
    <div className={styles.page}>
      {!isLoggedIn && (
        <div className={styles.guestBanner}>
          <span>Sign in to track progress, study with all 6 modes, and sync with Telegram</span>
          <a href="/login" className={styles.guestCta}>Sign in free <ChevronRight size={13} strokeWidth={2} style={{ verticalAlign: 'middle' }} /></a>
        </div>
      )}

      <div className={styles.header}>
        <h1 className={styles.title}>
          {displayTitle === null ? <span className={styles.titleSkeleton} /> : displayTitle}
        </h1>
        <button className={styles.shareBtn} onClick={handleShare} title="Copy link">
          <Share2 size={16} strokeWidth={2} />
        </button>
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

      {/* Preview card */}
      <div className={styles.flashcard}>
        <div className={styles.cardTop}>
          <span className={styles.hint}>
            <Pin size={13} strokeWidth={2} color="var(--accent)" /> Show hint
          </span>
          <div className={styles.cardActions}>
            {previewWord?.audio_url && (
              <button
                className={styles.cardActionBtn}
                onClick={() => playWord(previewWord.word_en, previewWord.audio_url)}
                title="Play audio"
              >
                <Volume2 size={15} strokeWidth={2} />
              </button>
            )}
            <button
              className={`${styles.cardActionBtn} ${previewWord && starred.has(previewWord.id) ? styles.starActive : ''}`}
              onClick={() => previewWord && toggleStar(previewWord.id)}
              title="Star"
            >
              <Star size={15} strokeWidth={2} fill={previewWord && starred.has(previewWord.id) ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
        <div className={styles.cardBody} onClick={() => setFlipped(f => !f)} style={{ cursor: 'pointer' }}>
          {flipped ? (previewWord?.word_uk ?? '—') : (previewWord?.word_en ?? '—')}
        </div>
        <div className={styles.cardBottom}>
          <span className={styles.trackLabel}>Tap card to flip</span>
          <div className={styles.cardNav}>
            <button className={styles.navBtn} onClick={() => { setPreviewIdx(i => Math.max(0, i - 1)); setFlipped(false) }}>‹</button>
            <span>{previewIdx + 1} / {words.length}</span>
            <button className={styles.navBtn} onClick={() => { setPreviewIdx(i => Math.min(words.length - 1, i + 1)); setFlipped(false) }}>›</button>
          </div>
        </div>
      </div>

      {/* Term list */}
      <div className={styles.termSection}>
        <h2 className={styles.termTitle}>Terms in set ({words.length})</h2>
        {words.map(w => (
          <div key={w.id} className={styles.termCard}>
            <span className={styles.termEn}>{w.word_en}</span>
            <span className={styles.divider}>|</span>
            <span className={styles.termUk}>{w.word_uk ?? '—'}</span>
            <div className={styles.termActions}>
              <button
                className={styles.termActionBtn}
                onClick={() => playWord(w.word_en, w.audio_url)}
                title="Play audio"
              >
                <Volume2 size={14} strokeWidth={2} />
              </button>
              <button
                className={`${styles.termActionBtn} ${starred.has(w.id) ? styles.starActive : ''}`}
                onClick={() => toggleStar(w.id)}
                title={starred.has(w.id) ? 'Unstar' : 'Star'}
              >
                <Star size={14} strokeWidth={2} fill={starred.has(w.id) ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Toast message="Copied!" visible={toastVisible} />
    </div>
  )
}
