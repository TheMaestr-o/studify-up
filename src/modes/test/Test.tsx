import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWords } from '../../hooks/useWords'
import styles from './Test.module.css'
import type { Word } from '../../types'
import { saveReview } from '../../api/client'
import { shuffleArray } from '../../utils/shuffle'

const OPTIONS_COUNT = 4

interface Question {
  word: Word
  options: string[]
  correct: string
}

function buildQuestions(words: Word[], count: number): Question[] {
  const shuffled = shuffleArray(words)
  const pool = shuffled.slice(0, count)
  return pool.map(word => {
    const correct = word.word_uk ?? word.word_en
    // Build distractor pool — if fewer than OPTIONS_COUNT-1 unique distractors exist,
    // cycle through the word list again to fill the slots
    const otherWords = words.filter(w => w.id !== word.id)
    const distractorPool: string[] = []
    // Keep cycling until we have enough distractors (handles sets with < 4 words)
    while (distractorPool.length < OPTIONS_COUNT - 1) {
      const cycled = shuffleArray(otherWords)
        .map(w => w.word_uk ?? w.word_en)
      for (const d of cycled) {
        if (distractorPool.length < OPTIONS_COUNT - 1) {
          distractorPool.push(d)
        }
      }
      // Safety: if otherWords is empty, break
      if (otherWords.length === 0) break
    }
    const distractors = distractorPool.slice(0, OPTIONS_COUNT - 1)
    const options = shuffleArray([correct, ...distractors])
    return { word, options, correct }
  })
}

type Phase = 'setup' | 'testing' | 'done'

export function Test() {
  const { setId } = useParams<{ setId: string }>()
  const navigate = useNavigate()
  const { words, loading, error } = useWords(setId ?? null)

  const [phase, setPhase] = useState<Phase>('setup')
  const [questionCount, setQuestionCount] = useState(5)

  const questions = useMemo(
    () => (phase === 'testing' && words.length >= 2 ? buildQuestions(words, questionCount) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [phase, words, questionCount]
  )

  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [answers, setAnswers] = useState<boolean[]>([])

  const q = questions[current] ?? null

  const handleSelect = (opt: string) => {
    if (selected !== null) return
    setSelected(opt)
  }

  const handleNext = () => {
    if (selected === null || !q) return
    const correct = selected === q.correct
    const userId = localStorage.getItem('userId')
    if (userId) {
      saveReview(Number(userId), { setId: setId!, wordId: q.word.id, correct, responseTimeMs: 500 })
    }
    const nextAnswers = [...answers, correct]
    if (current + 1 >= questions.length) {
      setAnswers(nextAnswers)
      setPhase('done')
    } else {
      setAnswers(nextAnswers)
      setCurrent(c => c + 1)
      setSelected(null)
    }
  }

  const handleRestart = () => {
    setCurrent(0)
    setSelected(null)
    setAnswers([])
    setPhase('setup')
  }

  const handleStartTest = () => {
    setCurrent(0)
    setSelected(null)
    setAnswers([])
    setPhase('testing')
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

  if (words.length < 2) return <div className={styles.loading}>Need at least 2 words to run a test.</div>

  // Setup screen
  if (phase === 'setup') {
    const countOptions: Array<number | 'all'> = [5, 10, 20, 'all']
    const showAll = words.length <= 30
    return (
      <div className={styles.page}>
        <button onClick={() => navigate(`/set/${setId}`)} className={styles.backBtn}>
          ← Back to set
        </button>
        <div className={styles.setupCard}>
          <h2 className={styles.setupTitle}>Configure your test</h2>
          <div className={styles.setupSection}>
            <div className={styles.setupLabel}>Number of questions</div>
            <div className={styles.countButtons}>
              {countOptions.map(opt => {
                if (opt === 'all' && !showAll) return null
                const value = opt === 'all' ? words.length : opt
                const displayLabel = opt === 'all' ? `All (${words.length})` : String(opt)
                const isDisabled = opt !== 'all' && (opt as number) > words.length
                const isSelected = questionCount === value
                return (
                  <button
                    key={String(opt)}
                    className={`${styles.countBtn} ${isSelected ? styles.countBtnActive : ''}`}
                    onClick={() => setQuestionCount(value)}
                    disabled={isDisabled}
                  >
                    {displayLabel}
                  </button>
                )
              })}
            </div>
          </div>
          <button className={styles.startBtn} onClick={handleStartTest}>
            Start test →
          </button>
        </div>
      </div>
    )
  }

  // Done screen
  if (phase === 'done') {
    const score = answers.filter(Boolean).length
    const pct = Math.round((score / questions.length) * 100)
    return (
      <div className={styles.results}>
        <div className={styles.resultEmoji}>{pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '📖'}</div>
        <h2 className={styles.resultTitle}>Test complete!</h2>
        <div className={styles.score}>{score} / {questions.length} correct ({pct}%)</div>
        <div className={styles.breakdown}>
          {questions.map((question, i) => (
            <div key={question.word.id} className={`${styles.breakdownRow} ${answers[i] ? styles.bCorrect : styles.bWrong}`}>
              <span className={styles.bWord}>{question.word.word_en}</span>
              <span className={styles.bAnswer}>{answers[i] ? '✓' : '✗'} {question.correct}</span>
            </div>
          ))}
        </div>
        <button className={styles.btn} onClick={handleRestart}>Try again</button>
      </div>
    )
  }

  if (!q) return null

  return (
    <div className={styles.page}>
      <button onClick={() => navigate(`/set/${setId}`)} style={{ background: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', border: 'none', padding: 0 }}>
        ← Back to set
      </button>
      <div className={styles.progress}>
        <span>{current + 1} / {questions.length}</span>
        <div className={styles.bar}>
          <div className={styles.fill} style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.prompt}>{q.word.word_en}</div>
        <div className={styles.options}>
          {q.options.map(opt => {
            let cls = styles.opt
            if (selected !== null) {
              if (opt === q.correct) cls = `${styles.opt} ${styles.correct}`
              else if (opt === selected) cls = `${styles.opt} ${styles.wrong}`
            }
            return (
              <button
                key={opt}
                className={cls}
                onClick={() => handleSelect(opt)}
                disabled={selected !== null}
              >
                {opt}
              </button>
            )
          })}
        </div>
        {selected !== null && (
          <div className={styles.feedback}>
            {selected === q.correct
              ? <span className={styles.feedbackCorrect}>Correct!</span>
              : <span className={styles.feedbackWrong}>Correct answer: <strong>{q.correct}</strong></span>}
            <button className={styles.btn} onClick={handleNext}>
              {current + 1 < questions.length ? 'Next →' : 'See results'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
