import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWords } from '../../hooks/useWords'
import styles from './Flashcards.module.css'
import { saveReview } from '../../api/client'
import { playWord } from '../../utils/audio'

export function Flashcards() {
  const { setId } = useParams<{ setId: string }>()
  const navigate = useNavigate()
  const { words, loading, error } = useWords(setId ?? null)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState<Set<string>>(new Set())
  const [learning, setLearning] = useState<Set<string>>(new Set())

  const word = words[index]
  const total = words.length
  const cardStartRef = useRef(Date.now())

  const next = useCallback(() => { cardStartRef.current = Date.now(); setIndex(i => Math.min(i + 1, total - 1)); setFlipped(false) }, [total])
  const prev = useCallback(() => { cardStartRef.current = Date.now(); setIndex(i => Math.max(i - 1, 0)); setFlipped(false) }, [])

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); setFlipped(f => !f) }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [next, prev])

  const allReviewed = known.size + learning.size >= total && total > 0

  const reset = () => {
    setIndex(0)
    setFlipped(false)
    setKnown(new Set())
    setLearning(new Set())
  }

  if (loading) return <div className={styles.loading}>Loading…</div>
  if (error) return (
    <div className={styles.page}>
      <button onClick={() => navigate(`/set/${setId}`)} style={{ background: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', border: 'none', padding: 0 }}>
        ← Back
      </button>
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>Failed to load words.</p>
        <button onClick={() => window.location.reload()} style={{ marginTop: 16, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '24px', padding: '10px 24px', cursor: 'pointer' }}>Retry</button>
      </div>
    </div>
  )
  if (!word && !allReviewed) return (
    <div className={styles.page}>
      <button onClick={() => navigate(`/set/${setId}`)} style={{ background: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', border: 'none', padding: 0 }}>
        ← Back to set
      </button>
      <div style={{ textAlign: 'center', padding: '80px 24px', color: 'rgba(255,255,255,0.4)' }}>
        <p style={{ fontSize: 16 }}>No words in this set yet.</p>
        <p style={{ fontSize: 14, marginTop: 8 }}>Ask your teacher to add some words.</p>
      </div>
    </div>
  )

  if (allReviewed) return (
    <div className={styles.page}>
      <button onClick={() => navigate(`/set/${setId}`)} style={{ background: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', border: 'none', padding: 0 }}>
        ← Back to set
      </button>
      <div className={styles.done}>
        <div className={styles.doneEmoji}>🎉</div>
        <h2 className={styles.doneTitle}>Round complete!</h2>
        <div className={styles.doneStats}>
          <div className={styles.doneStat}>
            <span className={styles.doneStatNum} style={{ color: 'var(--mastered)' }}>{known.size}</span>
            <span className={styles.doneStatLabel}>Know it</span>
          </div>
          <div className={styles.doneStat}>
            <span className={styles.doneStatNum} style={{ color: 'var(--learned)' }}>{learning.size}</span>
            <span className={styles.doneStatLabel}>Still learning</span>
          </div>
        </div>
        {learning.size > 0 && (
          <button className={styles.btnStudyAgain} onClick={reset}>
            Study again ({learning.size} remaining)
          </button>
        )}
        <button className={styles.btnBack} onClick={() => navigate(`/set/${setId}`)}>
          Back to set
        </button>
      </div>
    </div>
  )

  return (
    <div className={styles.page}>
      <button onClick={() => navigate(`/set/${setId}`)} style={{ background: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', border: 'none', padding: 0 }}>
        ← Back to set
      </button>
      <div className={styles.progress}>
        <div className={styles.bar}>
          <div className={styles.barMastered} style={{ width: `${(known.size / total) * 100}%` }} />
          <div className={styles.barFamiliar} style={{ width: `${(learning.size / total) * 100}%` }} />
        </div>
        <span className={styles.counter}>{index + 1} / {total}</span>
      </div>

      <div className={`${styles.cardWrap} ${flipped ? styles.flipped : ''}`} onClick={() => setFlipped(f => !f)}>
        <div className={styles.card}>
          <div className={styles.front}>
            <div className={styles.lang}>EN</div>
            <div className={styles.term}>{word.word_en}</div>
            <button className={styles.audio} onClick={e => { e.stopPropagation(); playWord(word.word_en, word.audio_url) }}>🔊</button>
            <div className={styles.tapHint}>tap to flip</div>
          </div>
          <div className={styles.back}>
            <div className={styles.lang}>UA</div>
            <div className={styles.term}>{word.word_uk ?? '—'}</div>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.btnLearning} onClick={() => {
          const userId = localStorage.getItem('userId')
          if (userId) saveReview(Number(userId), { setId: setId!, wordId: word.id, correct: false, responseTimeMs: Date.now() - cardStartRef.current })
          setLearning(s => new Set([...s, word.id])); setKnown(k => { const n = new Set(k); n.delete(word.id); return n }); next()
        }}>↩ Still Learning</button>
        <div className={styles.nav}>
          <button className={styles.navBtn} onClick={prev}>‹</button>
          <button className={styles.navBtn} onClick={next}>›</button>
        </div>
        <button className={styles.btnKnow} onClick={() => {
          const userId = localStorage.getItem('userId')
          if (userId) saveReview(Number(userId), { setId: setId!, wordId: word.id, correct: true, responseTimeMs: Date.now() - cardStartRef.current })
          setKnown(k => new Set([...k, word.id])); setLearning(s => { const n = new Set(s); n.delete(word.id); return n }); next()
        }}>Know it ✓</button>
      </div>
    </div>
  )
}
