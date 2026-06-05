import { useState, useEffect } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { Layers, Brain, Volume2, Smartphone, GraduationCap, Infinity, ChevronRight, User } from 'lucide-react'
import { STARTER_PACK_ID } from '../data/starterPack'
import { finishLogin, getLinkedStudentId, isLinkedAccount } from '../utils/auth'
import styles from './LoginPage.module.css'

function decodeJwt(token: string) {
  const payload = token.split('.')[1]!
  return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
}

interface GoogleUser {
  name: string
  email: string
  picture: string
}

const FEATURES = [
  { Icon: Layers,        text: '6 study modes — Flashcards, Match, Learn, Test, Blocks, Blast' },
  { Icon: Brain,         text: 'Spaced repetition (FSRS) — remember words long-term' },
  { Icon: Volume2,       text: 'Audio pronunciation on every card' },
  { Icon: Smartphone,    text: 'Study on web or Telegram — progress syncs automatically' },
  { Icon: GraduationCap, text: 'Teacher assigns words directly to your account' },
  { Icon: Infinity,      text: 'Everything free — no paywalls, no limits' },
]

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''
const GOOGLE_WORKS = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID')

export function LoginPage() {
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null)
  const [studentId, setStudentId] = useState('')
  const [googleFailed, setGoogleFailed] = useState(!GOOGLE_WORKS)
  const [name, setName] = useState('')
  const [autoFilled, setAutoFilled] = useState(false)

  useEffect(() => {
    if (!GOOGLE_WORKS) setGoogleFailed(true)
    if (isLinkedAccount()) {
      window.location.href = '/'
      return
    }
    const savedId = getLinkedStudentId()
    if (savedId) setStudentId(String(savedId))
  }, [])

  useEffect(() => {
    if (googleUser?.email) {
      autoFillStudentId(googleUser.email)
    }
  }, [googleUser?.email])

  function proceedHome(user: GoogleUser, id: string) {
    if (!finishLogin(user, id)) return
    window.location.href = '/'
  }

  function handleGoogleSuccess(credentialResponse: { credential?: string }) {
    const credential = credentialResponse.credential
    if (!credential) return
    const payload = decodeJwt(credential)
    const user = { name: payload.name ?? '', email: payload.email ?? '', picture: payload.picture ?? '' }
    setGoogleUser(user)

    const existing = getLinkedStudentId()
    if (existing) {
      proceedHome(user, String(existing))
    }
  }

  function handleGoogleError() {
    setGoogleFailed(true)
  }

  async function autoFillStudentId(email: string) {
    try {
      const res = await fetch(`https://english-bot.ohnedan.workers.dev/api/student-id?email=${encodeURIComponent(email)}`)
      const data = await res.json()
      if (data.studentId) {
        setStudentId(String(data.studentId))
        setAutoFilled(true)
        return true
      }
    } catch (e) {
      console.error('Error fetching student ID:', e)
    }
    setAutoFilled(false)
    return false
  }

  function handleLink(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = studentId.trim()
    if (!trimmed || !/^\d+$/.test(trimmed) || Number(trimmed) <= 0) return
    const user = googleUser ?? { name: name.trim() || 'Student', email: '', picture: '' }
    proceedHome(user, trimmed)
  }

  function handleBrowseGuest() {
    window.location.href = `/set/${STARTER_PACK_ID}`
  }

  const showStudentForm = googleFailed || !!googleUser

  return (
    <div className={styles.screen}>
      <div className={styles.inner}>

        <div className={styles.hero}>
          <div className={styles.badge}>Free Quizlet alternative</div>
          <h1 className={styles.heroTitle}>
            Study smarter.<br />Remember forever.
          </h1>
          <p className={styles.heroSub}>
            Everything Quizlet charges for — completely free.<br />
            Used by students and teachers worldwide.
          </p>
          <ul className={styles.features}>
            {FEATURES.map(({ Icon, text }) => (
              <li key={text} className={styles.feature}>
                <span className={styles.featureIcon}><Icon size={17} strokeWidth={1.8} /></span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.card}>
          <div className={styles.logo}>S</div>
          <h2 className={styles.cardTitle}>Studify Up</h2>
          <p className={styles.cardSub}>Study smarter. Remember forever.</p>

          <div className={styles.divider} />

          {!showStudentForm ? (
            <div className={styles.googleWrap}>
              <p className={styles.signInLabel}>Sign in to get started</p>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="filled_blue"
                shape="pill"
                size="large"
                width="280"
              />
              <p className={styles.hint}>Free forever · No credit card needed</p>
              <div className={styles.dividerOr}><span>or</span></div>
              <button type="button" className={styles.noGoogleBtn} onClick={() => setGoogleFailed(true)}>
                <User size={15} strokeWidth={2} /> Continue with Student ID
              </button>
              <button type="button" className={styles.skipButton} onClick={handleBrowseGuest}>
                Browse Starter Pack without signing in
              </button>
            </div>
          ) : (
            <form className={styles.step2} onSubmit={handleLink}>
              {googleUser ? (
                <div className={styles.userRow}>
                  {googleUser.picture && (
                    <img src={googleUser.picture} className={styles.userPic} alt="" referrerPolicy="no-referrer" />
                  )}
                  <div>
                    <div className={styles.userName}>{googleUser.name}</div>
                    <div className={styles.userEmail}>{googleUser.email}</div>
                  </div>
                </div>
              ) : (
                <div className={styles.noGoogleRow}>
                  <User size={20} strokeWidth={1.8} color="var(--text-muted)" />
                  <input
                    className={styles.nameInput}
                    type="text"
                    placeholder="Your name (optional)"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
              )}

              <p className={styles.step2Title}>Enter your Student ID</p>
              <p className={styles.hint}>Number from your teacher (Telegram bot)</p>
              <input
                className={styles.input}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="e.g. 123456789"
                value={studentId}
                onChange={e => setStudentId(e.target.value.replace(/\D/g, ''))}
                autoFocus
              />
              {autoFilled && <p className={styles.hint}>✅ Found linked Student ID</p>}
              <button className={styles.linkButton} type="submit" disabled={!studentId.trim()}>
                Start studying <ChevronRight size={14} strokeWidth={2} />
              </button>
              <button type="button" className={styles.skipButton} onClick={handleBrowseGuest}>
                Browse without signing in
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  )
}
