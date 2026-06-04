import { useState, useMemo, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWords } from '../../hooks/useWords'
import styles from './Learn.module.css'
import type { MasteryLevel } from '../../types'
import { saveReview } from '../../api/client'
import { shuffleArray } from '../../utils/shuffle'

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i]![j] = a[i-1] === b[j-1] ? dp[i-1]![j-1]! : 1 + Math.min(dp[i-1]![j]!, dp[i]![j-1]!, dp[i-1]![j-1]!)
  return dp[a.length]![b.length]!
}

function isAccepted(input: string, correct: string): boolean {
  const a = input.trim().toLowerCase(), b = correct.trim().toLowerCase()
  if (a === b) return true
  const d = levenshtein(a, b)
  return d <= 1 || d / Math.max(a.length, b.length) <= 0.15
}

export function Learn() {
  const { setId } = useParams<{ setId: string }>()
  const navigate = useNavigate()
  const { words, loading, error } = useWords(setId ?? null)
  const [mastery, setMastery] = useState<Record<string, { level: MasteryLevel; streak: number }>>({})
  const [qType, setQType] = useState<'mc' | 'written'>('mc')
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [wrongAnswer, setWrongAnswer] = useState('')
  const [tick, setTick] = useState(0)

  const [wordIdx, setWordIdx] = useState(0)
  const questionStartRef = useRef(Date.now())

  const unmastered = useMemo(
    () => words.filter(w => (mastery[w.id]?.level ?? 'not_studied') !== 'mastered'),
    [words, mastery, tick]
  )

  useEffect(() => {
    if (!unmastered.length) return
    setWordIdx(Math.floor(Math.random() * unmastered.length))
  }, [tick, unmastered.length])

  const word = unmastered[wordIdx % Math.max(unmastered.length, 1)] ?? null

  useEffect(() => { questionStartRef.current = Date.now() }, [word])

  const opts = useMemo(() => {
    if (!word) return []
    const correct = word.word_uk ?? word.word_en
    const pool = words.filter(w => w.id !== word.id).map(w => w.word_uk ?? w.word_en)
    const distractors = shuffleArray(pool).slice(0, 3)
    return shuffleArray([correct, ...distractors])
  }, [word, words])

  const masteredCount = Object.values(mastery).filter(m => m.level === 'mastered').length

  const handleAnswer = (answer: string) => {
    if (!word || feedback) return
    const correct = word.word_uk ?? word.word_en
    const ok = qType === 'mc' ? answer === correct : isAccepted(answer, correct)
    const prev = mastery[word.id] ?? { level: 'not_studied' as MasteryLevel, streak: 0 }
    const userId = localStorage.getItem('userId')
    if (userId) {
      saveReview(Number(userId), { setId: setId!, wordId: word.id, correct: ok, responseTimeMs: Date.now() - questionStartRef.current })
    }
    if (ok) {
      const streak = prev.streak + 1
      const level: MasteryLevel = streak >= 2 ? 'mastered' : 'familiar'
      setMastery(m => ({ ...m, [word.id]: { level, streak } }))
      if (level === 'familiar') setQType('written')
      setFeedback('correct')
      setTimeout(() => { setFeedback(null); setInput(''); setTick(t => t + 1) }, 1200)
    } else {
      setMastery(m => ({ ...m, [word.id]: { level: 'not_studied', streak: 0 } }))
      setWrongAnswer(correct)
      setFeedback('wrong')
    }
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

  if (!words.length) return (
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

  if (unmastered.length === 0) return (
    <div className={styles.done}>
      <div>🎉</div>
      <h2>All {words.length} words mastered!</h2>
      <button className={styles.btn} onClick={() => { setMastery({}); setTick(0) }}>Study again</button>
    </div>
  )

  return (
    <div className={styles.page}>
      <button onClick={() => navigate(`/set/${setId}`)} style={{ background: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', border: 'none', padding: 0 }}>
        ← Back to set
      </button>
      <div className={styles.progress}>
        <span>{masteredCount} / {words.length} mastered</span>
        <div className={styles.bar}><div className={styles.fill} style={{ width: `${(masteredCount / words.length) * 100}%` }} /></div>
      </div>
      {word && (
        <div className={styles.card}>
          <div className={styles.prompt}>{word.word_en}</div>
          {word.audio_url && (
            <button
              className={styles.audio}
              onClick={() => new Audio(word.audio_url!).play()}
            >🔊</button>
          )}
          {qType === 'mc' ? (
            <div className={styles.options}>
              {opts.map(o => (
                <button
                  key={o}
                  className={`${styles.opt} ${feedback && o === (word.word_uk ?? word.word_en) ? styles.correct : ''}`}
                  onClick={() => handleAnswer(o)}
                  disabled={!!feedback}
                >{o}</button>
              ))}
            </div>
          ) : (
            <div className={styles.written}>
              <input
                className={`${styles.input} ${feedback === 'correct' ? styles.inputOk : ''} ${feedback === 'wrong' ? styles.inputBad : ''}`}
                value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAnswer(input)}
                placeholder="Type the translation…" disabled={!!feedback} autoFocus
              />
              <button className={styles.btn} onClick={() => handleAnswer(input)} disabled={!!feedback}>Check</button>
              {feedback === 'wrong' && (
                <>
                  <div className={styles.wrongMsg}>Correct: <strong>{wrongAnswer}</strong></div>
                  <button className={styles.override} onClick={() => { setMastery(m => ({ ...m, [word.id]: { level: 'familiar', streak: 1 } })); setFeedback(null); setInput(''); setTick(t => t + 1) }}>Override: I was right</button>
                  <button className={styles.next} onClick={() => { setFeedback(null); setInput(''); setTick(t => t + 1) }}>Next →</button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
