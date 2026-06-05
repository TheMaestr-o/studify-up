import { useState, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, LayoutGrid, Check, X, Zap } from 'lucide-react'
import { useWords } from '../../hooks/useWords'
import type { Word } from '../../types'
import styles from './Blocks.module.css'

// ─── Piece library ────────────────────────────────────────────────────────────

interface Piece {
  id: string
  shape: number[][]
  color: string
}

const PIECES: Piece[] = [
  { id: 'dot',  shape: [[1]],                      color: '#4255FF' },
  { id: 'h2',   shape: [[1,1]],                    color: '#6366F1' },
  { id: 'h3',   shape: [[1,1,1]],                  color: '#7C3AED' },
  { id: 'h4',   shape: [[1,1,1,1]],                color: '#2563EB' },
  { id: 'v2',   shape: [[1],[1]],                  color: '#0891B2' },
  { id: 'v3',   shape: [[1],[1],[1]],              color: '#0D9488' },
  { id: 'v4',   shape: [[1],[1],[1],[1]],          color: '#059669' },
  { id: 'sq2',  shape: [[1,1],[1,1]],              color: '#D97706' },
  { id: 'sq3',  shape: [[1,1,1],[1,1,1],[1,1,1]], color: '#B45309' },
  { id: 'L',    shape: [[1,0],[1,0],[1,1]],        color: '#DC2626' },
  { id: 'rL',   shape: [[0,1],[0,1],[1,1]],        color: '#DB2777' },
  { id: 'J',    shape: [[1,1],[1,0],[1,0]],        color: '#9333EA' },
  { id: 'T',    shape: [[1,1,1],[0,1,0]],          color: '#EA580C' },
  { id: 'S',    shape: [[0,1,1],[1,1,0]],          color: '#16A34A' },
  { id: 'Z',    shape: [[1,1,0],[0,1,1]],          color: '#2563EB' },
]

const GRID = 8

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomPieces(count = 3): Piece[] {
  const shuffled = [...PIECES].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

function canPlace(board: (string | null)[][], piece: Piece, row: number, col: number): boolean {
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r]!.length; c++) {
      if (!piece.shape[r]![c]) continue
      const br = row + r
      const bc = col + c
      if (br < 0 || br >= GRID || bc < 0 || bc >= GRID) return false
      if (board[br]![bc] !== null) return false
    }
  }
  return true
}

function placePiece(board: (string | null)[][], piece: Piece, row: number, col: number): (string | null)[][] {
  const next = board.map(r => [...r])
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r]!.length; c++) {
      if (piece.shape[r]![c]) {
        next[row + r]![col + c] = piece.color
      }
    }
  }
  return next
}

function clearLines(board: (string | null)[][]): { board: (string | null)[][]; linesCleared: number } {
  let next = board.map(r => [...r])
  let linesCleared = 0

  // Find full rows
  const fullRows: number[] = []
  for (let r = 0; r < GRID; r++) {
    if (next[r]!.every(cell => cell !== null)) fullRows.push(r)
  }

  // Find full cols
  const fullCols: number[] = []
  for (let c = 0; c < GRID; c++) {
    if (next.every(row => row[c] !== null)) fullCols.push(c)
  }

  // Clear them
  for (const r of fullRows) {
    for (let c = 0; c < GRID; c++) next[r]![c] = null
  }
  for (const c of fullCols) {
    for (let r = 0; r < GRID; r++) next[r]![c] = null
  }

  linesCleared = fullRows.length + fullCols.length
  return { board: next, linesCleared }
}

function anyPieceFits(board: (string | null)[][], pieces: Piece[]): boolean {
  for (const piece of pieces) {
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        if (canPlace(board, piece, r, c)) return true
      }
    }
  }
  return false
}

function makeQuestion(words: Word[]): { word: Word; options: string[]; correct: string } | null {
  if (words.length < 2) return null
  const word = words[Math.floor(Math.random() * words.length)]!
  const correct = word.word_uk ?? word.word_en
  const distractors = words
    .filter(w => w.id !== word.id)
    .map(w => w.word_uk ?? w.word_en)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
  const options = [correct, ...distractors].sort(() => Math.random() - 0.5)
  return { word, options, correct }
}

function emptyBoard(): (string | null)[][] {
  return Array(GRID).fill(null).map(() => Array(GRID).fill(null))
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Blocks() {
  const { setId } = useParams<{ setId: string }>()
  const navigate = useNavigate()
  const { words, loading } = useWords(setId ?? null)

  // Game state
  const [started, setStarted] = useState(false)
  const [board, setBoard] = useState<(string | null)[][]>(emptyBoard)
  const [tray, setTray] = useState<Piece[]>([])
  const [phase, setPhase] = useState<'placing' | 'question' | 'gameover'>('placing')
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [question, setQuestion] = useState<{ word: Word; options: string[]; correct: string } | null>(null)
  const [qFeedback, setQFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [hover, setHover] = useState<{ row: number; col: number } | null>(null)

  // Start game
  const startGame = useCallback(() => {
    setBoard(emptyBoard())
    setTray(randomPieces(3))
    setPhase('placing')
    setSelectedIdx(null)
    setScore(0)
    setQuestion(null)
    setQFeedback(null)
    setHover(null)
    setStarted(true)
  }, [])

  // Select piece from tray
  const handleSelectPiece = (idx: number) => {
    if (phase !== 'placing') return
    setSelectedIdx(prev => (prev === idx ? null : idx))
    setHover(null)
  }

  // Place selected piece on board
  const handleCellClick = (row: number, col: number) => {
    if (phase !== 'placing' || selectedIdx === null) return
    const piece = tray[selectedIdx]
    if (!piece) return
    if (!canPlace(board, piece, row, col)) return

    let newBoard = placePiece(board, piece, row, col)
    const { board: cleared, linesCleared } = clearLines(newBoard)
    newBoard = cleared

    const lineScore = linesCleared > 0 ? linesCleared * 10 * linesCleared : 0
    const newScore = score + 1 + lineScore

    const newTray = tray.filter((_, i) => i !== selectedIdx)
    setBoard(newBoard)
    setScore(newScore)
    setSelectedIdx(null)
    setHover(null)

    if (newTray.length === 0) {
      // All pieces placed — show question
      const q = makeQuestion(words)
      setQuestion(q)
      setPhase('question')
      setTray([])
    } else {
      setTray(newTray)
      // Check if remaining pieces can fit
      if (!anyPieceFits(newBoard, newTray)) {
        setPhase('gameover')
      }
    }
  }

  // Answer vocabulary question
  const handleAnswer = (answer: string) => {
    if (!question || qFeedback) return
    const ok = answer === question.correct
    setQFeedback(ok ? 'correct' : 'wrong')
    if (ok) {
      setTimeout(() => {
        const newTray = randomPieces(3)
        setTray(newTray)
        setPhase('placing')
        setQuestion(null)
        setQFeedback(null)
        setSelectedIdx(null)
        // Check if new pieces fit
        if (!anyPieceFits(board, newTray)) {
          setPhase('gameover')
        }
      }, 800)
    } else {
      // Wrong answer: dismiss after short delay but still deal pieces (penalize via no bonus)
      setTimeout(() => {
        const newTray = randomPieces(3)
        setTray(newTray)
        setPhase('placing')
        setQuestion(null)
        setQFeedback(null)
        setSelectedIdx(null)
        if (!anyPieceFits(board, newTray)) {
          setPhase('gameover')
        }
      }, 1400)
    }
  }

  // Ghost preview cells
  const ghostCells = useMemo<Set<string>>(() => {
    if (selectedIdx === null || !hover) return new Set()
    const piece = tray[selectedIdx]
    if (!piece) return new Set()
    if (!canPlace(board, piece, hover.row, hover.col)) return new Set()
    const cells = new Set<string>()
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r]!.length; c++) {
        if (piece.shape[r]![c]) {
          cells.add(`${hover.row + r},${hover.col + c}`)
        }
      }
    }
    return cells
  }, [selectedIdx, hover, tray, board])

  const ghostColor = useMemo(() => {
    if (selectedIdx === null) return null
    return tray[selectedIdx]?.color ?? null
  }, [selectedIdx, tray])

  // ─── Render: not started ──────────────────────────────────────────────────

  if (!started) {
    if (loading) return <div className={styles.loading}>Loading…</div>
    if (!words.length) return <div className={styles.loading}>No words in this set.</div>
    if (words.length < 2) return <div className={styles.loading}>Need at least 2 words to play Blocks.</div>
    return (
      <div className={styles.splash}>
        <button onClick={() => navigate(`/set/${setId}`)} className={styles.back}><ChevronLeft size={14} strokeWidth={2} /> Back to set</button>
        <div className={styles.splashIcon}><LayoutGrid size={48} strokeWidth={1.4} /></div>
        <h2>Blocks</h2>
        <p>Place pieces on the 8×8 grid. Fill rows and columns to clear them. Answer vocabulary questions to earn more pieces!</p>
        <button className={styles.startBtn} onClick={startGame}>
          Play ({words.length} words)
        </button>
      </div>
    )
  }

  // ─── Render: game over ────────────────────────────────────────────────────

  if (phase === 'gameover') {
    return (
      <div className={styles.splash}>
        <div className={styles.splashIcon}><Zap size={48} strokeWidth={1.4} /></div>
        <h2>Game Over</h2>
        <p className={styles.finalScore}>Score: <strong>{score}</strong></p>
        <button className={styles.startBtn} onClick={startGame}>Play Again</button>
        <button className={styles.backBtn} onClick={() => navigate(`/set/${setId}`)}><ChevronLeft size={14} strokeWidth={2} /> Back to set</button>
      </div>
    )
  }

  // ─── Render: game ─────────────────────────────────────────────────────────

  return (
    <div className={styles.game}>
      {/* Top bar */}
      <div className={styles.topbar}>
        <button onClick={() => navigate(`/set/${setId}`)} className={styles.back}><ChevronLeft size={14} strokeWidth={2} /> Back</button>
        <div className={styles.scoreBox}>Score: <strong>{score}</strong></div>
      </div>

      {/* Board */}
      <div
        className={styles.board}
        onMouseLeave={() => setHover(null)}
      >
        {Array.from({ length: GRID }, (_, r) =>
          Array.from({ length: GRID }, (_, c) => {
            const color = board[r]![c]
            const ghostKey = `${r},${c}`
            const isGhost = ghostCells.has(ghostKey)
            return (
              <div
                key={`${r}-${c}`}
                className={`${styles.cell} ${color ? styles.filled : ''} ${isGhost ? styles.ghost : ''}`}
                style={{
                  background: color ?? (isGhost ? ghostColor + '55' : undefined),
                  borderColor: isGhost ? ghostColor + 'aa' : undefined,
                }}
                onClick={() => handleCellClick(r, c)}
                onMouseEnter={() => selectedIdx !== null && setHover({ row: r, col: c })}
              />
            )
          })
        )}
      </div>

      {/* Piece tray */}
      <div className={styles.tray}>
        {[0, 1, 2].map(i => {
          const piece = tray[i]
          return (
            <div
              key={i}
              className={`${styles.traySlot} ${piece && selectedIdx === i ? styles.selected : ''} ${!piece ? styles.empty : ''}`}
              onClick={() => piece && handleSelectPiece(i)}
            >
              {piece && (
                <div
                  className={styles.mini}
                  style={{ gridTemplateColumns: `repeat(${piece.shape[0]!.length}, 1fr)` }}
                >
                  {piece.shape.flatMap((row, r) =>
                    row.map((cell, c) => (
                      <div
                        key={`${r}-${c}`}
                        className={styles.miniCell}
                        style={{ background: cell ? piece.color : 'transparent' }}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Hint */}
      {selectedIdx !== null && (
        <p className={styles.hint}>Click a cell on the board to place the piece</p>
      )}
      {selectedIdx === null && phase === 'placing' && tray.length > 0 && (
        <p className={styles.hint}>Select a piece from the tray</p>
      )}

      {/* Question overlay */}
      {phase === 'question' && question && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className={styles.modalLabel}>Vocabulary Check</div>
            <div className={styles.modalPrompt}>{question.word.word_en}</div>
            <div className={styles.modalOpts}>
              {question.options.map(opt => (
                <button
                  key={opt}
                  className={`${styles.modalOpt}
                    ${qFeedback && opt === question.correct ? styles.optCorrect : ''}
                    ${qFeedback === 'wrong' && opt !== question.correct ? styles.optWrong : ''}`}
                  onClick={() => handleAnswer(opt)}
                  disabled={!!qFeedback}
                >
                  {opt}
                </button>
              ))}
            </div>
            {qFeedback === 'correct' && <div className={styles.qMsg}><Check size={14} strokeWidth={2.5} style={{ verticalAlign: 'middle', marginRight: 4 }} />Correct! 3 new pieces coming…</div>}
            {qFeedback === 'wrong' && <div className={styles.qMsgWrong}><X size={14} strokeWidth={2.5} style={{ verticalAlign: 'middle', marginRight: 4 }} />Wrong. Correct: <strong>{question.correct}</strong></div>}
          </div>
        </div>
      )}
    </div>
  )
}
