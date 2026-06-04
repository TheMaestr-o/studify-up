import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useWords } from '../../hooks/useWords'
import styles from './Blast.module.css'
import type { Word } from '../../types'

const SKINS = ['🚀', '🛸', '🛩️', '✈️']

const ASTEROID_COLORS = ['#0891B2', '#6366F1', '#0D9488', '#7C3AED']

interface Asteroid {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  text: string
  isCorrect: boolean
  color: string
  angle: number
  rotSpeed: number
}

interface GameQuestion {
  prompt: string
  correctAnswer: string
}

interface GameState {
  ship: { angle: number }
  asteroids: Asteroid[]
  score: number
  streak: number
  timeLeft: number
  phase: 'playing' | 'done'
  currentQ: GameQuestion | null
  asteroidCounter: number
  shakeUntil: number
}

// Static star positions (generated once)
const STARS = Array.from({ length: 80 }, () => ({
  x: Math.random(),
  y: Math.random(),
  r: Math.random() * 1.5 + 0.5,
  a: Math.random() * 0.6 + 0.4,
}))

function getMultiplier(streak: number): number {
  if (streak >= 8) return 2.0
  if (streak >= 5) return 1.6
  if (streak >= 3) return 1.4
  if (streak >= 2) return 1.2
  return 1.0
}

function pickDistractors(words: Word[], correctWord: Word, count: number): string[] {
  const pool = words.filter(w => w.id !== correctWord.id)
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count).map(w => w.word_uk ?? w.word_en)
}

function buildQuestion(words: Word[]): { q: GameQuestion; answers: string[] } | null {
  if (words.length < 2) return null
  const word = words[Math.floor(Math.random() * words.length)]!
  const correctAnswer = word.word_uk ?? word.word_en
  const prompt = word.word_en
  const distractors = pickDistractors(words, word, 3)
  // Pad if not enough words
  while (distractors.length < 3) {
    distractors.push(correctAnswer + ' ?')
  }
  const answers = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5)
  return { q: { prompt, correctAnswer }, answers }
}

function spawnAsteroid(
  id: number,
  text: string,
  isCorrect: boolean,
  color: string,
  canvasW: number,
  canvasH: number
): Asteroid {
  const edge = Math.floor(Math.random() * 4)
  let x: number, y: number, vx: number, vy: number
  const speed = 35 + Math.random() * 25
  const cx = canvasW / 2
  const cy = canvasH / 2

  if (edge === 0) { // top
    x = Math.random() * canvasW
    y = -50
  } else if (edge === 1) { // right
    x = canvasW + 50
    y = Math.random() * canvasH
  } else if (edge === 2) { // bottom
    x = Math.random() * canvasW
    y = canvasH + 50
  } else { // left
    x = -50
    y = Math.random() * canvasH
  }

  // Drift roughly toward center with some spread
  const dx = cx - x + (Math.random() - 0.5) * canvasW * 0.5
  const dy = cy - y + (Math.random() - 0.5) * canvasH * 0.5
  const len = Math.hypot(dx, dy) || 1
  vx = (dx / len) * speed
  vy = (dy / len) * speed

  return {
    id,
    x,
    y,
    vx,
    vy,
    radius: 44 + Math.random() * 12,
    text,
    isCorrect,
    color,
    angle: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.8,
  }
}

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#0D1136'
  ctx.fillRect(0, 0, w, h)
  for (const s of STARS) {
    ctx.beginPath()
    ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,255,255,${s.a})`
    ctx.fill()
  }
}

function drawShip(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  angle: number,
  skin: string,
  shaking: boolean
) {
  ctx.save()
  if (shaking) {
    ctx.translate(cx + (Math.random() - 0.5) * 6, cy + (Math.random() - 0.5) * 6)
  } else {
    ctx.translate(cx, cy)
  }
  ctx.rotate(angle + Math.PI / 2)

  // Draw triangle ship body
  const size = 22
  ctx.beginPath()
  ctx.moveTo(0, -size)
  ctx.lineTo(-size * 0.65, size * 0.8)
  ctx.lineTo(0, size * 0.4)
  ctx.lineTo(size * 0.65, size * 0.8)
  ctx.closePath()
  ctx.fillStyle = '#4255FF'
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Draw engine glow
  ctx.beginPath()
  ctx.arc(0, size * 0.4, 5, 0, Math.PI * 2)
  ctx.fillStyle = '#FFD000'
  ctx.fill()

  ctx.restore()

  // Draw skin emoji at center (after rotation reset)
  ctx.save()
  ctx.translate(cx, cy)
  ctx.font = '18px serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(skin, 0, 0)
  ctx.restore()
}

function drawAsteroid(ctx: CanvasRenderingContext2D, a: Asteroid) {
  ctx.save()
  ctx.translate(a.x, a.y)
  ctx.rotate(a.angle)

  // Rock shape — slightly irregular circle
  ctx.beginPath()
  const pts = 10
  for (let i = 0; i < pts; i++) {
    const theta = (i / pts) * Math.PI * 2
    const r = a.radius * (0.82 + 0.18 * Math.sin(i * 2.3 + 1.1))
    if (i === 0) ctx.moveTo(Math.cos(theta) * r, Math.sin(theta) * r)
    else ctx.lineTo(Math.cos(theta) * r, Math.sin(theta) * r)
  }
  ctx.closePath()
  ctx.fillStyle = a.color
  ctx.globalAlpha = 0.85
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.restore()

  // Draw text (no rotation so it's readable)
  const maxWidth = a.radius * 1.6
  const fontSize = Math.max(11, Math.min(14, a.radius * 0.32))
  ctx.save()
  ctx.font = `600 ${fontSize}px -apple-system, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#fff'

  // Word-wrap inside circle
  const words = a.text.split(' ')
  let lines: string[] = []
  let current = ''
  for (const w of words) {
    const test = current ? current + ' ' + w : w
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current)
      current = w
    } else {
      current = test
    }
  }
  if (current) lines.push(current)

  const lineH = fontSize + 3
  const totalH = lines.length * lineH
  const startY = a.y - totalH / 2 + lineH / 2
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i]!, a.x, startY + i * lineH)
  }
  ctx.restore()
}

function drawQuestion(ctx: CanvasRenderingContext2D, w: number, q: GameQuestion | null) {
  if (!q) return
  ctx.save()
  ctx.font = 'bold 20px -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  // Background pill
  const metrics = ctx.measureText(q.prompt)
  const pw = metrics.width + 40
  const ph = 38
  const px = (w - pw) / 2
  ctx.fillStyle = 'rgba(13,17,54,0.85)'
  ctx.beginPath()
  ctx.roundRect(px, 14, pw, ph, 10)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.fillStyle = '#fff'
  ctx.fillText(q.prompt, w / 2, 14 + (ph - 20) / 2)
  ctx.restore()
}

export function Blast() {
  const { setId } = useParams<{ setId: string }>()
  const navigate = useNavigate()
  const { words, loading } = useWords(setId ?? null)
  const [skin, setSkin] = useState(0)
  const [phase, setPhase] = useState<'start' | 'playing' | 'done'>('start')

  // UI state updated from game loop
  const [uiScore, setUiScore] = useState(0)
  const [uiTime, setUiTime] = useState(60)
  const [uiStreak, setUiStreak] = useState(0)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<GameState>({
    ship: { angle: 0 },
    asteroids: [],
    score: 0,
    streak: 0,
    timeLeft: 60,
    phase: 'playing',
    currentQ: null,
    asteroidCounter: 0,
    shakeUntil: 0,
  })

  const spawnQuestion = useCallback(() => {
    const result = buildQuestion(words)
    if (!result) return
    const { q, answers } = result
    const canvas = canvasRef.current
    if (!canvas) return
    const game = gameRef.current
    game.currentQ = q
    game.asteroidCounter += 4
    game.asteroids = answers.map((text, i) =>
      spawnAsteroid(
        game.asteroidCounter - 3 + i,
        text,
        text === q.correctAnswer,
        ASTEROID_COLORS[i % ASTEROID_COLORS.length]!,
        canvas.width,
        canvas.height
      )
    )
  }, [words])

  // Main game loop
  useEffect(() => {
    if (phase !== 'playing') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Size canvas
    canvas.width = canvas.offsetWidth
    canvas.height = 500

    const game = gameRef.current
    game.score = 0
    game.streak = 0
    game.timeLeft = 60
    game.phase = 'playing'
    game.asteroids = []
    game.asteroidCounter = 0
    game.ship.angle = 0
    game.shakeUntil = 0
    setUiScore(0)
    setUiTime(60)
    setUiStreak(0)

    // Spawn first question
    const firstResult = buildQuestion(words)
    if (firstResult) {
      game.currentQ = firstResult.q
      game.asteroidCounter = 4
      game.asteroids = firstResult.answers.map((text, i) =>
        spawnAsteroid(
          i,
          text,
          text === firstResult.q.correctAnswer,
          ASTEROID_COLORS[i % ASTEROID_COLORS.length]!,
          canvas.width,
          canvas.height
        )
      )
    }

    let animId: number
    let last = 0
    let timerAcc = 0
    let uiAcc = 0

    const loop = (ts: number) => {
      const dt = Math.min(ts - last, 50)
      last = ts
      timerAcc += dt
      uiAcc += dt

      if (game.phase === 'done') return

      // Countdown timer
      if (timerAcc >= 1000) {
        timerAcc -= 1000
        game.timeLeft--
        setUiTime(game.timeLeft)
        if (game.timeLeft <= 0) {
          game.phase = 'done'
          setUiScore(game.score)
          setPhase('done')
          return
        }
      }

      // Move asteroids
      const dtS = dt / 1000
      for (const a of game.asteroids) {
        a.x += a.vx * dtS
        a.y += a.vy * dtS
        a.angle += a.rotSpeed * dtS
      }

      // Remove asteroids that are far off screen and respawn if needed
      const margin = 120
      game.asteroids = game.asteroids.filter(
        a => a.x > -margin && a.x < canvas.width + margin && a.y > -margin && a.y < canvas.height + margin
      )

      // If all asteroids gone (drifted off), spawn fresh question
      if (game.asteroids.length === 0 && game.currentQ) {
        // Re-spawn same question with new positions
        const result = buildQuestion(words)
        if (result) {
          game.currentQ = result.q
          game.asteroidCounter += 4
          game.asteroids = result.answers.map((text, i) =>
            spawnAsteroid(
              game.asteroidCounter - 3 + i,
              text,
              text === result.q.correctAnswer,
              ASTEROID_COLORS[i % ASTEROID_COLORS.length]!,
              canvas.width,
              canvas.height
            )
          )
        }
      }

      // Throttle UI streak updates
      if (uiAcc >= 100) {
        uiAcc = 0
        setUiStreak(game.streak)
      }

      // Render
      const cw = canvas.width
      const ch = canvas.height
      drawBackground(ctx, cw, ch)

      const shaking = ts < game.shakeUntil

      // Ship at center
      drawShip(ctx, cw / 2, ch / 2, game.ship.angle, SKINS[skin]!, shaking)

      // Asteroids
      for (const a of game.asteroids) {
        drawAsteroid(ctx, a)
      }

      // Question prompt
      drawQuestion(ctx, cw, game.currentQ)

      animId = requestAnimationFrame(loop)
    }

    animId = requestAnimationFrame(loop)

    // Mouse tracking
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left - canvas.width / 2
      const my = e.clientY - rect.top - canvas.height / 2
      gameRef.current.ship.angle = Math.atan2(my, mx)
    }

    // Click to shoot
    const onClick = (e: MouseEvent) => {
      const g = gameRef.current
      if (g.phase === 'done') return
      const rect = canvas.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top
      const hit = g.asteroids.find(a => Math.hypot(a.x - cx, a.y - cy) < a.radius)
      if (!hit) return

      if (hit.isCorrect) {
        g.streak++
        g.score += Math.round(5 * getMultiplier(g.streak))
        setUiScore(g.score)
        setUiStreak(g.streak)
        // Remove all current asteroids and spawn next question
        g.asteroids = []
        const result = buildQuestion(words)
        if (result) {
          g.currentQ = result.q
          g.asteroidCounter += 4
          g.asteroids = result.answers.map((text, i) =>
            spawnAsteroid(
              g.asteroidCounter - 3 + i,
              text,
              text === result.q.correctAnswer,
              ASTEROID_COLORS[i % ASTEROID_COLORS.length]!,
              canvas.width,
              canvas.height
            )
          )
        }
      } else {
        g.score = Math.max(0, g.score - 2)
        g.streak = 0
        g.shakeUntil = performance.now() + 400
        setUiScore(g.score)
        setUiStreak(0)
      }
    }

    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('click', onClick)

    return () => {
      cancelAnimationFrame(animId)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('click', onClick)
    }
  }, [phase, words, skin, spawnQuestion])

  const handlePlay = () => {
    if (words.length < 2) return
    setPhase('playing')
  }

  const handlePlayAgain = () => {
    setPhase('playing')
  }

  const backBtn = (
    <button
      onClick={() => navigate(`/set/${setId}`)}
      style={{
        background: 'none',
        color: 'rgba(255,255,255,0.5)',
        fontSize: '14px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        cursor: 'pointer',
        border: 'none',
        padding: 0,
      }}
    >
      <ChevronLeft size={14} strokeWidth={2} /> Back to set
    </button>
  )

  if (loading) return <div className={styles.page}>{backBtn}<p>Loading…</p></div>

  if (phase === 'start') {
    return (
      <div className={styles.page}>
        {backBtn}
        <div className={styles.skinRow}>
          <button className={styles.arrow} onClick={() => setSkin(s => (s - 1 + SKINS.length) % SKINS.length)}>‹</button>
          <div className={styles.ship}>{SKINS[skin]}</div>
          <button className={styles.arrow} onClick={() => setSkin(s => (s + 1) % SKINS.length)}>›</button>
        </div>
        <h2>Play Blast!</h2>
        <p>Match definitions to the correct terms. Click the right asteroid before time runs out!</p>
        <button className={styles.btn} onClick={handlePlay} disabled={words.length < 2}>
          Play ({words.length} words)
        </button>
        <button className={styles.rules}>? Game rules</button>
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div className={styles.page}>
        {backBtn}
        <div className={styles.bigScore}>{uiScore}</div>
        <div className={styles.scoreLabel}>points</div>
        <h2>Time's up!</h2>
        <button className={styles.btn} onClick={handlePlayAgain}>Play again</button>
        <button className={styles.rules} onClick={() => navigate(`/set/${setId}`)}>Back to set</button>
      </div>
    )
  }

  // Playing phase
  const multiplier = getMultiplier(uiStreak)
  const minutes = 0
  const seconds = uiTime
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`

  return (
    <div className={styles.gameWrapper}>
      <div className={styles.canvasContainer}>
        <canvas ref={canvasRef} className={styles.canvas} />
        {/* HUD overlay */}
        <div className={styles.hud}>
          <div className={styles.hudScore}>Score: {uiScore}</div>
          <div className={styles.hudRight}>
            {uiStreak >= 2 && (
              <div className={styles.streakBadge}>
                🔥 x{multiplier.toFixed(1)}
              </div>
            )}
            <div className={`${styles.hudTimer} ${uiTime <= 10 ? styles.timerWarning : ''}`}>
              {timeStr}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
