import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWords } from '../../hooks/useWords'
import styles from './Test.module.css'
import type { Word } from '../../types'
import { saveReview } from '../../api/client'

const QUESTION_COUNT = 5
const OPTIONS_COUNT = 4

interface Question {
  word: Word
  options: string[]
  correct: string
}

function buildQuestions(words: Word[]): Question[] {
  const shuffled = [...words].sort(() => 0.5 - Math.random())
  const pool = shuffled.slice(0, QUESTION_COUNT)
  return pool.map(word => {
    const correct = word.word_uk ?? word.word_en
    const distractors = words
      .filter(w => w.id !== word.id)
      .map(w => w.word_uk ?? w.word_en)
      .sort(() => 0.5 - Math.random())
      .slice(0, OPTIONS_COUNT - 1)
    const options = [correct, ...distractors].sort(() => 0.5 - Math.random())
    return { word, options, correct }
  })
}

export function Test() {
  const { setId } = useParams<{ setId: string }>()
  const navigate = useNavigate()
  const { words, loading } = useWords(setId ?? null)

  const questions = useMemo(
    () => (words.length >= 2 ? buildQuestions(words) : []),
    [words]
  )

  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [answers, setAnswers] = useState<boolean[]>([])
  const [done, setDone] = useState(false)

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
      setDone(true)
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
    setDone(false)
  }

  if (loading) return <div className={styles.loading}>Loading…</div>

  if (!words.length) return <div className={styles.loading}>No words in this set.</div>

  if (words.length < 2) return <div className={styles.loading}>Need at least 2 words to run a test.</div>

  if (done) {
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
