import { useState, useEffect } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { Layers, Brain, Volume2, Smartphone, GraduationCap, Infinity, ChevronRight, User } from 'lucide-react'
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

  // Detect if we're on production with broken Google OAuth
  useEffect(() => {
    if (!GOOGLE_WORKS) setGoogleFailed(true)
  }, [])

  function handleGoogleSuccess(credentialResponse: { credential?: string }) {
    const credential = credentialResponse.credential
    if (!credential) return
    const payload = decodeJwt(credential)
    setGoogleUser({ name: payload.name ?? '', email: payload.email ?? '', picture: payload.picture ?? '' })
  }

  function handleGoogleError() {
    setGoogleFailed(true)
  }

  function handleLink(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = studentId.trim()
    if (!trimmed) return
    const user = googleUser ?? { name: name.trim() || 'Student', email: '', picture: '' }
    localStorage.setItem('googleUser', JSON.stringify(user))
    localStorage.setItem('userId', trimmed)
    window.location.href = '/'
  }

  function handleSkip() {
    const user = googleUser ?? { name: name.trim() || 'Student', email: '', picture: '' }
    localStorage.setItem('googleUser', JSON.stringify(user))
    localStorage.setItem('userId', '0')
    window.location.href = '/'
  }

  const showStudentForm = googleFailed || !!googleUser

  return (
    <div className={styles.screen}>
      <div className={styles.inner}>

        {/* LEFT: Hero */}
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

        {/* RIGHT: Sign-in card */}
        <div className={styles.card}>
          <div className={styles.logo}>S</div>
          <h2 className={styles.cardTitle}>Studify Up</h2>
          <p className={styles.cardSub}>Study smarter. Remember forever.</p>

          <div className={styles.divider} />

          {!showStudentForm ? (
            /* Step 1: Google sign-in */
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
              <button className={styles.noGoogleBtn} onClick={() => setGoogleFailed(true)}>
                Continue without Google
              </button>
            </div>
          ) : (
            /* Step 2: Student ID form */
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
              <p className={styles.hint}>Your teacher will send you this number</p>
              <input
                className={styles.input}
                type="text"
                inputMode="numeric"
                placeholder="e.g. 123456789"
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                autoFocus
              />
              <button className={styles.linkButton} type="submit">
                Start studying <ChevronRight size={14} strokeWidth={2} />
              </button>
              <button type="button" className={styles.skipButton} onClick={handleSkip}>
                Skip for now — explore the app
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  )
}
