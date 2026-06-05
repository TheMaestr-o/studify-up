import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Shuffle, Trophy, ChevronLeft } from 'lucide-react'
import { useWords } from '../../hooks/useWords'
import styles from './Match.module.css'
import type { MatchCard } from '../../types'
import { shuffleArray } from '../../utils/shuffle'

function makeBatch(words: { id: string; word_en: string; word_uk: string | null }[], batchIdx: number): MatchCard[] {
  const slice = words.slice(batchIdx * 6, batchIdx * 6 + 6)
  const terms: MatchCard[] = slice.map(w => ({ id: `t-${w.id}`, text: w.word_en, type: 'term', wordId: w.id, isMatched: false, isSelected: false, isWrong: false }))
  const defs: MatchCard[] = slice.map(w => ({ id: `d-${w.id}`, text: w.word_uk ?? w.word_en, type: 'definition', wordId: w.id, isMatched: false, isSelected: false, isWrong: false }))
  return shuffleArray([...terms, ...defs])
}

export function Match() {
  const { setId } = useParams<{ setId: string }>()
  const navigate = useNavigate()
  const { words, loading, error } = useWords(setId ?? null)
  const [phase, setPhase] = useState<'start' | 'playing' | 'done'>('start')
  const [batch, setBatch] = useState(0)
  const [cards, setCards] = useState<MatchCard[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [timeMs, setTimeMs] = useState(0)
  const [bestMs, setBestMs] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const startBatch = useCallback((b: number, ws: typeof words) => {
    setCards(makeBatch(ws, b))
    setSelected(null)
    timerRef.current = setInterval(() => setTimeMs(t => t + 100), 100)
  }, [])

  const startGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setBatch(0); setTimeMs(0); setPhase('playing')
    startBatch(0, words)
  }, [words, startBatch])

  // Stop timer whenever phase leaves 'playing'
  useEffect(() => {
    if (phase !== 'playing' && timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [phase])

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timeoutsRef.current.forEach(clearTimeout)
  }, [])

  const tapCard = useCallback((cardId: string) => {
    setCards(prev => {
      const card = prev.find(c => c.id === cardId)
      if (!card || card.isMatched) return prev
      if (!selected) { setSelected(cardId); return prev.map(c => ({ ...c, isSelected: c.id === cardId })) }
      const sel = prev.find(c => c.id === selected)!
      if (card.wordId === sel.wordId && card.type !== sel.type) {
        const matchedWordId = card.wordId
        const next = prev.map(c => c.wordId === matchedWordId ? { ...c, isMatched: true, isSelected: false } : c)
        timeoutsRef.current.push(setTimeout(() => {
          setCards(p => p.map(c => c.wordId === matchedWordId ? { ...c, isGone: true } : c))
        }, 300))
        setSelected(null)
        if (next.every(c => c.isMatched)) {
          if (timerRef.current) clearInterval(timerRef.current)
          const nextB = batch + 1
          if (nextB * 6 < words.length) {
            timeoutsRef.current.push(setTimeout(() => { setBatch(nextB); startBatch(nextB, words) }, 600))
          } else {
            setTimeMs(t => { setBestMs(b => b === null ? t : Math.min(b, t)); return t })
            setPhase('done')
          }
        }
        return next
      } else {
        setTimeMs(t => t + 1000)
        setSelected(null)
        const wrong = prev.map(c => c.id === card.id || c.id === selected ? { ...c, isWrong: true, isSelected: false } : c)
        timeoutsRef.current.push(setTimeout(() => setCards(p => p.map(c => ({ ...c, isWrong: false }))), 500))
        return wrong
      }
    })
  }, [selected, batch, words, startBatch])

  if (loading) return <div className={styles.loading}>Loading…</div>
  if (error) return (
    <div className={styles.center}>
      <button onClick={() => navigate(`/set/${setId}`)} style={{ background: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', border: 'none', padding: 0 }}>
        <ChevronLeft size={14} strokeWidth={2} /> Back
      </button>
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>Failed to load words.</p>
        <button onClick={() => window.location.reload()} style={{ marginTop: 16, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '24px', padding: '10px 24px', cursor: 'pointer' }}>Retry</button>
      </div>
    </div>
  )

  if (!words.length) return (
    <div className={styles.center}>
      <button onClick={() => navigate(`/set/${setId}`)} style={{ background: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', border: 'none', padding: 0 }}>
        <ChevronLeft size={14} strokeWidth={2} /> Back to set
      </button>
      <div style={{ textAlign: 'center', padding: '80px 24px', color: 'rgba(255,255,255,0.4)' }}>
        <p style={{ fontSize: 16 }}>No words in this set yet.</p>
        <p style={{ fontSize: 14, marginTop: 8 }}>Ask your teacher to add some words.</p>
      </div>
    </div>
  )

  const sec = (timeMs / 1000).toFixed(1)
  const totalBatches = Math.ceil(words.length / 6)

  if (phase === 'start') return (
    <div className={styles.center}>
      <button onClick={() => navigate(`/set/${setId}`)} style={{ background: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', border: 'none', padding: 0 }}>
        <ChevronLeft size={14} strokeWidth={2} /> Back to set
      </button>
      <Shuffle size={48} strokeWidth={1.4} color="var(--accent)" />
      <h2>Ready?</h2>
      <p>Match all terms and definitions as fast as you can. Wrong matches add 1 second.</p>
      <button className={styles.startBtn} onClick={startGame}>Start game</button>
    </div>
  )

  if (phase === 'done') return (
    <div className={styles.center}>
      <Trophy size={48} strokeWidth={1.4} color="var(--mastered)" />
      <h2>Done!</h2>
      <div className={styles.time}>{sec}s</div>
      {bestMs && <div className={styles.best}>Best: {(bestMs / 1000).toFixed(1)}s</div>}
      <button className={styles.startBtn} onClick={startGame}>Play again</button>
    </div>
  )

  return (
    <div className={styles.page}>
      <button onClick={() => navigate(`/set/${setId}`)} style={{ background: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', border: 'none', padding: 0 }}>
        <ChevronLeft size={14} strokeWidth={2} /> Back to set
      </button>
      <div className={styles.header}>
        <span className={styles.timer}>{sec}s</span>
        <span className={styles.round}>Round {batch + 1} / {totalBatches}</span>
      </div>
      <div className={styles.grid}>
        {cards.map(c => (
          <button
            key={c.id}
            className={`${styles.tile} ${c.isSelected ? styles.sel : ''} ${c.isMatched ? styles.matched : ''} ${c.isGone ? styles.gone : ''} ${c.isWrong ? styles.wrong : ''}`}
            onClick={() => tapCard(c.id)}
            disabled={c.isMatched}
          >{c.text}</button>
        ))}
      </div>
    </div>
  )
}
