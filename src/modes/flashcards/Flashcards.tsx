import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWords } from '../../hooks/useWords'
import styles from './Flashcards.module.css'
import { saveReview } from '../../api/client'

export function Flashcards() {
  const { setId } = useParams<{ setId: string }>()
  const navigate = useNavigate()
  const { words, loading } = useWords(setId ?? null)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState<Set<string>>(new Set())
  const [learning, setLearning] = useState<Set<string>>(new Set())

  const word = words[index]
  const total = words.length

  const next = useCallback(() => { setIndex(i => Math.min(i + 1, total - 1)); setFlipped(false) }, [total])
  const prev = useCallback(() => { setIndex(i => Math.max(i - 1, 0)); setFlipped(false) }, [])

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); setFlipped(f => !f) }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [next, prev])

  if (loading) return <div className={styles.loading}>Loading…</div>
  if (!word) return null

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
            {word.audio_url && (
              <button className={styles.audio} onClick={e => { e.stopPropagation(); new Audio(word.audio_url!).play() }}>🔊</button>
            )}
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
          if (userId) saveReview(Number(userId), { setId: setId!, wordId: word.id, correct: false, responseTimeMs: 500 })
          setLearning(s => new Set([...s, word.id])); setKnown(k => { const n = new Set(k); n.delete(word.id); return n }); next()
        }}>↩ Still Learning</button>
        <div className={styles.nav}>
          <button className={styles.navBtn} onClick={prev}>‹</button>
          <button className={styles.navBtn} onClick={next}>›</button>
        </div>
        <button className={styles.btnKnow} onClick={() => {
          const userId = localStorage.getItem('userId')
          if (userId) saveReview(Number(userId), { setId: setId!, wordId: word.id, correct: true, responseTimeMs: 500 })
          setKnown(k => new Set([...k, word.id])); setLearning(s => { const n = new Set(s); n.delete(word.id); return n }); next()
        }}>Know it ✓</button>
      </div>
    </div>
  )
}
